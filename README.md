# Qart - QR Ordering System

A modern, production-ready MVP for restaurant QR ordering with real-time kitchen display and admin management.

## 🚀 Features

### Customer Experience
- **Simple Start**: Name + phone/email form (Table 1 assumed)
- **Flat Menu**: No categories, clean product listing
- **Smart Cart**: Per-item notes, quantity management
- **Voucher System**: Support for percentage and fixed discounts
- **Stripe Checkout**: Secure payment processing (test mode)
- **Order Confirmation**: Real-time status updates

### Kitchen Display System (KDS)
- **Real-time Orders**: Live feed of paid orders (newest first)
- **Sound Notifications**: Audio alerts for new orders (only when page is focused)
- **Mobile-First**: Optimized for kitchen tablets
- **No Workflow**: Simple display without status management
- **Role-Based Access**: ADMIN and STAFF can access

### Admin Dashboard
- **Menu Management**: Full CRUD for products
- **Voucher System**: Create and manage discount codes
- **Order Monitoring**: View all orders and customer data
- **Customer Insights**: Track customer leads and preferences
- **Role-Based Access**: ADMIN and STAFF permissions
- **Real-time Updates**: Live order notifications

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: MongoDB Atlas + Mongoose
- **Authentication**: NextAuth.js with credentials
- **Real-time**: Pusher for live updates
- **Payments**: Stripe Checkout (test mode)
- **Validation**: Zod schema validation
- **Animations**: Framer Motion

## 📱 Design Philosophy

- **Mobile-First**: Optimized for mobile devices
- **Modern UI**: Electric blue accent, rounded corners, soft shadows
- **Smooth Animations**: Subtle transitions and micro-interactions
- **Accessibility**: Clean, readable interfaces
- **Performance**: Fast loading and smooth interactions

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd qart
npm install
# or
pnpm install
```

### 2. Environment Setup

Copy `env.example` to `.env.local` and configure your environment variables. See `env.example` for the required variables.

### 3. Database Setup

```bash
# Seed the database with sample data
npm run seed
# or
pnpm seed
```

### 4. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔑 Default Credentials

After seeding, default users are created. Check the seed script for details.

## 📊 Data Models

### User
```typescript
{
  email: string (unique)
  passwordHash: string
  role: 'ADMIN' | 'STAFF'
  name: string
  createdAt: Date
}
```

### Product
```typescript
{
  name: string
  description?: string
  priceCents: number
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Order
```typescript
{
  customerLeadId: ObjectId
  status: 'NEW' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  items: Array<{
    productId: ObjectId
    name: string
    unitPriceCents: number
    quantity: number
    lineTotalCents: number
    notes?: string
  }>
  subtotalCents: number
  discountCents: number
  totalCents: number
  voucherCode?: string
  orderNotes?: string
  createdAt: Date
  updatedAt: Date
}
```

### Voucher
```typescript
{
  code: string (unique, uppercase)
  type: 'PERCENT' | 'FIXED'
  value: number
  minSubtotalCents: number
  maxDiscountCents?: number
  startsAt: Date
  endsAt?: Date
  isActive: boolean
  createdAt: Date
}
```

## 🔄 Customer Flow

1. **Start** (`/start`) → Customer lead form
2. **Menu** (`/menu`) → Browse products, add to cart
3. **Cart** (`/cart`) → Review order, apply vouchers
4. **Checkout** → Stripe payment processing
5. **Confirmation** (`/order/[id]/confirm`) → Order status

## 🍳 Kitchen Display

- **Route**: `/kitchen`
- **Authentication**: ADMIN or STAFF role required
- **Real-time**: New orders appear instantly
- **Sound**: Audio notification for new orders (only when page is focused)
- **Layout**: Grid of order cards with customer info
- **Auto-refresh**: No manual refresh needed

## 👨‍💼 Admin Panel

- **Route**: `/admin`
- **Authentication**: Required for all admin routes
- **Features**: Menu, Vouchers, Orders, Customers, Settings
- **Real-time**: Live order updates

## 🎯 API Endpoints

### Customer
- `POST /api/start` - Create customer lead
- `GET /api/menu` - List active products
- `POST /api/cart/apply-voucher` - Apply discount code
- `POST /api/checkout` - Create order + Stripe session
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders/[id]/check-payment` - Check payment status

### Admin
- `GET/POST /api/admin/products` - Product CRUD
- `GET/POST /api/admin/vouchers` - Voucher CRUD
- `GET /api/admin/orders` - List orders
- `GET /api/admin/customers` - List customer leads

### Kitchen
- `GET /api/kitchen/orders` - Kitchen display data (authenticated)

### System
- `POST /api/webhooks/stripe` - Payment webhook
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

## 🔧 Development

### Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run seed             # Seed database
npm run setup-production # Setup production database
```

### Project Structure

```
qart/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   │   ├── customers/     # Customer management
│   │   ├── login/         # Admin login
│   │   ├── orders/        # Order management
│   │   ├── products/      # Product management
│   │   ├── settings/      # Settings page
│   │   └── vouchers/      # Voucher management
│   ├── api/               # API routes
│   │   ├── admin/         # Admin API endpoints
│   │   ├── auth/          # Authentication
│   │   ├── cart/          # Cart operations
│   │   ├── checkout/      # Payment processing
│   │   ├── kitchen/       # Kitchen API
│   │   ├── menu/          # Menu API
│   │   ├── orders/        # Order API
│   │   ├── start/         # Customer onboarding
│   │   ├── vouchers/      # Voucher validation
│   │   └── webhooks/      # Webhook handlers
│   ├── cart/              # Shopping cart
│   ├── contexts/          # React contexts
│   ├── kitchen/           # Kitchen display
│   ├── menu/              # Product menu
│   ├── order/             # Order confirmation
│   └── start/             # Customer onboarding
├── components/             # Reusable UI components
│   └── ui/                # shadcn/ui components
├── lib/                    # Utilities and configurations
├── models/                 # MongoDB schemas
├── scripts/                # Database seeding
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
    └── sounds/             # Audio files
```

## 🚀 Deployment

### Vercel (Recommended)

#### Quick Deployment (5 minutes)

1. **Setup Accounts** (2 minutes)
   - Create [MongoDB Atlas](https://cloud.mongodb.com/) account (free)
   - Create [Stripe](https://stripe.com/) account (free)
   - Create [Pusher](https://pusher.com/) account (free)
   - Create [Vercel](https://vercel.com/) account (free)

2. **Database Setup** (1 minute)
   - Create MongoDB cluster (M0 Free)
   - Create database user
   - Allow network access from anywhere (0.0.0.0/0)
   - Copy connection string

3. **Third-Party Services** (1 minute)
   - Get Stripe API keys (test mode)
   - Get Pusher app credentials
   - Generate strong NEXTAUTH_SECRET

4. **Deploy to Vercel** (1 minute)
   - Push code to GitHub
   - Import repository on Vercel
   - Add environment variables
   - Deploy!

#### Environment Variables for Vercel

Configure your environment variables in the Vercel dashboard. See `env.production.example` for the required variables.

#### Database Setup After Deployment

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npm run setup-production

# Option 2: Manual setup
# Run the setup script with your MONGODB_URI
```

### Other Platforms

- **Netlify**: Compatible with Next.js
- **Railway**: Good for full-stack apps
- **DigitalOcean**: App Platform support

## 🔒 Security Features

- **Authentication**: NextAuth.js with secure sessions
- **Authorization**: Role-based access control (ADMIN/STAFF)
- **Validation**: Zod schema validation
- **HTTPS**: Secure communication
- **Environment Variables**: Sensitive data protection
- **API Protection**: Authenticated endpoints

## 📱 Mobile Optimization

- **Responsive Design**: Works on all screen sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Fast Loading**: Optimized images and assets
- **Offline Support**: Basic offline functionality
- **PWA Ready**: Progressive Web App capabilities

## 🎨 Customization

### Colors
- Primary: Electric blue (`#3B82F6`)
- Customizable via Tailwind config

### Components
- Built with shadcn/ui for consistency
- Easy to modify and extend

### Styling
- Tailwind CSS with custom utilities
- Component-based design system

## 🔊 Sound System

### Kitchen Display System (KDS)
- **Sound File**: `/sounds/new-order.mp3`
- **Trigger**: New paid orders received
- **Conditions**: Only plays when KDS page is focused
- **Volume**: 50% by default

### Payment Confirmation
- **Sound**: Disabled (as per user preference)
- **Visual**: Only visual confirmation shown

## 🔄 Real-time Features

### Pusher Integration
- **Channels**: `kitchen`, `admin`, `order:[id]`
- **Events**: 
  - `kitchen.order_paid` - New paid orders for KDS
  - `admin.new_order` - New orders for admin panel
  - `admin.order_paid` - Payment confirmations for admin
  - `order.paid` - Payment confirmation for customers

### Real-time Updates
- **Kitchen**: Instant order display
- **Admin**: Live order monitoring
- **Customer**: Payment status updates

## 🧪 Testing

### Customer Flow
1. Visit your app URL
2. Start order → Add items → Checkout
3. Use Stripe test cards for testing

### Kitchen Display
1. Go to `/kitchen`
2. Login with staff credentials
3. Verify real-time updates

### Admin Panel
1. Go to `/admin`
2. Login with admin credentials
3. Manage orders and products

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check environment variables |
| Database connection error | Verify MONGODB_URI format |
| Authentication fails | Check NEXTAUTH_SECRET and URL |
| Payments not working | Verify Stripe keys and webhook |
| Real-time not working | Check Pusher credentials |
| Sound not playing | Check browser autoplay policies |

### Development Tips

- **Hot Reload**: Changes reflect immediately in development
- **Error Logging**: Check browser console and server logs
- **Database**: Use MongoDB Compass for data inspection
- **Environment**: Use `.env.local` for local development

## 📚 Documentation

- **`DEPLOYMENT.md`** - Complete deployment guide
- **`QUICK_DEPLOY.md`** - 5-minute deployment checklist
- **`env.example`** - Environment variables template
- **`env.production.example`** - Production environment template

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples
- Check troubleshooting section

## 🎉 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Tailwind CSS for styling utilities
- shadcn/ui for component library
- MongoDB for database solution
- Stripe for payment processing
- Pusher for real-time features

---

**Qart** - Modern QR ordering for modern restaurants 🍽️✨

*Built with ❤️ using Next.js, TypeScript, and modern web technologies*
