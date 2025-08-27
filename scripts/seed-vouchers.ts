import dbConnect from '../lib/db'
import Voucher from '../models/Voucher'

async function seedVouchers() {
  try {
    await dbConnect()
    console.log('Connected to database')

    // Clear existing vouchers
    await Voucher.deleteMany({})
    console.log('Cleared existing vouchers')

    // Create sample vouchers
    const vouchers = [
      {
        code: 'WELCOME20',
        description: 'Welcome discount - 20% off your first order',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minimumOrderAmountCents: 2000, // $20.00
        maximumDiscountCents: 5000, // $50.00 max
        usageLimit: 1000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      },
      {
        code: 'SAVE10',
        description: 'Save $10 on orders over $50',
        discountType: 'FIXED_AMOUNT',
        discountValue: 1000, // $10.00
        minimumOrderAmountCents: 5000, // $50.00
        usageLimit: 500,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        isActive: true,
      },
      {
        code: 'HALFOFF',
        description: '50% off on orders over $100',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        minimumOrderAmountCents: 10000, // $100.00
        maximumDiscountCents: 2500, // $25.00 max
        usageLimit: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        isActive: true,
      },
      {
        code: 'FREESHIP',
        description: 'Free shipping on orders over $75',
        discountType: 'FIXED_AMOUNT',
        discountValue: 800, // $8.00 shipping cost
        minimumOrderAmountCents: 7500, // $75.00
        usageLimit: 200,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 months
        isActive: true,
      },
      {
        code: 'NEWCUSTOMER',
        description: 'Special discount for new customers',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minimumOrderAmountCents: 1500, // $15.00
        usageLimit: 300,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 months
        isActive: true,
      }
    ]

    const createdVouchers = await Voucher.insertMany(vouchers)
    console.log(`Created ${createdVouchers.length} vouchers:`)
    
    createdVouchers.forEach(voucher => {
      console.log(`- ${voucher.code}: ${voucher.description}`)
    })

    console.log('Voucher seeding completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding vouchers:', error)
    process.exit(1)
  }
}

seedVouchers()




