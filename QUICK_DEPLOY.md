# 🚀 Quick Vercel Deployment Checklist

## ⚡ 5-Minute Deployment Guide

### 1. **Setup Accounts** (2 minutes)
- [ ] Create [MongoDB Atlas](https://cloud.mongodb.com/) account (free)
- [ ] Create [Stripe](https://stripe.com/) account (free)
- [ ] Create [Pusher](https://pusher.com/) account (free)
- [ ] Create [Vercel](https://vercel.com/) account (free)

### 2. **Database Setup** (1 minute)
- [ ] Create MongoDB cluster (M0 Free)
- [ ] Create database user: `qart-admin`
- [ ] Allow network access from anywhere (0.0.0.0/0)
- [ ] Copy connection string

### 3. **Third-Party Services** (1 minute)
- [ ] Get Stripe API keys (test mode)
- [ ] Get Pusher app credentials
- [ ] Generate strong NEXTAUTH_SECRET

### 4. **Deploy to Vercel** (1 minute)
- [ ] Push code to GitHub
- [ ] Import repository on Vercel
- [ ] Add environment variables
- [ ] Deploy!

---

## 🔧 Environment Variables for Vercel

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://qart-admin:password@cluster.mongodb.net/qart?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-32-character-secret-key

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pusher
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

---

## 🗄️ Database Setup After Deployment

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npm run setup-production

# Option 2: Manual setup
# Run the setup script with your MONGODB_URI
MONGODB_URI=your_connection_string node scripts/setup-production.js
```

---

## 🧪 Test Your Deployment

### Customer Flow
1. Visit your Vercel URL
2. Start order → Add items → Checkout
3. Use Stripe test card: `4242 4242 4242 4242`

### Kitchen Display
1. Go to `/kitchen`
2. Login: `staff@qart.local` / `Staff123!`
3. Verify real-time updates

### Admin Panel
1. Go to `/admin`
2. Login: `admin@qart.local` / `Admin123!`
3. Manage orders and products

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Pusher Dashboard**: https://dashboard.pusher.com/

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check environment variables |
| Database connection error | Verify MONGODB_URI format |
| Authentication fails | Check NEXTAUTH_SECRET and URL |
| Payments not working | Verify Stripe keys and webhook |
| Real-time not working | Check Pusher credentials |

---

## 🎉 Success!

Your Qart application is now live with:
- ✅ Full-stack Next.js app
- ✅ MongoDB Atlas database
- ✅ Stripe payment processing
- ✅ Real-time updates with Pusher
- ✅ Kitchen display system
- ✅ Admin panel
- ✅ Customer ordering system

**Your app URL**: `https://your-domain.vercel.app`
