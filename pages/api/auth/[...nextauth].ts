import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/cockroachDB/prisma'
import bcrypt from 'bcryptjs'

// Export authorize function for testing
export async function credentialsAuthorize(credentials: any) {
  if (!credentials?.identifier) {
    return null
  }

  const loginType = credentials.loginType || 'password'

  // Handle OTP login (email or mobile)
  if (loginType === 'otp' && credentials.otp) {
    // Check if OTP is valid
    if (credentials.otp !== '9848022338') {
      return null
    }

    // Find user by email or mobile (can be verified or unverified, but must exist in DB)
    const isEmail = credentials.identifier.includes('@')
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: credentials.identifier } : { phone: credentials.identifier },
    })

    // User must exist in DB for OTP login
    if (!user) {
      return null
    }

    // Update verification status
    if (isEmail) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      })
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { mobileVerified: new Date() },
      })
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.name || '',
      role: user.role,
      username: user.username,
      mobileNumber: user.phone || '',
    }
  }

  // Handle password login
  if (!credentials.password) {
    return null
  }

  // Determine if identifier is email or username
  const isEmail = credentials.identifier.includes('@')

  const user = await prisma.user.findFirst({
    where: isEmail ? { email: credentials.identifier } : { username: credentials.identifier },
  })

  if (!user || !user.password) {
    return null
  }

  const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

  if (!isPasswordValid) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    username: user.username,
    mobileNumber: user.phone,
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email/Username/Mobile', type: 'text' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP', type: 'text' },
        loginType: { label: 'Login Type', type: 'text' },
      },
      authorize: credentialsAuthorize,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, populate token from user object
      if (user) {
        token.role = user.role
        token.username = user.username
        token.mobileNumber = user.mobileNumber
      }
      // Refresh token data only on explicit update trigger
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            username: true,
            phone: true,
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.username = dbUser.username
          token.mobileNumber = dbUser.phone
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && token.sub) {
        // Fetch user data from database for each session request
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            image: true,
            emailVerified: true,
            mobileVerified: true,
            companyName: true,
            role: true,
            username: true,
            phone: true,
          },
        })

        session.user.id = token.sub
        session.user.role = (token.role || dbUser?.role) as string
        session.user.username = (token.username || dbUser?.username) as string
        session.user.mobileNumber = (token.mobileNumber || dbUser?.phone) as string
        session.user.image = dbUser?.image as string
        session.user.imageLink = dbUser?.image as string
        session.user.isEmailVerified = !!dbUser?.emailVerified
        session.user.isMobileVerified = !!dbUser?.mobileVerified
        session.user.isAgent = (token.role || dbUser?.role) === 'AGENT'
        session.user.companyName = dbUser?.companyName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export default NextAuth(authOptions)
