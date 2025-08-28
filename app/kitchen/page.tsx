'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Clock, User, MessageSquare, ChefHat, LogIn, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useCustomerSession } from '../contexts/CustomerSessionContext';
import { getPusherClient } from '@/lib/pusher-client';

interface OrderItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  notes?: string;
}

interface Order {
  orderId: string;
  customerName: string;
  tableNumber: string;
  phoneNumber: string;
  email: string;
  items: OrderItem[];
  totalCents: number;
  orderNotes?: string;
  createdAt: string;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { isCustomerSessionActive } = useCustomerSession();
  const { data: session, status } = useSession();

  const showVisualNotification = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000); // Hide after 3 seconds
  };

  const playNotificationSound = () => {
    // Only play sound if the kitchen page is active and focused
    if (!document.hasFocus()) {
      console.log('Kitchen: Page not focused, skipping sound');
      showVisualNotification('New Order Received!');
      return;
    }

    try {
      const audio = new Audio('/sounds/new-order.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.error('Kitchen: Could not play sound:', error);
        showVisualNotification('New Order Received!');
      });
    } catch (error) {
      console.error('Kitchen: Sound system not available:', error);
      showVisualNotification('New Order Received!');
    }
  };

  useEffect(() => {
    // Redirect customers away from kitchen page
    if (isCustomerSessionActive) {
      router.push('/menu');
      return;
    }

    // Don't proceed if session is still loading
    if (status === 'loading') {
      return;
    }

    console.log('Kitchen: Session status:', status);
    console.log('Kitchen: Session data:', session);

    // Check if user is already authenticated
    const authStatus = localStorage.getItem('kitchen-auth');
    console.log('Kitchen: Auth status from localStorage:', authStatus);
    
    if (authStatus === 'true' && session && ['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      console.log('Kitchen: User authenticated and has valid session, fetching orders...');
      setIsAuthenticated(true);
      fetchOrders();
    } else {
      console.log('Kitchen: User not authenticated or session invalid, showing login form');
      setIsAuthenticated(false);
      localStorage.removeItem('kitchen-auth');
      setLoading(false);
    }
  }, [isCustomerSessionActive, router, status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    // Initialize audio context on first user interaction
    try {
      const audio = new Audio('/sounds/new-order.mp3');
      audio.volume = 0; // Silent test to initialize audio context
      await audio.play();
      audio.pause();
    } catch (error) {
      console.log('Audio context initialization:', error);
    }

    try {
      console.log('Kitchen: Attempting login with:', username);
      // Use NextAuth signIn instead of custom API
      const result = await signIn('credentials', {
        email: username,
        password: password,
        redirect: false,
      });

      console.log('Kitchen: Login result:', result);

      if (result?.error) {
        console.error('Kitchen: Login failed:', result.error);
        setLoginError('Invalid email or password');
      } else if (result?.ok) {
        console.log('Kitchen: Login successful');
        setIsAuthenticated(true);
        localStorage.setItem('kitchen-auth', 'true');
        fetchOrders();
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('kitchen-auth');
    setOrders([]);
  };

  const fetchOrders = async () => {
    // Initialize audio context on user interaction
    try {
      const audio = new Audio('/sounds/new-order.mp3');
      audio.volume = 0; // Silent test to initialize audio context
      await audio.play();
      audio.pause();
    } catch (error) {
      console.log('Audio context initialization:', error);
    }

    try {
      console.log('Kitchen: Fetching orders...');
      const response = await fetch('/api/kitchen/orders');
      console.log('Kitchen: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Kitchen: API response data:', data);
        
        if (data.success && Array.isArray(data.orders)) {
          console.log('Kitchen: Setting orders:', data.orders.length, 'orders');
          setOrders(data.orders);
        } else {
          console.error('Kitchen: Invalid orders data received:', data);
          setOrders([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Kitchen: Failed to fetch orders:', response.status, errorText);
        
        if (response.status === 401) {
          console.error('Kitchen: Authentication failed - user not logged in or unauthorized');
          // Redirect to login if not authenticated
          setIsAuthenticated(false);
          localStorage.removeItem('kitchen-auth');
        }
        
        setOrders([]);
      }
    } catch (error) {
      console.error('Kitchen: Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch orders initially
    fetchOrders();

    // Set up real-time updates with Pusher
    const pusherClient = getPusherClient();
    if (!pusherClient) return;
    
    const channel = pusherClient.subscribe('kitchen');
    
    // Debug Pusher connection
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Kitchen: Connected to real-time updates');
    });
    
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Kitchen: Failed to connect to real-time updates:', error);
    });
    
    channel.bind('kitchen.order_paid', (data: any) => {
      console.log('Kitchen: New paid order received:', data.orderId);
      
      // Only play sound and show notification if this tab is active
      if (document.hasFocus()) {
        playNotificationSound();
        showVisualNotification('New Order Received!');
      } else {
        console.log('Kitchen: Page not focused, skipping audio notification');
      }
      
      // Add paid order directly to state for instant display
      const newOrder: Order = {
        orderId: data.orderId,
        customerName: data.customerName,
        tableNumber: data.tableNumber,
        phoneNumber: data.phone || 'No Phone',
        email: data.email || 'No Email',
        items: data.items,
        totalCents: data.totalCents,
        orderNotes: data.orderNotes,
        createdAt: data.createdAt,
      };
      
      setOrders(prevOrders => {
        // Check if order already exists to prevent duplicates
        const orderExists = prevOrders.some(order => order.orderId === newOrder.orderId);
        if (orderExists) {
          return prevOrders;
        }
        
        return [newOrder, ...prevOrders];
      });
    });

    return () => {
      pusherClient.unsubscribe('kitchen');
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                <ChefHat size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Access</h1>
              <p className="text-gray-600 mt-2">Login to access the kitchen display</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username/Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter username or email"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="text-red-600 text-sm text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Use your staff or admin credentials
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
          </div>
          
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <ChefHat size={20} />
            <span>{loading ? 'Loading...' : 'Refresh Orders'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Visual Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <ChefHat size={20} />
            <span className="font-medium">{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!Array.isArray(orders) ? (
          <div className="text-center py-12">
            <ChefHat size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Orders...</h2>
            <p className="text-gray-600">Please wait while we fetch your orders</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600">New orders will appear here in real-time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order, index) => (
              <div
                key={order.orderId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-black text-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Order #{order.orderId.slice(-6)}</span>
                    <Clock size={16} />
                  </div>
                  <div className="text-xs text-gray-300">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <User size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-900">{order.customerName}</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Table: {order.tableNumber}</div>
                    <div>Phone: {order.phoneNumber}</div>
                    <div>Email: {order.email}</div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-3">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500">×{item.quantity}</span>
                        </div>
                        {item.notes && (
                          <div className="flex items-start space-x-1 mt-1">
                            <MessageSquare size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-600">{item.notes}</span>
                          </div>
                        )}
                      </div>
                                             <span className="text-sm font-medium text-gray-900">
                         PKR {(item.lineTotalCents / 100).toFixed(2)}
                       </span>
                    </div>
                  ))}
                </div>

                {/* Order Notes */}
                {order.orderNotes && (
                  <div className="px-4 pb-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <MessageSquare size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-yellow-800 mb-1">Order Notes</div>
                          <div className="text-sm text-yellow-700">{order.orderNotes}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="px-4 pb-4">
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        PKR {(order.totalCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
