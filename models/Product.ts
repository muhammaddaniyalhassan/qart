import mongoose from 'mongoose'

export interface IProduct {
  _id: string
  name: string
  description?: string
  priceCents: number
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const productSchema = new mongoose.Schema<IProduct>({
  name: { type: String, required: true },
  description: String,
  priceCents: { type: Number, required: true },
  imageUrl: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'products'
})

productSchema.index({ isActive: 1 })

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema)
