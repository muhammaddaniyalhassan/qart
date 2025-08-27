'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Plus, Edit3, Trash2, Copy, Calendar, Percent, DollarSign, Users, Search, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import VoucherModal from './components/VoucherModal'

interface Voucher {
  _id: string
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minimumOrderAmountCents: number
  maximumDiscountCents?: number
  usageLimit: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableProducts?: string[]
  applicableCategories?: string[]
  createdAt: string
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/admin/vouchers')
      if (response.ok) {
        const data = await response.json()
        setVouchers(data.vouchers)
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = 
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && voucher.isActive) ||
      (filterStatus === 'inactive' && !voucher.isActive)
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const getDiscountTypeIcon = (type: string) => {
    return type === 'PERCENTAGE' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />
  }

  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.discountType === 'PERCENTAGE') {
      return `${voucher.discountValue}%`
    } else {
      return formatCurrency(voucher.discountValue)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const handleSave = async (voucherData: Partial<Voucher>) => {
    try {
      if (editingVoucher) {
        // Update existing voucher
        const response = await fetch(`/api/admin/vouchers/${editingVoucher._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(voucherData)
        })
        
        if (response.ok) {
          fetchVouchers()
          setEditingVoucher(null)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to update voucher')
        }
      } else {
        // Create new voucher
        const response = await fetch('/api/admin/vouchers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(voucherData)
        })
        
        if (response.ok) {
          fetchVouchers()
          setShowCreateModal(false)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to create voucher')
        }
      }
    } catch (error) {
      console.error('Error saving voucher:', error)
      alert(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDelete = async (voucherId: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return
    
    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchVouchers()
      }
    } catch (error) {
      console.error('Error deleting voucher:', error)
    }
  }

  const toggleVoucherStatus = async (voucherId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      if (response.ok) {
        fetchVouchers()
      }
    } catch (error) {
      console.error('Error updating voucher status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voucher Management</h1>
          <p className="text-gray-600">Create and manage discount vouchers for customers</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Voucher
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by voucher code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        >
          <option value="all">All Vouchers</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Vouchers List */}
      <div className="space-y-4">
        {filteredVouchers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vouchers found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first voucher to get started'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVouchers.map((voucher, index) => (
            <div
              key={voucher._id}
            >
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg font-mono">{voucher.code}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(voucher.isActive)}`}>
                          {voucher.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(voucher.code)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-gray-600 mb-2">{voucher.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          {getDiscountTypeIcon(voucher.discountType)}
                          <span className="font-medium">{getDiscountDisplay(voucher)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Min: {formatCurrency(voucher.minimumOrderAmountCents)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{voucher.usedCount}/{voucher.usageLimit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-2">
                        Valid until {formatDate(new Date(voucher.validUntil))}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingVoucher(voucher)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVoucherStatus(voucher._id, voucher.isActive)}
                          className={`border-gray-300 ${
                            voucher.isActive 
                              ? 'text-red-700 hover:bg-red-50' 
                              : 'text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {voucher.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(voucher._id)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {voucher.maximumDiscountCents && (
                  <CardContent className="pt-0">
                    <div className="text-sm text-gray-600">
                      <strong>Max Discount:</strong> {formatCurrency(voucher.maximumDiscountCents)}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredVouchers.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="py-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Showing {filteredVouchers.length} of {vouchers.length} vouchers</span>
              <span>
                Active: {vouchers.filter(v => v.isActive).length} | 
                Inactive: {vouchers.filter(v => !v.isActive).length}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voucher Modal */}
      <VoucherModal
        isOpen={showCreateModal || !!editingVoucher}
        onClose={() => {
          setShowCreateModal(false)
          setEditingVoucher(null)
        }}
        voucher={editingVoucher}
        onSave={handleSave}
      />
    </div>
  )
}
