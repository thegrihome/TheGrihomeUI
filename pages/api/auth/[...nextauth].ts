import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/cockroachDB/prisma'
import bcrypt from 'bcryptjs'
import { verifyAccessToken } from '@/lib/msg91/server'
import { FALLBACK_OTP } from '@/lib/msg91/config'

// Export authorize function for testing
export async function credentialsAuthorize(credentials: any) {
  if (!credentials?.identifier) {
    return null
  }

  const loginType = credentials.loginType || 'password'

  // Handle OTP login (email or mobile)
  if (loginType === 'otp' && credentials.otp) {
    // Verify OTP via MSG91 or fallback OTP
    let isOtpValid = false

    // Check fallback OTP first (works in all environments)
    if (credentials.otp === FALLBACK_OTP) {
      isOtpValid = true
    }
    // Verify MSG91 token if provided
    else if (credentials.msg91Token) {
      const tokenResult = await verifyAccessToken(credentials.msg91Token)
      isOtpValid = tokenResult.success
    }

    if (!isOtpValid) {
      return null
    }

    // Find user by email or mobile (can be verified or unverified, but must exist in DB)
    const isEmail = credentials.identifier.includes('@')
    let user = null

    if (isEmail) {
      user = await prisma.user.findFirst({
        where: { email: credentials.identifier },
      })
    } else {
      // Try multiple phone formats
      const phoneFormats = [
        credentials.identifier,
        credentials.identifier.replace(/^\+/, ''),
        `+${credentials.identifier.replace(/^\+/, '')}`,
      ]

      for (const phone of phoneFormats) {
        user = await prisma.user.findFirst({
          where: { phone },
        })
        if (user) break
      }
    }

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
        msg91Token: { label: 'MSG91 Token', type: 'text' },
      },
      authorize: credentialsAuthorize,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, fetch full user data and store in token
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            mobileVerified: true,
            companyName: true,
            role: true,
            username: true,
            phone: true,
          },
        })
        if (dbUser) {
          token.name = dbUser.name
          token.email = dbUser.email
          token.image = dbUser.image
          token.role = dbUser.role
          token.username = dbUser.username
          token.mobileNumber = dbUser.phone
          token.isEmailVerified = !!dbUser.emailVerified
          token.isMobileVerified = !!dbUser.mobileVerified
          token.companyName = dbUser.companyName
        }
      }
      // Refresh token data only on explicit update trigger
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            mobileVerified: true,
            companyName: true,
            role: true,
            username: true,
            phone: true,
          },
        })
        if (dbUser) {
          token.name = dbUser.name
          token.email = dbUser.email
          token.image = dbUser.image
          token.role = dbUser.role
          token.username = dbUser.username
          token.mobileNumber = dbUser.phone
          token.isEmailVerified = !!dbUser.emailVerified
          token.isMobileVerified = !!dbUser.mobileVerified
          token.companyName = dbUser.companyName
        }
      }
      return token
    },
    async session({ session, token }) {
      // Read all data from token - no database query needed
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.name = (token.name as string) || session.user.name
        session.user.email = (token.email as string) || session.user.email
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.mobileNumber = token.mobileNumber as string
        session.user.image = token.image as string
        session.user.imageLink = token.image as string
        session.user.isEmailVerified = token.isEmailVerified as boolean
        session.user.isMobileVerified = token.isMobileVerified as boolean
        session.user.isAgent = token.role === 'AGENT'
        session.user.companyName = token.companyName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export default NextAuth(authOptions)
