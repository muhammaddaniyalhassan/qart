import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Product from '@/models/Product'

export async function GET() {
  try {
    await dbConnect()

    const products = await Product.find({ isActive: true }).sort({ name: 1 })

    return NextResponse.json({
      success: true,
      products: products.map(product => ({
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
      }))
    })
  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}
