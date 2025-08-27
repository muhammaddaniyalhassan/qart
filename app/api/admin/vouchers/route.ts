import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Voucher from '@/models/Voucher'
import { z } from 'zod'

const createVoucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required').max(20, 'Voucher code too long'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(0, 'Discount value must be positive'),
  minimumOrderAmountCents: z.number().min(0, 'Minimum order amount must be positive'),
  maximumDiscountCents: z.number().min(0, 'Maximum discount must be positive').optional(),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1'),
  validFrom: z.string().min(1, 'Start date is required'),
  validUntil: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
})

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
    const vouchers = await Voucher.find()
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json({
      success: true,
      vouchers: vouchers.map(voucher => ({
        _id: voucher._id.toString(),
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minimumOrderAmountCents: voucher.minimumOrderAmountCents,
        maximumDiscountCents: voucher.maximumDiscountCents,
        usageLimit: voucher.usageLimit,
        usedCount: voucher.usedCount,
        validFrom: voucher.validFrom?.toISOString() || new Date().toISOString(),
        validUntil: voucher.validUntil?.toISOString() || new Date().toISOString(),
        isActive: voucher.isActive,
        applicableProducts: voucher.applicableProducts?.map((id: any) => id.toString()) || [],
        applicableCategories: voucher.applicableCategories || [],
        createdAt: voucher.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: voucher.updatedAt?.toISOString() || new Date().toISOString(),
      }))
    })
  } catch (error) {
    console.error('Admin vouchers API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch vouchers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 400 }
      )
    }

    await dbConnect()
    const body = await request.json()
    console.log('Voucher creation request body:', body)
    
    const validatedData = createVoucherSchema.parse(body)
    console.log('Validated voucher data:', validatedData)

    // Check if voucher code already exists
    const existingVoucher = await Voucher.findOne({ code: validatedData.code.toUpperCase() })
    if (existingVoucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher code already exists' },
        { status: 400 }
      )
    }

    // Validate dates
    const validFrom = new Date(validatedData.validFrom)
    const validUntil = new Date(validatedData.validUntil)
    
    if (validFrom >= validUntil) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate discount value based on type
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue > 100) {
      return NextResponse.json(
        { success: false, message: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    // Validate maximum discount
    if (validatedData.maximumDiscountCents && validatedData.maximumDiscountCents < validatedData.discountValue) {
      return NextResponse.json(
        { success: false, message: 'Maximum discount cannot be less than discount value' },
        { status: 400 }
      )
    }

    console.log('Creating voucher with data:', {
      ...validatedData,
      code: validatedData.code.toUpperCase(),
      validFrom,
      validUntil,
    })
    
    const voucher = await Voucher.create({
      ...validatedData,
      code: validatedData.code.toUpperCase(),
      validFrom,
      validUntil,
    })
    
    console.log('Voucher created successfully:', voucher)

    return NextResponse.json({
      success: true,
      voucher: {
        _id: voucher._id.toString(),
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minimumOrderAmountCents: voucher.minimumOrderAmountCents,
        maximumDiscountCents: voucher.maximumDiscountCents,
        usageLimit: voucher.usageLimit,
        usedCount: voucher.usedCount,
        validFrom: voucher.validFrom?.toISOString() || new Date().toISOString(),
        validUntil: voucher.validUntil?.toISOString() || new Date().toISOString(),
        isActive: voucher.isActive,
        applicableProducts: voucher.applicableProducts?.map((id: any) => id.toString()) || [],
        applicableCategories: voucher.applicableCategories || [],
        createdAt: voucher.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: voucher.updatedAt?.toISOString() || new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Admin voucher creation error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.errors)
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      console.error('Error details:', error.message)
      return NextResponse.json(
        { success: false, message: `Failed to create voucher: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create voucher' },
      { status: 500 }
    )
  }
}
