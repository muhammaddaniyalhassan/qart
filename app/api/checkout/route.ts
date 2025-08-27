import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import CustomerLead from '@/models/CustomerLead';
import { stripe } from '@/lib/stripe';
import { pusherServer } from '@/lib/pusher';

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    priceCents: z.number(),
    quantity: z.number(),
    notes: z.string().optional()
  })),
  orderNotes: z.string().optional(),
  customerLeadId: z.string(),
  discountCents: z.number().optional(),
  voucherCode: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    console.log('Checkout API: Starting checkout process...');
    
    const body = await request.json();
    console.log('Checkout API: Request body:', body);
    
    const { items, orderNotes, customerLeadId, discountCents = 0, voucherCode } = checkoutSchema.parse(body);
    console.log('Checkout API: Parsed data:', { items: items.length, orderNotes, customerLeadId, discountCents, voucherCode });

    if (!customerLeadId) {
      console.log('Checkout API: Missing customerLeadId');
      return NextResponse.json(
        { error: 'Customer lead ID is required' },
        { status: 400 }
      );
    }

    console.log('Checkout API: Connecting to database...');
    await dbConnect();
    console.log('Checkout API: Database connected successfully');

    // Verify customer lead exists
    console.log('Checkout API: Looking up customer lead:', customerLeadId);
    const customerLead = await CustomerLead.findById(customerLeadId);
    console.log('Checkout API: Customer lead found:', customerLead ? 'Yes' : 'No');
    
    if (!customerLead) {
      console.log('Checkout API: Customer lead not found');
      return NextResponse.json(
        { error: 'Customer not found. Please start over.' },
        { status: 404 }
      );
    }

    console.log('Checkout API: Customer lead verified, processing order...');

    // Transform items to match order schema
    const orderItems = items.map(item => ({
      productId: item.productId,
      name: item.name,
      unitPriceCents: item.priceCents,
      quantity: item.quantity,
      lineTotalCents: item.priceCents * item.quantity,
      notes: item.notes || ''
    }));

    // Calculate totals
    const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const totalCents = Math.max(0, subtotalCents - discountCents);

    // Validate minimum amount for Stripe (minimum 50 cents USD)
    const totalUSD = totalCents / 100; // Convert cents to dollars
    if (totalUSD < 0.50) {
      console.log('Checkout API: Order total too low for Stripe:', totalUSD);
      return NextResponse.json(
        { error: 'Order total must be at least PKR 50.00 for payment processing' },
        { status: 400 }
      );
    }

    console.log('Checkout API: Order details calculated:', { 
      itemsCount: orderItems.length, 
      subtotalCents, 
      discountCents, 
      totalCents,
      totalUSD
    });

    // Create order in database
    console.log('Kitchen API: Creating order in database...');
    const order = await Order.create({
      customerLeadId,
      customerName: customerLead.name,
      customerPhone: customerLead.phone || 'No Phone',
      customerEmail: customerLead.email || 'No Email',
      tableNumber: customerLead.tableNumber || '1',
      status: 'NEW',
      paymentStatus: 'PENDING',
      paymentProvider: 'STRIPE',
      items: orderItems,
      subtotalCents,
      discountCents,
      totalCents,
      orderNotes,
      voucherCode: voucherCode || undefined, // Store voucher code if used
    });
    console.log('Checkout API: Order created successfully:', order._id);

    // Create Stripe checkout session
    console.log('Checkout API: Creating Stripe checkout session...');
    
    // Prepare line items for Stripe with discount applied
    let lineItems;
    
    if (discountCents > 0) {
      // Calculate the discount percentage
      const discountPercentage = (discountCents / subtotalCents) * 100;
      
      // Apply the discount proportionally to each line item
      lineItems = orderItems.map(item => {
        const itemTotal = item.unitPriceCents * item.quantity;
        const itemDiscount = Math.round((itemTotal * discountPercentage) / 100);
        const discountedUnitAmount = Math.round((item.unitPriceCents * (100 - discountPercentage)) / 100);
        
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: item.notes || undefined
            },
            unit_amount: Math.max(1, discountedUnitAmount) // Ensure minimum 1 cent
          },
          quantity: item.quantity
        };
      });
      
      // Add a line item to show the discount applied
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: voucherCode ? `Discount Applied (${voucherCode})` : 'Discount Applied',
            description: 'Voucher discount has been applied to your order'
          },
          unit_amount: 0 // Free line item to show discount was applied
        },
        quantity: 1
      });
    } else {
      // No discount - use original prices
      lineItems = orderItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.notes || undefined
          },
          unit_amount: item.unitPriceCents
        },
        quantity: item.quantity
      }));
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/order/${order._id}/confirm`,
      cancel_url: `${request.nextUrl.origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        customerLeadId: customerLeadId,
        currency: 'PKR',
        exchangeRate: '1 PKR = 0.0036 USD',
        discountCents: discountCents.toString(),
        voucherCode: voucherCode || ''
      }
    });
    
    console.log('Checkout API: Stripe session created:', session.id);

    // Update order with Stripe session ID
    console.log('Checkout API: Updating order with Stripe session ID...');
    await Order.findByIdAndUpdate(order._id, {
      paymentRef: session.id
    });
    console.log('Checkout API: Order updated with payment reference');

    // Trigger real-time updates
    console.log('Checkout API: Triggering real-time updates...');
    try {
      // Broadcast to admin panel
      await pusherServer.trigger('admin', 'admin.new_order', {
        orderId: order._id.toString(),
        customerName: customerLead.name,
        tableNumber: customerLead.tableNumber || '1',
        phone: customerLead.phone || 'No Phone',
        email: customerLead.email || 'No Email',
        items: orderItems,
        totalCents: order.totalCents,
        status: order.status,
        paymentStatus: order.paymentStatus,
        discountCode: voucherCode || undefined,
        discountCents: discountCents,
        orderNotes: orderNotes,
        createdAt: order.createdAt,
      });

      // Note: Kitchen will only receive orders when they are paid (via Stripe webhook)
      // This prevents showing unpaid orders in the kitchen display

      console.log('Checkout API: Real-time updates triggered successfully');
    } catch (error) {
      console.error('Checkout API: Error triggering real-time updates:', error);
      // Don't fail the checkout if real-time updates fail
    }

    console.log('Checkout API: Checkout completed successfully');
    return NextResponse.json({
      orderId: order._id,
      checkoutUrl: session.url
    });

  } catch (error) {
    console.error('Checkout API: Error occurred:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Checkout API: Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Check for specific error types
    if (error instanceof Error) {
      console.log('Checkout API: Error message:', error.message);
      if (error.message.includes('findById')) {
        return NextResponse.json(
          { error: 'Database model error - please contact support' },
          { status: 500 }
        );
      }
      if (error.message.includes('stripe')) {
        return NextResponse.json(
          { error: 'Payment service error - please try again' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Checkout failed - please try again' },
      { status: 500 }
    );
  }
}
