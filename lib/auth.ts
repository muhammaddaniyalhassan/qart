import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import dbConnect from './db'
import User from '@/models/User'

// Fallback values for development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qart'
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-here-change-this-in-production'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          await dbConnect()
          
          const user = await User.findOne({ email: credentials.email })
          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isPasswordValid) {
            return null
          }

          // Allow ADMIN and STAFF users to access the system
          if (!['ADMIN', 'STAFF'].includes(user.role)) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          // For development, allow fallback authentication for admin and staff
          if (process.env.NODE_ENV === 'development') {
            if (credentials.email === 'admin@qart.local' && credentials.password === 'Admin123!') {
              return {
                id: 'admin-fallback',
                email: 'admin@qart.local',
                name: 'Admin',
                role: 'ADMIN',
              }
            }
            if (credentials.email === 'staff@qart.local' && credentials.password === 'Staff123!') {
              return {
                id: 'staff-fallback',
                email: 'staff@qart.local',
                name: 'Staff',
                role: 'STAFF',
              }
            }
          }
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: NEXTAUTH_SECRET,
}
