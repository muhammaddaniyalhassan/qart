import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import CustomerLead from '@/models/CustomerLead'

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
    const customers = await CustomerLead.find()
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json({
      success: true,
      customers: customers.map(customer => ({
        _id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        tableNumber: customer.tableNumber,
        createdAt: customer.createdAt,
      }))
    })
  } catch (error) {
    console.error('Admin customers API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
