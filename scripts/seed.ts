/* scripts/seed.ts
   Seed data for qart (MVP: 1 table, flat menu, Stripe + Pusher + MongoDB)
*/
import 'dotenv/config';
import path from 'path';
import { config } from 'dotenv';

// Load .env.local from the project root (parent of scripts folder)
config({ path: path.join(__dirname, '..', '.env.local') });
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ---------- Connection ----------
const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

// ---------- Schemas (match your models folder) ----------
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'STAFF'], default: 'STAFF' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

const customerLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: String,
    email: String,
    tableNumber: { type: String, default: 'T1' }, // single-table MVP
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'customerleads' }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    priceCents: { type: Number, required: true },
    imageUrl: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'products' }
);

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true }, // stored UPPERCASE
    type: { type: String, enum: ['PERCENT', 'FIXED'], required: true },
    value: { type: Number, required: true },
    minSubtotalCents: { type: Number, default: 0 },
    maxDiscountCents: Number,
    usageLimitTotal: Number,
    usageLimitPerCustomer: Number,
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'vouchers' }
);

const orderItemSub = new mongoose.Schema(
  {
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    unitPriceCents: Number,
    quantity: Number,
    lineTotalCents: Number,
    notes: String, // per-item notes
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerLeadId: mongoose.Schema.Types.ObjectId,
    status: { type: String, enum: ['NEW', 'CONFIRMED', 'CANCELLED'], default: 'NEW' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
    paymentProvider: String, // 'STRIPE'
    paymentRef: String,      // Stripe session id
    items: [orderItemSub],
    subtotalCents: Number,
    discountCents: { type: Number, default: 0 },
    discountCode: String,
    serviceChargeCents: { type: Number, default: 0 },
    taxCents: { type: Number, default: 0 },
    totalCents: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'orders' }
);

// Indexes you probably also have in model files
voucherSchema.index({ code: 1 }, { unique: true });
productSchema.index({ isActive: 1 });
orderSchema.index({ createdAt: -1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const CustomerLead = mongoose.models.CustomerLead || mongoose.model('CustomerLead', customerLeadSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Voucher = mongoose.models.Voucher || mongoose.model('Voucher', voucherSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// ---------- Seed Data ----------
const ADMIN_EMAIL = 'admin@qart.local';
const STAFF_EMAIL = 'staff@qart.local';
const ADMIN_PASSWORD = 'Admin123!'; // for local dev only
const STAFF_PASSWORD = 'Staff123!';

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

// ---------- Helpers ----------
async function upsertUser(email: string, password: string, role: 'ADMIN' | 'STAFF', name?: string) {
  const hash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });
  if (existing) {
    const update: any = {};
    // Only update if different (keeps your manual changes if any)
    if (existing.role !== role) update.role = role;
    await User.updateOne({ _id: existing._id }, { $set: { ...update } });
    console.log(`ℹ️  User ${email} exists (role ${existing.role}).`);
    return existing._id;
  }
  const created = await User.create({ email, passwordHash: hash, role, name });
  console.log(`✅ Created user ${email} (${role}).`);
  return created._id;
}

async function resetCollection<T>(Model: mongoose.Model<T>, docs: Partial<T>[], label: string) {
  await Model.deleteMany({});
  const result = await Model.insertMany(docs as T[]);
  console.log(`✅ Seeded ${label}: ${result.length}`);
}

// ---------- Run ----------
async function run() {
  try {
    console.log('🌱 Seeding qart (MongoDB)…');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Users (idempotent upserts)
    await upsertUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'ADMIN', 'Qart Admin');
    await upsertUser(STAFF_EMAIL, STAFF_PASSWORD, 'STAFF', 'Qart Staff');

    // Products + Vouchers (replace-all for simplicity)
    await resetCollection(Product, products, 'products');
    // ensure voucher codes stored uppercase
    const normalizedVouchers = vouchers.map(v => ({ ...v, code: v.code.toUpperCase() }));
    await resetCollection(Voucher, normalizedVouchers, 'vouchers');

    // Clean demo data for MVP (optional)
    await Order.deleteMany({});
    await CustomerLead.deleteMany({});
    console.log('🧹 Cleared orders and customer leads (fresh start).');

    console.log('🎉 Seed complete.');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
