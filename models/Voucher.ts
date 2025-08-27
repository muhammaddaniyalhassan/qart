import mongoose from 'mongoose'

export interface IVoucher {
  _id: string
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number // percentage (1-100) or fixed amount in cents
  minimumOrderAmountCents: number
  maximumDiscountCents?: number
  usageLimit: number // total times this voucher can be used
  usedCount: number
  validFrom: Date
  validUntil: Date
  isActive: boolean
  applicableProducts?: mongoose.Types.ObjectId[] // specific products only
  applicableCategories?: string[] // specific categories only
  createdAt: Date
  updatedAt: Date
}

const voucherSchema = new mongoose.Schema<IVoucher>({
  code: { 
    type: String, 
    required: true, 
    uppercase: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  discountType: { 
    type: String, 
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'], 
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  minimumOrderAmountCents: { 
    type: Number, 
    required: true,
    min: 0
  },
  maximumDiscountCents: { 
    type: Number,
    min: 0
  },
  usageLimit: { 
    type: Number, 
    required: true,
    min: 1
  },
  usedCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  validFrom: { 
    type: Date, 
    required: true 
  },
  validUntil: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  applicableProducts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  applicableCategories: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  collection: 'vouchers'
})

// Index for efficient queries
voucherSchema.index({ code: 1 }, { unique: true })
voucherSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 })
voucherSchema.index({ usageLimit: 1, usedCount: 1 })

// Pre-save middleware to update timestamp
voucherSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Add methods to the schema
voucherSchema.methods.isValid = function(): boolean {
  const now = new Date()
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    this.usedCount < this.usageLimit
  )
}

voucherSchema.methods.calculateDiscount = function(orderAmountCents: number): number {
  if (orderAmountCents < this.minimumOrderAmountCents) {
    return 0
  }

  let discountAmount = 0
  
  if (this.discountType === 'PERCENTAGE') {
    discountAmount = Math.floor((orderAmountCents * this.discountValue) / 100)
  } else {
    discountAmount = this.discountValue
  }

  // Apply maximum discount limit if set
  if (this.maximumDiscountCents && discountAmount > this.maximumDiscountCents) {
    discountAmount = this.maximumDiscountCents
  }

  return discountAmount
}

const Voucher = mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', voucherSchema)

export default Voucher
