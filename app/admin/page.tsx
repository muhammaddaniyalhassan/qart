'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Plus, Edit, Trash2, Image as ImageIcon, Save, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  _id: string
  name: string
  description?: string
  priceCents: number
  imageUrl?: string
  isActive: boolean
}

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceCents: '',
    imageUrl: '',
    isActive: true,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Product name is required')
      return
    }

    if (!formData.priceCents || parseFloat(formData.priceCents) <= 0) {
      alert('Price must be greater than 0')
      return
    }

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct._id}`
        : '/api/admin/products'

      const method = editingProduct ? 'PUT' : 'POST'

      console.log('Making request to:', url, 'with method:', method)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Convert PKR (entered as decimal) to integer cents
          priceCents: Math.round(parseFloat(formData.priceCents || '0') * 100),
        }),
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        console.log('Product saved successfully')
        await fetchProducts()
        // Reset form and hide it
        setIsAddingProduct(false)
        setEditingProduct(null)
        setFormData({
          name: '',
          description: '',
          priceCents: '',
          imageUrl: '',
          isActive: true,
        })
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Error: ${errorData.message || 'Failed to save product'}`)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Network error. Please try again.')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsAddingProduct(false) // Make sure we're not in adding mode
    setFormData({
      name: product.name,
      description: product.description || '',
      priceCents: (product.priceCents / 100).toString(),
      imageUrl: product.imageUrl || '',
      isActive: product.isActive,
    })
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchProducts()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        await fetchProducts()
      }
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priceCents: '',
      imageUrl: '',
      isActive: true,
    })
    setEditingProduct(null)
    // Don't set isAddingProduct to false here - let the caller decide
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  console.log(
    'Rendering with isAddingProduct:',
    isAddingProduct,
    'editingProduct:',
    editingProduct
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant&apos;s menu items</p>
        </div>
        <Button
          onClick={() => {
            console.log('Add Product button clicked')
            console.log('Current isAddingProduct state:', isAddingProduct)
            setIsAddingProduct(true)
            setEditingProduct(null)
            // Reset form data manually instead of calling resetForm
            setFormData({
              name: '',
              description: '',
              priceCents: '',
              imageUrl: '',
              isActive: true,
            })
            console.log('After setting isAddingProduct to true')
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingProduct || editingProduct) && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Margherita Pizza"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (PKR) *
                    </label>
                    <Input
                      type="number"
                      value={formData.priceCents}
                      onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                      placeholder="e.g., 1200"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active (visible to customers)
                  </label>
                </div>

                <div className="flex space-x-3">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingProduct(false)
                      setEditingProduct(null)
                      setFormData({
                        name: '',
                        description: '',
                        priceCents: '',
                        imageUrl: '',
                        isActive: true,
                      })
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id}>
            <Card className={`h-full ${!product.isActive ? 'opacity-60' : ''}`}>
              {product.imageUrl && (
                <div className="relative h-48 w-full">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.description && (
                      <CardDescription className="mt-1">
                        {product.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="p-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product._id)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(product.priceCents)}
                  </span>
                  <Button
                    variant={product.isActive ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleActive(product._id, product.isActive)}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first menu item
            </p>
            <Button
              onClick={() => {
                setIsAddingProduct(true)
                setEditingProduct(null)
                setFormData({
                  name: '',
                  description: '',
                  priceCents: '',
                  imageUrl: '',
                  isActive: true,
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
