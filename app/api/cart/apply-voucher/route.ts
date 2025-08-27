import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Voucher from '@/models/Voucher'
import { z } from 'zod'

const voucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required'),
  subtotalCents: z.number().min(0, 'Subtotal must be positive').int('Subtotal must be a whole number'),
})

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    console.log('Voucher API request body:', body);
    
    const { code, subtotalCents } = voucherSchema.parse(body)
    console.log('Parsed voucher data:', { code, subtotalCents });

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    })

    console.log('Found voucher:', voucher);

    if (!voucher) {
      console.log('Voucher not found or invalid for code:', code);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired voucher code' },
        { status: 400 }
      )
    }

    // Check if voucher usage limit exceeded
    if (voucher.usedCount >= voucher.usageLimit) {
      console.log('Voucher usage limit exceeded:', { usedCount: voucher.usedCount, usageLimit: voucher.usageLimit });
      return NextResponse.json(
        { success: false, message: 'Voucher usage limit exceeded' },
        { status: 400 }
      )
    }

    if (subtotalCents < voucher.minimumOrderAmountCents) {
      console.log('Subtotal too low:', { subtotalCents, minimumOrderAmountCents: voucher.minimumOrderAmountCents });
      return NextResponse.json(
        { success: false, message: `Minimum order amount is ${voucher.minimumOrderAmountCents / 100} PKR` },
        { status: 400 }
      )
    }

    let discountCents = 0

    if (voucher.discountType === 'PERCENTAGE') {
      discountCents = Math.round((subtotalCents * voucher.discountValue) / 100)
      if (voucher.maximumDiscountCents) {
        discountCents = Math.min(discountCents, voucher.maximumDiscountCents)
      }
    } else if (voucher.discountType === 'FIXED_AMOUNT') {
      discountCents = voucher.discountValue // discountValue is already in cents
    }

    console.log('Calculated discount:', { discountCents, discountType: voucher.discountType, discountValue: voucher.discountValue });

    return NextResponse.json({
      success: true,
      discountCents,
      voucher: {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      }
    })
  } catch (error) {
    console.error('Voucher API error:', error)
    
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.errors);
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
