#!/usr/bin/env node

/**
 * Production Database Setup Script
 * Run this after deploying to Vercel to seed your production database
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'STAFF'], required: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  priceCents: { type: Number, required: true },
  imageUrl: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Voucher Schema
const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['PERCENT', 'FIXED'], required: true },
  value: { type: Number, required: true },
  minSubtotalCents: { type: Number, default: 0 },
  maxDiscountCents: { type: Number },
  startsAt: { type: Date, default: Date.now },
  endsAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Voucher = mongoose.models.Voucher || mongoose.model('Voucher', voucherSchema);

// Sample data
const products = [
  {
    name: 'Margherita Pizza',
    description: 'Classic tomato, fresh mozzarella, basil.',
    priceCents: 1199,
    imageUrl: 'https://images.unsplash.com/photo-1601924582971-b0c5be3c7b49',
    isActive: true,
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Loaded pepperoni, mozzarella, oregano.',
    priceCents: 1399,
    imageUrl: 'https://images.unsplash.com/photo-1548365328-9f547fb09530',
    isActive: true,
  },
  {
    name: 'Chicken Burger',
    description: 'Crispy chicken, lettuce, mayo, toasted bun.',
    priceCents: 899,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
    isActive: true,
  },
  {
    name: 'Fries',
    description: 'Skin-on, double-cooked, sea salt.',
    priceCents: 349,
    imageUrl: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0',
    isActive: true,
  },
  {
    name: 'Caesar Salad',
    description: 'Crisp romaine, parmesan, croutons, dressing.',
    priceCents: 749,
    imageUrl: 'https://images.unsplash.com/photo-1569058242567-93de6f2b1f21',
    isActive: true,
  },
  {
    name: 'Iced Latte',
    description: 'Double shot espresso over ice with milk.',
    priceCents: 399,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772',
    isActive: true,
  },
  {
    name: 'Fresh Lemonade',
    description: 'Squeezed lemons, sugar, mint.',
    priceCents: 299,
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e',
    isActive: true,
  },
  {
    name: 'Chocolate Brownie',
    description: 'Gooey center, dark chocolate chunks.',
    priceCents: 449,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476d',
    isActive: true,
  },
];

const now = new Date();
const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

const vouchers = [
  {
    code: 'WELCOME10',
    type: 'PERCENT',
    value: 10, // 10%
    minSubtotalCents: 1000, // £10 minimum spend
    maxDiscountCents: 500,  // cap £5
    startsAt: now,
    endsAt: ninetyDays,
    isActive: true,
  },
];

async function setupProduction() {
  try {
    console.log('🚀 Setting up production database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Create users
    console.log('👥 Creating users...');
    
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const staffHash = await bcrypt.hash('Staff123!', 10);

    await User.findOneAndUpdate(
      { email: 'admin@qart.local' },
      { 
        email: 'admin@qart.local',
        passwordHash: adminHash,
        role: 'ADMIN',
        name: 'Qart Admin'
      },
      { upsert: true, new: true }
    );
    console.log('✅ Admin user created/updated');

    await User.findOneAndUpdate(
      { email: 'staff@qart.local' },
      { 
        email: 'staff@qart.local',
        passwordHash: staffHash,
        role: 'STAFF',
        name: 'Qart Staff'
      },
      { upsert: true, new: true }
    );
    console.log('✅ Staff user created/updated');

    // Create products
    console.log('🍕 Creating products...');
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`✅ Created ${products.length} products`);

    // Create vouchers
    console.log('🎫 Creating vouchers...');
    await Voucher.deleteMany({});
    const normalizedVouchers = vouchers.map(v => ({ ...v, code: v.code.toUpperCase() }));
    await Voucher.insertMany(normalizedVouchers);
    console.log(`✅ Created ${vouchers.length} vouchers`);

    console.log('🎉 Production setup complete!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('Admin: admin@qart.local / Admin123!');
    console.log('Staff: staff@qart.local / Staff123!');
    console.log('');
    console.log('🔗 Your app should now be fully functional!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setupProduction();
