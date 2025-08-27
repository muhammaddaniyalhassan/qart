import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        customerLead: {
          name: order.customerName || 'Unknown Customer',
          tableNumber: order.tableNumber || 'No Table',
          phone: order.customerPhone || 'No Phone',
          email: order.customerEmail || 'No Email',
        },
        items: order.items,
        totalCents: order.totalCents,
        status: order.status,
        paymentStatus: order.paymentStatus,
        discountCode: order.discountCode,
        discountCents: order.discountCents,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }))
    })
  } catch (error) {
    console.error('Admin orders API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
