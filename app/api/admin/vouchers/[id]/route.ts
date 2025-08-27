import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Voucher from '@/models/Voucher'
import { z } from 'zod'

const updateVoucherSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200, 'Description too long').optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().min(0, 'Discount value must be positive').optional(),
  minimumOrderAmountCents: z.number().min(0, 'Minimum order amount must be positive').optional(),
  maximumDiscountCents: z.number().min(0, 'Maximum discount must be positive').optional(),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1').optional(),
  validFrom: z.string().min(1, 'Start date is required').optional(),
  validUntil: z.string().min(1, 'End date is required').optional(),
  isActive: z.boolean().optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()
    const body = await request.json()
    const validatedData = updateVoucherSchema.parse(body)

    // Find the voucher first
    const voucher = await Voucher.findById(id)
    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher not found' },
        { status: 404 }
      )
    }

    // Validate dates if both are provided
    if (validatedData.validFrom && validatedData.validUntil) {
      const validFrom = new Date(validatedData.validFrom)
      const validUntil = new Date(validatedData.validUntil)
      
      if (validFrom >= validUntil) {
        return NextResponse.json(
          { success: false, message: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    // Validate discount value based on type
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue && validatedData.discountValue > 100) {
      return NextResponse.json(
        { success: false, message: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    // Validate maximum discount
    if (validatedData.maximumDiscountCents && validatedData.discountValue && validatedData.maximumDiscountCents < validatedData.discountValue) {
      return NextResponse.json(
        { success: false, message: 'Maximum discount cannot be less than discount value' },
        { status: 400 }
      )
    }

    // Update the voucher
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      id,
      {
        ...validatedData,
        validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
        updatedAt: new Date(),
      },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      voucher: {
        _id: updatedVoucher._id.toString(),
        code: updatedVoucher.code,
        description: updatedVoucher.description,
        discountType: updatedVoucher.discountType,
        discountValue: updatedVoucher.discountValue,
        minimumOrderAmountCents: updatedVoucher.minimumOrderAmountCents,
        maximumDiscountCents: updatedVoucher.maximumDiscountCents,
        usageLimit: updatedVoucher.usageLimit,
        usedCount: updatedVoucher.usedCount,
        validFrom: updatedVoucher.validFrom?.toISOString() || new Date().toISOString(),
        validUntil: updatedVoucher.validUntil?.toISOString() || new Date().toISOString(),
        isActive: updatedVoucher.isActive,
        applicableProducts: updatedVoucher.applicableProducts?.map((id: any) => id.toString()) || [],
        applicableCategories: updatedVoucher.applicableCategories || [],
        createdAt: updatedVoucher.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: updatedVoucher.updatedAt?.toISOString() || new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Admin voucher update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update voucher' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()
    const voucher = await Voucher.findByIdAndDelete(id)

    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Voucher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher deleted successfully'
    })
  } catch (error) {
    console.error('Admin voucher delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete voucher' },
      { status: 500 }
    )
  }
}
