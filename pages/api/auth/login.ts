import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { type, username, password, email, mobile, otp } = req.body

  if (!type) {
    return res.status(400).json({ message: 'Login type is required' })
  }

  try {
    let user

    if (type === 'username-password') {
      if (!username || !password) {
        return res.status(400).json({ message: 'Username/Email and password are required' })
      }

      // Check if the input is an email or username
      const isEmail = username.includes('@')

      // Find user by either email or username
      user = await prisma.user.findFirst({
        where: isEmail ? { email: username } : { username: username },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          password: true,
          role: true,
          companyName: true,
          image: true,
          emailVerified: true,
          mobileVerified: true,
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(401).json({ message: 'Invalid username/email or password' })
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password || '')
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid username/email or password' })
      }

      // For username-password login, return user as-is without changing verification status
      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          companyName: user.companyName,
          image: user.image,
          emailVerified: user.emailVerified,
          mobileVerified: user.mobileVerified,
          createdAt: user.createdAt,
        },
        message: 'Login successful',
      })
    } else if (type === 'email-otp') {
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' })
      }

      // Find user by email
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          companyName: true,
          image: true,
          emailVerified: true,
          mobileVerified: true,
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(401).json({ message: 'Email not found' })
      }

      // For development, we only accept OTP 123456
      if (otp !== '123456') {
        return res.status(401).json({ message: 'Invalid OTP' })
      }

      // Mark email as verified if OTP login is successful
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          companyName: true,
          image: true,
          emailVerified: true,
          mobileVerified: true,
          createdAt: true,
        },
      })

      res.status(200).json({
        user: updatedUser,
        message: 'Login successful',
      })
    } else if (type === 'mobile-otp') {
      if (!mobile || !otp) {
        return res.status(400).json({ message: 'Mobile number and OTP are required' })
      }

      // Debug: Log what we're searching for
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Searching for mobile:', mobile)
        // eslint-disable-next-line no-console
        console.log('Search query: { phone:', mobile, '}')
      }

      // Find user by phone number
      user = await prisma.user.findFirst({
        where: { phone: mobile },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          companyName: true,
          image: true,
          emailVerified: true,
          mobileVerified: true,
          createdAt: true,
        },
      })

      // Debug: Log what we found
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          'Found user:',
          user ? { phone: user.phone, mobileVerified: user.mobileVerified } : 'null'
        )

        // Also search for any similar numbers
        const allUsers = await prisma.user.findMany({
          select: { phone: true, email: true },
          take: 10,
        })
        // eslint-disable-next-line no-console
        console.log(
          'All phone numbers in DB:',
          allUsers.map(u => ({ phone: u.phone, email: u.email }))
        )
      }

      if (!user) {
        return res
          .status(401)
          .json({ message: 'Mobile number not registered. Please sign up first.' })
      }

      // For development, we only accept OTP 123456
      if (otp !== '123456') {
        return res.status(401).json({ message: 'Invalid OTP' })
      }

      // Mark mobile as verified if OTP login is successful
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { mobileVerified: new Date() },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          companyName: true,
          image: true,
          emailVerified: true,
          mobileVerified: true,
          createdAt: true,
        },
      })

      res.status(200).json({
        user: updatedUser,
        message: 'Login successful',
      })
    } else {
      return res.status(400).json({ message: 'Invalid login type' })
    }
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Login error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
