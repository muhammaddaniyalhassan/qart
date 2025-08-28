import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPusherServer } from '@/lib/pusher'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import CustomerLead from '@/models/CustomerLead'

export async function POST(request: NextRequest) {
  console.log('Stripe webhook: Received webhook request');
  
  // Check if webhook secret is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.log('Stripe webhook: Missing stripe signature');
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('Stripe webhook: Event verified, type:', event.type);
  } catch (err) {
    console.error('Stripe webhook: Signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    console.log('Stripe webhook: Connecting to database...');
    await dbConnect()
    console.log('Stripe webhook: Database connected successfully');

    if (event.type === 'checkout.session.completed') {
      console.log('Stripe webhook: Processing checkout.session.completed event');
      const session = event.data.object as any
      const orderId = session.metadata?.orderId
      console.log('Stripe webhook: Order ID from session:', orderId);

      if (orderId) {
        console.log('Stripe webhook: Updating order status for order:', orderId);
        // Update order status
        const order = await Order.findByIdAndUpdate(
          orderId,
          {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
          { new: true }
        ).populate('customerLeadId')

        if (order) {
          console.log('Stripe webhook: Order updated successfully:', {
            orderId: order._id,
            paymentStatus: order.paymentStatus,
            status: order.status
          });
          
          // Broadcast to kitchen display for paid orders
          console.log('Stripe webhook: Broadcasting to kitchen...');
          const pusherServer = getPusherServer();
          if (pusherServer) {
            await pusherServer.trigger('kitchen', 'kitchen.order_paid', {
              orderId: order._id.toString(),
              customerName: order.customerName,
              tableNumber: order.tableNumber,
              phone: order.customerPhone,
              email: order.customerEmail,
              items: order.items,
              totalCents: order.totalCents,
              orderNotes: order.orderNotes,
              createdAt: order.createdAt,
            })

            // Broadcast to admin panel for order status update
            console.log('Stripe webhook: Broadcasting to admin...');
            await pusherServer.trigger('admin', 'admin.order_paid', {
              orderId: order._id.toString(),
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
            })

            // Broadcast to order-specific channel
            console.log('Stripe webhook: Broadcasting to order channel...');
            await pusherServer.trigger(`order:${order._id}`, 'order.paid', {
              orderId: order._id.toString(),
              status: 'PAID',
            })
            
            console.log('Stripe webhook: All broadcasts completed successfully');
          }
        } else {
          console.log('Stripe webhook: Failed to update order - order not found');
        }
      } else {
        console.log('Stripe webhook: No order ID found in session metadata');
      }
    } else {
      console.log('Stripe webhook: Event type not handled:', event.type);
    }

    console.log('Stripe webhook: Webhook processed successfully');
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook: Processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
