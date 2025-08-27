'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Search, Eye, Calendar, User, Hash } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { pusherClient } from '@/lib/pusher'

interface OrderItem {
  name: string
  quantity: number
  notes?: string
}

interface Order {
  _id: string
  customerLead: {
    name: string
    tableNumber: string
    phone?: string
    email?: string
  }
  items: OrderItem[]
  totalCents: number
  status: string
  paymentStatus: string
  discountCode?: string
  discountCents: number
  createdAt: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const processedOrdersRef = useRef(new Set<string>())

  useEffect(() => {
    fetchOrders()

    // Set up real-time updates with Pusher
    const channel = pusherClient.subscribe('admin');
    
    // Debug: Listen to all events on the channel
    channel.bind_global((eventName: string, data: any) => {
      console.log('Admin: Received event:', eventName, data);
    });
    
    channel.bind('admin.new_order', (data: any) => {
      console.log('Admin: New order received:', data.orderId);
      
      // Check if we've already processed this order
      if (processedOrdersRef.current.has(data.orderId)) {
        console.log('Admin: Order already processed, skipping');
        return;
      }
      
      processedOrdersRef.current.add(data.orderId);
      console.log('Admin: Current orders count before adding:', orders.length);
      
      // Add new order directly to state for instant display
      const newOrder: Order = {
        _id: data.orderId,
        customerLead: {
          name: data.customerName,
          tableNumber: data.tableNumber,
          phone: data.phone,
          email: data.email,
        },
        items: data.items,
        totalCents: data.totalCents,
        status: data.status,
        paymentStatus: data.paymentStatus,
        discountCode: data.discountCode,
        discountCents: data.discountCents || 0,
        createdAt: data.createdAt,
      };
      
      setOrders(prevOrders => {
        console.log('Admin: Processing order in setState, current count:', prevOrders.length);
        
        // Check if order already exists to prevent duplicates
        const orderExists = prevOrders.some(order => order._id === newOrder._id);
        if (orderExists) {
          console.log('Admin: Order already exists, skipping duplicate');
          return prevOrders;
        }
        
        console.log('Admin: Adding new order, new count will be:', prevOrders.length + 1);
        return [newOrder, ...prevOrders];
      });
    });

    channel.bind('admin.order_paid', (data: any) => {
      console.log('Admin: Order payment confirmed:', data.orderId);
      
      // Update existing order status in state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === data.orderId 
            ? { ...order, status: data.status, paymentStatus: data.paymentStatus }
            : order
        )
      );
    });

    return () => {
      // Clean up event listeners before unsubscribing
      channel.unbind('admin.new_order');
      channel.unbind('admin.order_paid');
      channel.unbind_global();
      pusherClient.unsubscribe('admin');
      
      // Clear processed orders
      processedOrdersRef.current.clear();
    };
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (response.ok) {
        const data = await response.json()
        console.log('Admin orders data:', data.orders)
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customerLead?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.customerLead?.phone || '').includes(searchTerm) ||
      (order.customerLead?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">View and manage all customer orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer name, phone, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Orders will appear here once customers start placing them'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={order._id}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">Order #{order._id.slice(-6).toUpperCase()}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{order.customerLead?.name || 'Unknown Customer'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Hash className="h-4 w-4" />
                          <span>{order.customerLead?.tableNumber || 'No Table'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(new Date(order.createdAt))}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(order.totalCents)}
                      </div>
                      {order.discountCode && (
                        <div className="text-sm text-green-600">
                          -{formatCurrency(order.discountCents)} ({order.discountCode})
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {order.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-gray-500">×{item.quantity}</span>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-600 italic mt-1">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {(order.customerLead?.phone || order.customerLead?.email) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <strong>Contact:</strong> {order.customerLead?.phone || 'No Phone'}
                        {order.customerLead?.email && ` • ${order.customerLead.email}`}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="py-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Showing {filteredOrders.length} of {orders.length} orders</span>
              <span>
                Total Value: {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.totalCents, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
