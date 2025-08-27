import mongoose from 'mongoose'

export interface IOrderItem {
  productId: mongoose.Types.ObjectId
  name: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
  notes?: string
}

export interface IOrder {
  _id: string
  customerLeadId: mongoose.Types.ObjectId
  // Customer details stored directly in order for easy access
  customerName: string
  customerPhone: string
  customerEmail: string
  tableNumber: string
  status: 'NEW' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  paymentProvider?: string
  paymentRef?: string
  items: IOrderItem[]
  subtotalCents: number
  discountCents: number
  discountCode?: string
  serviceChargeCents: number
  taxCents: number
  totalCents: number
  orderNotes?: string
  createdAt: Date
  updatedAt: Date
}

const orderItemSub = new mongoose.Schema<IOrderItem>({
  productId: mongoose.Schema.Types.ObjectId,
  name: String,
  unitPriceCents: Number,
  quantity: Number,
  lineTotalCents: Number,
  notes: String, // per-item notes
}, { _id: false })

const orderSchema = new mongoose.Schema<IOrder>({
  customerLeadId: mongoose.Schema.Types.ObjectId,
  // Customer details stored directly in order
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, required: true },
  tableNumber: { type: String, required: true },
  status: { type: String, enum: ['NEW', 'CONFIRMED', 'CANCELLED'], default: 'NEW' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  paymentProvider: String, // 'STRIPE'
  paymentRef: String,      // Stripe session id
  items: [orderItemSub],
  subtotalCents: Number,
  discountCents: { type: Number, default: 0 },
  discountCode: String,
  serviceChargeCents: { type: Number, default: 0 },
  taxCents: { type: Number, default: 0 },
  totalCents: Number,
  orderNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'orders'
})

orderSchema.index({ createdAt: -1 })

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema)
