# 🚀 Qart - Vercel Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] MongoDB Atlas account (free tier works)
- [ ] Stripe account (for payments)
- [ ] Pusher account (for real-time features)

## 🔧 Step 1: Database Setup (MongoDB Atlas)

### 1.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Choose your preferred region

### 1.2 Configure Database Access
1. Go to "Database Access"
2. Create a new database user:
   - Username: `qart-admin`
   - Password: Generate a strong password
   - Role: "Atlas admin"

### 1.3 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>`, `<password>`, and `<database>` with your values

## 💳 Step 2: Stripe Setup

### 2.1 Create Stripe Account
1. Go to [Stripe](https://stripe.com/)
2. Create an account
3. Get your API keys from Dashboard

### 2.2 Configure Webhooks
1. Go to "Developers" → "Webhooks"
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy the webhook secret

## 📡 Step 3: Pusher Setup

### 3.1 Create Pusher App
1. Go to [Pusher](https://pusher.com/)
2. Create a new app
3. Choose "Channels" product
4. Select your region

### 3.2 Get App Credentials
1. Go to "App Keys"
2. Copy:
   - App ID
   - Key
   - Secret
   - Cluster

## 🌐 Step 4: Deploy to Vercel

### 4.1 Prepare Your Repository
1. Push your code to GitHub
2. Ensure all files are committed

### 4.2 Deploy on Vercel
1. Go to [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 4.3 Configure Environment Variables
In Vercel dashboard, go to "Settings" → "Environment Variables" and add:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://qart-admin:your-password@your-cluster.mongodb.net/qart?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-here-make-it-long-and-random

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

### 4.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-domain.vercel.app`

## 🗄️ Step 5: Seed Database

### 5.1 Run Seed Script
After deployment, you need to seed your database with initial data:

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npm run seed

# Option 2: Using MongoDB Atlas
# Connect to your database and run the seed script manually
```

### 5.2 Verify Data
Check that the following are created:
- ✅ Admin user: `admin@qart.local` / `Admin123!`
- ✅ Staff user: `staff@qart.local` / `Staff123!`
- ✅ Sample products
- ✅ Sample vouchers

## 🔄 Step 6: Update Stripe Webhook URL

After deployment, update your Stripe webhook endpoint:
1. Go to Stripe Dashboard → Webhooks
2. Update the endpoint URL to your Vercel domain
3. Test the webhook

## 🧪 Step 7: Test Everything

### 7.1 Test Customer Flow
1. Visit your Vercel URL
2. Start a new order
3. Add items to cart
4. Complete checkout with Stripe test card
5. Verify order confirmation

### 7.2 Test Kitchen Display
1. Go to `/kitchen`
2. Login with staff credentials
3. Verify real-time order updates
4. Test sound notifications

### 7.3 Test Admin Panel
1. Go to `/admin`
2. Login with admin credentials
3. Verify order management
4. Test real-time updates

## 🔧 Troubleshooting

### Common Issues:

#### 1. Database Connection Failed
- ✅ Check MONGODB_URI format
- ✅ Verify network access in Atlas
- ✅ Check database user credentials

#### 2. Authentication Not Working
- ✅ Verify NEXTAUTH_SECRET is set
- ✅ Check NEXTAUTH_URL matches your domain
- ✅ Ensure users exist in database

#### 3. Stripe Payments Failing
- ✅ Check STRIPE_SECRET_KEY
- ✅ Verify webhook endpoint URL
- ✅ Test with Stripe test cards

#### 4. Real-time Features Not Working
- ✅ Check Pusher credentials
- ✅ Verify NEXT_PUBLIC_ variables are set
- ✅ Check browser console for errors

#### 5. Build Failures
- ✅ Check all dependencies in package.json
- ✅ Verify TypeScript compilation
- ✅ Check for missing environment variables

## 📊 Monitoring

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Check for errors in deployment logs

### Database Monitoring
- Use MongoDB Atlas monitoring
- Set up alerts for connection issues
- Monitor query performance

## 🔒 Security Checklist

- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Restrict MongoDB network access if possible
- [ ] Use environment variables for all secrets
- [ ] Regularly update dependencies

## 🎉 Success!

Your Qart application is now live on Vercel with:
- ✅ Full-stack Next.js application
- ✅ MongoDB Atlas database
- ✅ Stripe payment processing
- ✅ Real-time updates with Pusher
- ✅ Kitchen display system
- ✅ Admin panel
- ✅ Customer ordering system

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Test locally with production environment
4. Check browser console for errors
5. Verify all third-party services are configured correctly
