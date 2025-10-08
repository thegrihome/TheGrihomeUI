import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/cockroachDB/prisma'
import bcrypt from 'bcryptjs'

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
      async authorize(credentials) {
        if (!credentials?.identifier) {
          return null
        }

        const loginType = credentials.loginType || 'password'

        // Handle OTP login (email or mobile)
        if (loginType === 'otp' && credentials.otp) {
          // Check if OTP is valid (123456 for development)
          if (credentials.otp !== '123456') {
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
            email: user.email,
            name: user.name,
            role: user.role,
            username: user.username,
            mobileNumber: user.phone,
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
      },
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
        // Fetch additional user data from database
        if (token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              image: true,
              emailVerified: true,
              mobileVerified: true,
              companyName: true,
            },
          })
          if (dbUser) {
            token.image = dbUser.image
            token.imageLink = dbUser.image
            token.isEmailVerified = !!dbUser.emailVerified
            token.isMobileVerified = !!dbUser.mobileVerified
            token.isAgent = user.role === 'AGENT'
            token.companyName = dbUser.companyName
          }
        }
      }
      // Refresh token data only on explicit update trigger
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            image: true,
            username: true,
            phone: true,
            emailVerified: true,
            mobileVerified: true,
            companyName: true,
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.image = dbUser.image
          token.username = dbUser.username
          token.mobileNumber = dbUser.phone
          token.imageLink = dbUser.image
          token.isEmailVerified = !!dbUser.emailVerified
          token.isMobileVerified = !!dbUser.mobileVerified
          token.isAgent = dbUser.role === 'AGENT'
          token.companyName = dbUser.companyName
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.image = token.image as string
        session.user.username = token.username as string
        session.user.mobileNumber = token.mobileNumber as string
        session.user.isEmailVerified = token.isEmailVerified as boolean
        session.user.isMobileVerified = token.isMobileVerified as boolean
        session.user.isAgent = token.isAgent as boolean
        session.user.companyName = token.companyName as string
        session.user.imageLink = token.imageLink as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export default NextAuth(authOptions)
