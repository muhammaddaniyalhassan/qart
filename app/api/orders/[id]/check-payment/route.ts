import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { stripe } from '@/lib/stripe'
import { getPusherServer } from '@/lib/pusher'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Check payment API: Checking payment for order:', id);
    
    const body = await request.json()
    const { paymentRef } = body

    if (!paymentRef) {
      return NextResponse.json(
        { success: false, message: 'Payment reference required' },
        { status: 400 }
      )
    }

    await dbConnect()
    console.log('Check payment API: Database connected');

    // Check with Stripe
    console.log('Check payment API: Checking with Stripe for session:', paymentRef);
    const session = await stripe.checkout.sessions.retrieve(paymentRef)
    console.log('Check payment API: Stripe session status:', session.payment_status);

    if (session.payment_status === 'paid') {
      console.log('Check payment API: Payment confirmed, updating order');
      
      // Update order status
      const order = await Order.findByIdAndUpdate(
        id,
        {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          updatedAt: new Date(),
        },
        { new: true }
      ).populate('customerLeadId')

      if (order) {
        console.log('Check payment API: Order updated successfully');
        
        // Trigger real-time updates
        try {
          const pusherServer = getPusherServer();
          if (pusherServer) {
            // Broadcast to kitchen display for paid orders
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
            });

            // Broadcast to admin panel
            await pusherServer.trigger('admin', 'admin.order_paid', {
              orderId: order._id.toString(),
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
            });

            console.log('Check payment API: Real-time updates triggered');
          }
        } catch (error) {
          console.error('Check payment API: Error triggering real-time updates:', error);
          // Don't fail the payment check if real-time updates fail
        }

        return NextResponse.json({
          success: true,
          paymentStatus: 'PAID',
          message: 'Payment confirmed'
        })
      }
    }

    console.log('Check payment API: Payment still pending');
    return NextResponse.json({
      success: true,
      paymentStatus: 'PENDING',
      message: 'Payment pending'
    })

  } catch (error) {
    console.error('Check payment API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}

