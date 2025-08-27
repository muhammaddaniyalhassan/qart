import mongoose from 'mongoose'

export interface IUser {
  _id: string
  name?: string
  email: string
  passwordHash: string
  role: 'ADMIN' | 'STAFF'
  createdAt: Date
}

const userSchema = new mongoose.Schema<IUser>({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'STAFF'], default: 'STAFF' },
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'users'
})

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema)
