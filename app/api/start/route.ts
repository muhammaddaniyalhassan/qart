import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import CustomerLead from '@/models/CustomerLead'
import { z } from 'zod'

const startSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const validatedData = startSchema.parse(body)

    const customerLead = await CustomerLead.create({
      ...validatedData,
      tableNumber: '1', // single-table MVP
    })

    return NextResponse.json({
      success: true,
      customerLead: {
        _id: customerLead._id.toString(),
        name: customerLead.name,
        phone: customerLead.phone,
        email: customerLead.email,
        tableNumber: customerLead.tableNumber,
        createdAt: customerLead.createdAt
      }
    })
  } catch (error) {
    console.error('Start API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
