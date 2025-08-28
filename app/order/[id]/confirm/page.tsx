'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock } from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/utils'
import { getPusherClient } from '@/lib/pusher-client'
import { useCustomerSession } from '../../../contexts/CustomerSessionContext'

interface OrderItem {
  name: string
  quantity: number
  notes?: string
}

interface Order {
  _id: string
  items: OrderItem[]
  totalCents: number
  status: string
  paymentStatus: string
  paymentRef?: string
  orderNotes?: string
  createdAt: string
  customerLead: {
    name: string
    tableNumber: string
    phone?: string
    email?: string
  }
}

export default function OrderConfirmPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaid, setIsPaid] = useState(false)
  const { isCustomerSessionActive } = useCustomerSession()

  console.log('OrderConfirmPage: Component mounted with orderId:', orderId);
  console.log('OrderConfirmPage: isCustomerSessionActive:', isCustomerSessionActive);

  useEffect(() => {
    // First try to fetch the order
    fetchOrder()
    setupPusher()
    
    // Set up periodic payment status check
    const interval = setInterval(() => {
      if (order && order.paymentStatus === 'PENDING' && order.paymentRef) {
        console.log('Periodic check: Checking payment status...');
        checkStripePaymentStatus(order.paymentRef);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    }
  }, [orderId, order?.paymentStatus, order?.paymentRef])

  // Only redirect if no session AND no order data after loading
  useEffect(() => {
    if (!isLoading && !isCustomerSessionActive && !order) {
      console.log('No customer session and no order data, redirecting to start');
      router.push('/start');
    }
  }, [isLoading, isCustomerSessionActive, order, router])

  const fetchOrder = async () => {
    console.log('OrderConfirmPage: Fetching order with ID:', orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      console.log('OrderConfirmPage: Order API response status:', response.status);
      if (response.ok) {
        const data = await response.json()
        console.log('OrderConfirmPage: Order data received:', data);
        setOrder(data.order)
        setIsPaid(data.order.paymentStatus === 'PAID')
        
        // If payment is still pending, check with Stripe directly
        if (data.order.paymentStatus === 'PENDING' && data.order.paymentRef) {
          console.log('Order payment pending, checking with Stripe...');
          await checkStripePaymentStatus(data.order.paymentRef);
        }
        

      } else {
        console.error('OrderConfirmPage: Failed to fetch order, status:', response.status);
      }
    } catch (error) {
      console.error('OrderConfirmPage: Error fetching order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkStripePaymentStatus = async (paymentRef: string) => {
    try {
      console.log('Checking Stripe payment status for:', paymentRef);
      const response = await fetch(`/api/orders/${orderId}/check-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentRef })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.paymentStatus === 'PAID') {
          console.log('Payment confirmed via Stripe check');
          setIsPaid(true);
          // Refresh order data
          fetchOrder();
        }
      }
    } catch (error) {
      console.error('Error checking Stripe payment status:', error);
    }
  }

  const setupPusher = () => {
    const pusherClient = getPusherClient();
    if (!pusherClient) return () => {};
    
    const channel = pusherClient.subscribe(`order:${orderId}`)
    
    channel.bind('order.paid', (data: any) => {
      if (data.status === 'PAID') {
        setIsPaid(true)
        fetchOrder() // Refresh order data
      }
    })

    return () => {
      pusherClient.unsubscribe(`order:${orderId}`)
    }
  }



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="text-center max-w-md mx-4">
          <CardHeader>
            <CardTitle>Order not found</CardTitle>
            <CardDescription>The order you're looking for doesn't exist</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/start'} className="w-full">
              Start New Order
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl pt-20">
        <div>
          <Card className="text-center">
            <CardHeader>
              {isPaid ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <CardTitle className="text-3xl font-bold text-green-600">
                    Payment Confirmed!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Your order has been received and confirmed
                  </CardDescription>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Clock className="h-16 w-16 text-yellow-500 mb-4" />
                  <CardTitle className="text-3xl font-bold text-yellow-600">
                    Payment Pending
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Please complete your payment to confirm your order
                  </CardDescription>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Details */}
              <div className="text-left space-y-4">
                <div className="border rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">{order._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{order.customerLead.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Table:</span>
                      <span>{order.customerLead.tableNumber || 'Not specified'}</span>
                    </div>
                    {order.customerLead.phone && (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>{order.customerLead.phone}</span>
                      </div>
                    )}
                    {order.customerLead.email && (
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span>{order.customerLead.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(new Date(order.createdAt))}</span>
                    </div>
                    {order.orderNotes && (
                      <div className="flex justify-between">
                        <span>Notes:</span>
                        <span>{order.orderNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="border rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground">
                              × {item.quantity}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border rounded-xl p-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(order.totalCents)}</span>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {isPaid ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800">
                    🎉 Your order is being prepared! The kitchen has been notified and will start working on it right away.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800">
                    ⏳ Please complete your payment to confirm your order. You'll receive a confirmation once payment is processed.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {!isPaid && order.paymentRef && (
                  <Button
                    onClick={() => checkStripePaymentStatus(order.paymentRef!)}
                    variant="outline"
                    className="w-full"
                  >
                    🔄 Check Payment Status
                  </Button>
                )}
                <Button
                  onClick={() => window.location.href = '/start'}
                  className="w-full"
                >
                  Place Another Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="w-full"
                >
                  Print Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
