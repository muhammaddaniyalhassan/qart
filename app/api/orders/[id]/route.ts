import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const { id } = await params
    const order = await Order.findById(id).populate('customerLeadId')
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id.toString(),
        items: order.items,
        totalCents: order.totalCents,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentRef: order.paymentRef,
        createdAt: order.createdAt,
        orderNotes: order.orderNotes,
        customerLead: {
          name: order.customerName,
          tableNumber: order.tableNumber,
          phone: order.customerPhone,
          email: order.customerEmail,
        }
      }
    })
  } catch (error) {
    console.error('Order API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
