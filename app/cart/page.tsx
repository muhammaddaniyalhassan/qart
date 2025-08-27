'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ArrowLeft, Trash2, Minus, Plus, CreditCard, Edit3, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useCustomerSession } from '../contexts/CustomerSessionContext';

interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { customer, isCustomerSessionActive, clearCustomer } = useCustomerSession();

  // Load cart from localStorage on component mount
  useEffect(() => {
    // Check if customer session is active
    if (!isCustomerSessionActive || !customer) {
      router.push('/start');
      return;
    }

    console.log('Cart page: Component mounted, loading cart...');
    try {
      // Verify localStorage is available
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.error('Cart page: localStorage not available');
        setCart([]);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      const savedCart = localStorage.getItem('qart-cart');
      console.log('Cart page: Raw localStorage value:', savedCart);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Cart page: Loaded cart from localStorage:', parsedCart);
        if (Array.isArray(parsedCart)) {
          console.log('Cart page: Setting cart state with', parsedCart.length, 'items');
          setCart(parsedCart);
        } else {
          console.error('Cart page: Invalid cart format in localStorage');
          setCart([]);
        }
      } else {
        console.log('Cart page: No cart found in localStorage');
        setCart([]);
      }
    } catch (error) {
      console.error('Cart page: Error loading cart from localStorage:', error);
      setCart([]);
    } finally {
      console.log('Cart page: Cart loading completed, setting initialized to true');
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [isCustomerSessionActive, customer, router]);

  // Save cart to localStorage whenever it changes, but only after initialization
  useEffect(() => {
    if (isInitialized) {
      console.log('Cart page: Cart changed, saving to localStorage. Cart items:', cart.length);
      try {
        // Verify localStorage is available
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
          console.error('Cart page: localStorage not available for saving');
          return;
        }
        if (cart.length > 0) {
          console.log('Cart page: Saving cart with items:', cart);
          localStorage.setItem('qart-cart', JSON.stringify(cart));
        } else {
          console.log('Cart page: Cart is empty, removing from localStorage');
          localStorage.removeItem('qart-cart');
        }
      } catch (error) {
        console.error('Cart page: Error saving cart to localStorage:', error);
      }
    } else {
      console.log('Cart page: Not initialized yet, skipping localStorage save');
    }
  }, [cart, isInitialized]);

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    setIsApplyingVoucher(true);
    try {
      const subtotal = cart.reduce((total, item) => total + (item.priceCents * item.quantity), 0);
      const formattedCode = voucherCode.trim().toUpperCase();
      
      console.log('Applying voucher:', { 
        code: formattedCode, 
        subtotalCents: subtotal,
        subtotalPKR: (subtotal / 100).toFixed(2),
        cartItems: cart.length
      });
      
      const response = await fetch('/api/cart/apply-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: formattedCode,
          subtotalCents: subtotal
        }),
      });
      
      console.log('Voucher API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Voucher API response data:', data);
        
        if (data.success) {
          const newDiscount = data.discountCents || 0;
          console.log('Setting discount:', { 
            newDiscount, 
            discountPKR: (newDiscount / 100).toFixed(2) 
          });
          setDiscount(newDiscount);
          alert(`Voucher applied successfully! Discount: PKR ${(newDiscount / 100).toFixed(2)}`);
        } else {
          console.log('Voucher application failed:', data.message);
          alert(data.message || 'Invalid voucher code');
          setDiscount(0);
        }
      } else {
        const error = await response.json();
        console.log('Voucher API error response:', error);
        alert(error.message || 'Invalid voucher code');
        setDiscount(0);
      }
    } catch (error) {
      console.error('Voucher application error:', error);
      alert('Failed to apply voucher. Please try again.');
      setDiscount(0);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Check minimum order amount before proceeding
    const subtotal = cart.reduce((total, item) => total + (item.priceCents * item.quantity), 0);
    const totalAmount = Math.max(0, subtotal - discount);
    
    if (totalAmount < 5000) { // 5000 cents = PKR 50.00
      alert('Order amount too low. Minimum order amount is PKR 50.00 for payment processing.');
      return;
    }
    
    if (!isCustomerSessionActive || !customer) {
      alert('Customer information not found. Please start over.');
      router.push('/start');
      return;
    }

    setIsCheckingOut(true);
    try {
      console.log('Customer data for checkout:', customer);
      console.log('Checkout with discount:', { subtotal, discount, totalAmount });
      
      if (!customer._id) {
        alert('Invalid customer data. Please start over.');
        router.push('/start');
        return;
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          orderNotes: orderNotes.trim(),
          customerLeadId: customer._id,
          discountCents: discount, // Pass the discount amount
          voucherCode: discount > 0 ? voucherCode : undefined, // Pass voucher code if discount applied
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Checkout successful:', data);
        // Clear cart after successful checkout
        localStorage.removeItem('qart-cart');
        setCart([]);
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        const error = await response.json();
        console.error('Checkout failed:', error);
        
        // Handle specific error cases
        if (error.error && error.error.includes('minimum')) {
          alert('Order amount too low. Minimum order amount is PKR 50.00 for payment processing.');
        } else {
          alert(error.message || 'Checkout failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Network error during checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotal = cart.reduce((total, item) => total + (item.priceCents * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading cart...</h2>
          <p className="text-gray-600">Please wait while we load your cart</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started</p>
          <button
            onClick={() => router.push('/menu')}
            className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/menu')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Menu</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">qart</h1>
          </div>
          
          {/* Customer Info */}
          {customer && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Order for:</div>
              <div className="font-medium text-gray-900">{customer.name}</div>
              <div className="text-xs text-gray-500">Table {customer.tableNumber}</div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to start over? This will clear your cart and customer session.')) {
                    localStorage.removeItem('qart-cart');
                    setCart([]);
                    clearCustomer(); // Clear the customer session
                    router.push('/start');
                  }
                }}
                className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Order</h2>
            
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 text-sm">
                        PKR {(item.priceCents / 100).toFixed(2)} each
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        PKR {((item.priceCents * item.quantity) / 100).toFixed(2)}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Currency notice */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">💳 Payment Information</div>
                  <div>• All prices shown in PKR</div>
                  <div>• Payment processed in USD (automatic conversion)</div>
                  <div>• Minimum order: PKR 50.00</div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Edit3 size={16} className="inline mr-2" />
                  Special Instructions for Order
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special requests for your entire order?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Voucher */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <button
                    onClick={applyVoucher}
                    disabled={isApplyingVoucher || !voucherCode.trim()}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    {isApplyingVoucher ? '...' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>PKR {(subtotal / 100).toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-PKR {(discount / 100).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span>PKR {(total / 100).toFixed(2)}</span>
                </div>
                
                {/* Minimum order notice */}
                {total < 5000 && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                    ⚠️ Minimum order amount for payment processing is PKR 50.00
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || total < 5000}
                className="w-full bg-black text-white py-3 px-6 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 mt-6"
              >
                {isCheckingOut ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : total < 5000 ? (
                  <>
                    <span>Minimum PKR 50.00 Required</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
