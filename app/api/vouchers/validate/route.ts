import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Voucher from '@/models/Voucher'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const { code, orderAmountCents } = await request.json()

    if (!code || !orderAmountCents) {
      return NextResponse.json(
        { success: false, message: 'Voucher code and order amount are required' },
        { status: 400 }
      )
    }

    // Find the voucher
    const voucher = await Voucher.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    })

    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Invalid voucher code' },
        { status: 404 }
      )
    }

    // Check if voucher is valid
    const now = new Date()
    const isValid = (
      voucher.isActive &&
      now >= voucher.validFrom &&
      now <= voucher.validUntil &&
      voucher.usedCount < voucher.usageLimit
    )
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Voucher is not valid or has expired' },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (orderAmountCents < voucher.minimumOrderAmountCents) {
      return NextResponse.json({
        success: false,
        message: `Minimum order amount required: ${voucher.minimumOrderAmountCents / 100}`
      }, { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    
    if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = Math.floor((orderAmountCents * voucher.discountValue) / 100)
    } else {
      discountAmount = voucher.discountValue
    }

    // Apply maximum discount limit if set
    if (voucher.maximumDiscountCents && discountAmount > voucher.maximumDiscountCents) {
      discountAmount = voucher.maximumDiscountCents
    }

    if (discountAmount === 0) {
      return NextResponse.json(
        { success: false, message: 'Voucher cannot be applied to this order' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount,
        minimumOrderAmountCents: voucher.minimumOrderAmountCents,
        maximumDiscountCents: voucher.maximumDiscountCents,
      }
    })
  } catch (error) {
    console.error('Voucher validation error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to validate voucher' },
      { status: 500 }
    )
  }
}
