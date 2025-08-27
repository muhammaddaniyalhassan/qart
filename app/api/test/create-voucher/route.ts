import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Voucher from '@/models/Voucher'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Create a test voucher
    const testVoucher = await Voucher.create({
      code: 'TEST10',
      description: 'Test voucher - 10% off',
      discountType: 'PERCENTAGE',
      discountValue: 10, // 10%
      minimumOrderAmountCents: 1000, // PKR 10.00
      maximumDiscountCents: 5000, // PKR 50.00 max discount
      usageLimit: 100,
      usedCount: 0,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isActive: true,
    })

    console.log('Created test voucher:', testVoucher)

    return NextResponse.json({
      success: true,
      voucher: {
        code: testVoucher.code,
        description: testVoucher.description,
        discountType: testVoucher.discountType,
        discountValue: testVoucher.discountValue,
      }
    })
  } catch (error) {
    console.error('Error creating test voucher:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create test voucher' },
      { status: 500 }
    )
  }
}
