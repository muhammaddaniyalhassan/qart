'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { X, Save, Calendar, Percent, DollarSign, Users, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Voucher {
  _id: string
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minimumOrderAmountCents: number
  maximumDiscountCents?: number
  usageLimit: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableProducts?: string[]
  applicableCategories?: string[]
}

interface VoucherModalProps {
  isOpen: boolean
  onClose: () => void
  voucher?: Voucher | null
  onSave: (voucherData: Partial<Voucher>) => Promise<void>
}

export default function VoucherModal({ isOpen, onClose, voucher, onSave }: VoucherModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    minimumOrderAmountCents: 0,
    maximumDiscountCents: 0,
    usageLimit: 1,
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
        discountValue: voucher.discountValue,
        minimumOrderAmountCents: voucher.minimumOrderAmountCents,
        maximumDiscountCents: voucher.maximumDiscountCents || 0,
        usageLimit: voucher.usageLimit,
        validFrom: voucher.validFrom.split('T')[0],
        validUntil: voucher.validUntil.split('T')[0],
        isActive: voucher.isActive,
        applicableProducts: voucher.applicableProducts || [],
        applicableCategories: voucher.applicableCategories || [],
      })
    } else {
      // Set default values for new voucher
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      setFormData({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minimumOrderAmountCents: 1000, // $10.00
        maximumDiscountCents: 0,
        usageLimit: 100,
        validFrom: tomorrow.toISOString().split('T')[0],
        validUntil: nextMonth.toISOString().split('T')[0],
        isActive: true,
        applicableProducts: [],
        applicableCategories: [],
      })
    }
    setErrors({})
  }, [voucher])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Voucher code is required'
    } else if (formData.code.length > 20) {
      newErrors.code = 'Voucher code too long'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be positive'
    }

    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100%'
    }

    if (formData.minimumOrderAmountCents <= 0) {
      newErrors.minimumOrderAmountCents = 'Minimum order amount must be positive'
    }

    if (formData.maximumDiscountCents > 0 && formData.maximumDiscountCents < formData.discountValue) {
      newErrors.maximumDiscountCents = 'Maximum discount cannot be less than discount value'
    }

    if (formData.usageLimit <= 0) {
      newErrors.usageLimit = 'Usage limit must be positive'
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Start date is required'
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'End date is required'
    }

    if (formData.validFrom && formData.validUntil && formData.validFrom >= formData.validUntil) {
      newErrors.validUntil = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await onSave({
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        maximumDiscountCents: formData.maximumDiscountCents > 0 ? formData.maximumDiscountCents : undefined,
      })
      onClose()
    } catch (error) {
      console.error('Error saving voucher:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <Card className="border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900">
                    {voucher ? 'Edit Voucher' : 'Create New Voucher'}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {voucher ? 'Update voucher details' : 'Set up a new discount voucher'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voucher Code *
                    </label>
                    <Input
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      placeholder="SAVE20"
                      className={errors.code ? 'border-red-300' : ''}
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.isActive.toString()}
                      onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="20% off on all orders"
                    className={errors.description ? 'border-red-300' : ''}
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>

                {/* Discount Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => handleInputChange('discountType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED_AMOUNT">Fixed Amount</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value *
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                        placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '500'}
                        className={errors.discountValue ? 'border-red-300' : ''}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {formData.discountType === 'PERCENTAGE' ? '%' : '¢'}
                      </div>
                    </div>
                    {errors.discountValue && <p className="text-red-500 text-xs mt-1">{errors.discountValue}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Discount (Optional)
                    </label>
                    <Input
                      type="number"
                      value={formData.maximumDiscountCents}
                      onChange={(e) => handleInputChange('maximumDiscountCents', parseFloat(e.target.value) || 0)}
                      placeholder="1000"
                      className={errors.maximumDiscountCents ? 'border-red-300' : ''}
                    />
                    {errors.maximumDiscountCents && <p className="text-red-500 text-xs mt-1">{errors.maximumDiscountCents}</p>}
                  </div>
                </div>

                {/* Order Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Amount *
                    </label>
                    <Input
                      type="number"
                      value={formData.minimumOrderAmountCents}
                      onChange={(e) => handleInputChange('minimumOrderAmountCents', parseFloat(e.target.value) || 0)}
                      placeholder="1000"
                      className={errors.minimumOrderAmountCents ? 'border-red-300' : ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.minimumOrderAmountCents)}
                    </p>
                    {errors.minimumOrderAmountCents && <p className="text-red-500 text-xs mt-1">{errors.minimumOrderAmountCents}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit *
                    </label>
                    <Input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => handleInputChange('usageLimit', parseInt(e.target.value) || 0)}
                      placeholder="100"
                      className={errors.usageLimit ? 'border-red-300' : ''}
                    />
                    {errors.usageLimit && <p className="text-red-500 text-xs mt-1">{errors.usageLimit}</p>}
                  </div>
                </div>

                {/* Validity Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From *
                    </label>
                    <Input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => handleInputChange('validFrom', e.target.value)}
                      className={errors.validFrom ? 'border-red-300' : ''}
                    />
                    {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until *
                    </label>
                    <Input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                      className={errors.validUntil ? 'border-red-300' : ''}
                    />
                    {errors.validUntil && <p className="text-red-500 text-xs mt-1">{errors.validUntil}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : (voucher ? 'Update Voucher' : 'Create Voucher')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}


