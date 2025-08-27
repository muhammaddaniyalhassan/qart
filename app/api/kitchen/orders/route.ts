import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import CustomerLead from '@/models/CustomerLead'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      console.log('Kitchen API: Unauthorized access attempt');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Kitchen API: User authenticated:', session.user?.email);
    console.log('Kitchen API: Connecting to database...');
    await dbConnect()
    console.log('Kitchen API: Database connected successfully');

    console.log('Kitchen API: Fetching orders...');
    const orders = await Order.find({
      paymentStatus: 'PAID',
      status: 'CONFIRMED'
    })
    .populate('customerLeadId')
    .sort({ createdAt: -1 })
    .limit(50)

    console.log('Kitchen API: Found orders:', orders.length);

    const kitchenOrders = orders.map(order => {
      console.log('Kitchen API: Processing order:', order._id);
      console.log('Kitchen API: Order customer data:', {
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        tableNumber: order.tableNumber
      });
      
      const result = {
        orderId: order._id.toString(),
        customerName: order.customerName || 'Unknown Customer',
        tableNumber: order.tableNumber || 'No Table',
        phoneNumber: order.customerPhone || 'No Phone',
        email: order.customerEmail || 'No Email',
        items: order.items || [],
        totalCents: order.totalCents || 0,
        orderNotes: order.orderNotes,
        createdAt: order.createdAt || new Date(),
      };
      
      console.log('Kitchen API: Processed order result:', result);
      return result;
    })

    console.log('Kitchen API: Returning orders:', kitchenOrders.length);
    return NextResponse.json({
      success: true,
      orders: kitchenOrders
    })
  } catch (error) {
    console.error('Kitchen API: Error occurred:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
