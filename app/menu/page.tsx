'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ShoppingCart, Plus, Minus, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useCustomerSession } from '../contexts/CustomerSessionContext';

interface Product {
  _id: string;
  name: string;
  description?: string;
  priceCents: number;
  imageUrl?: string;
  isActive: boolean;
}

interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes: string;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { customer, isCustomerSessionActive, clearCustomer } = useCustomerSession();

  // Load cart from localStorage on component mount
  useEffect(() => {
    console.log('Menu page: Component mounted, loading cart...');
    try {
      // Verify localStorage is available
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.error('Menu page: localStorage not available');
        setCart([]);
        return;
      }

      const savedCart = localStorage.getItem('qart-cart');
      console.log('Menu page: Raw localStorage value:', savedCart);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Menu page: Loaded cart from localStorage:', parsedCart);
        if (Array.isArray(parsedCart)) {
          console.log('Menu page: Setting cart state with', parsedCart.length, 'items');
          setCart(parsedCart);
        } else {
          console.error('Menu page: Invalid cart format in localStorage');
          setCart([]);
        }
      }
    } catch (error) {
      console.error('Menu page: Error loading cart from localStorage:', error);
      setCart([]);
    }
  }, []);

  // Load customer info from localStorage
  useEffect(() => {
    if (!isCustomerSessionActive || !customer) {
      // Redirect to start page if no customer session
      router.push('/start');
      return;
    }
  }, [isCustomerSessionActive, customer, router]);

  // Load products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('Menu page: Cart changed, saving to localStorage. Cart items:', cart.length);
    if (cart.length > 0) {
      try {
        // Verify localStorage is available
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
          console.error('Menu page: localStorage not available for saving');
          return;
        }
        console.log('Menu page: Saving cart to localStorage:', cart);
        localStorage.setItem('qart-cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Menu page: Error saving cart to localStorage:', error);
      }
    } else {
      // Clear localStorage when cart is empty
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          console.log('Menu page: Cart is empty, removing from localStorage');
          localStorage.removeItem('qart-cart');
        }
      } catch (error) {
        console.error('Menu page: Error removing cart from localStorage:', error);
      }
    }
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        // Extract products array from the response
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    console.log('Adding product to cart:', product);
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product._id);
      if (existingItem) {
        const updatedCart = prevCart.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        console.log('Updated cart (existing item):', updatedCart);
        return updatedCart;
      } else {
        const newCart = [...prevCart, {
          productId: product._id,
          name: product.name,
          priceCents: product.priceCents,
          quantity: 1,
          notes: ''
        }];
        console.log('Updated cart (new item):', newCart);
        return newCart;
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.productId !== productId);
      console.log('Removed item from cart:', productId, 'New cart:', newCart);
      return newCart;
    });
  };

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

  const updateNotes = (productId: string, notes: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, notes } : item
      )
    );
  };

  const getCartItem = (productId: string) => {
    return cart.find(item => item.productId === productId);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Top row - Logo and Cart */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">qart</h1>
            </div>
            
            <button
              onClick={async () => {
                // Ensure cart is saved before navigation
                if (cart.length > 0) {
                  try {
                    // Verify localStorage is available
                    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                      console.error('Menu page: localStorage not available for saving before navigation');
                      return;
                    }
                    localStorage.setItem('qart-cart', JSON.stringify(cart));
                    console.log('Menu page: Cart saved before navigation:', cart);
                    // Small delay to ensure localStorage write completes
                    await new Promise(resolve => setTimeout(resolve, 10));
                  } catch (error) {
                    console.error('Menu page: Error saving cart before navigation:', error);
                  }
                }
                router.push('/cart');
              }}
              className="relative bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Bottom row - Customer Info */}
          {customer && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
              <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                <span className="text-gray-600">
                  <span className="font-medium">Welcome,</span> {customer.name}
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-600">
                  <span className="font-medium">Table:</span> {customer.tableNumber || 'T1'}
                </span>
                <button
                  onClick={() => {
                    if (confirm('Start over? This will clear your cart and session.')) {
                      localStorage.removeItem('qart-cart');
                      setCart([]);
                      clearCustomer(); // Clear the customer session
                      router.push('/start');
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800 underline ml-2"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Content */}
      <div className="w-full px-4 py-8 pb-24 md:pb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Menu</h2>
          <p className="text-gray-600">Delicious food, delivered to your table</p>
        </div>

        {/* Products Grid - 2 items per row on mobile, more on larger screens */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
          {products.map((product) => {
            const cartItem = getCartItem(product._id);
            const isInCart = !!cartItem;

            return (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {product.imageUrl && (
                  <div className="relative h-32 sm:h-40 md:h-48 bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="p-3 sm:p-4 md:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-gray-600 mb-3 md:mb-4 text-xs sm:text-sm line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                        PKR {(product.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    {!isInCart ? (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <Plus size={16} />
                        <span>Add to Cart</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between space-x-2">
                        <button
                          onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0"
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                          {cartItem.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary - Mobile Only */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 md:hidden z-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-600 truncate">
                  {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  PKR {(cart.reduce((total, item) => total + (item.priceCents * item.quantity), 0) / 100).toFixed(2)}
                </div>
              </div>
              
              <button
                onClick={async () => {
                  // Ensure cart is saved before navigation
                  if (cart.length > 0) {
                    try {
                      // Verify localStorage is available
                      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                        console.error('Menu page: localStorage not available for saving mobile cart before navigation');
                        return;
                      }
                      localStorage.setItem('qart-cart', JSON.stringify(cart));
                      console.log('Menu page: Mobile cart saved before navigation:', cart);
                      // Small delay to ensure localStorage write completes
                      await new Promise(resolve => setTimeout(resolve, 10));
                    } catch (error) {
                      console.error('Menu page: Error saving mobile cart before navigation:', error);
                    }
                  }
                  router.push('/cart');
                }}
                className="bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-3 flex-shrink-0"
              >
                <span className="text-sm">View Cart</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
