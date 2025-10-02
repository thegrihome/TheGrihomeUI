import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { type, value } = req.body

  if (!type || !value) {
    return res.status(400).json({ message: 'Type and value are required' })
  }

  if (!['email', 'mobile'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type' })
  }

  try {
    let user

    if (type === 'email') {
      // Search user table with email address
      user = await prisma.user.findUnique({
        where: { email: value },
        select: {
          id: true,
          emailVerified: true,
        },
      })
    } else if (type === 'mobile') {
      // Search user table with country code and mobile number
      user = await prisma.user.findFirst({
        where: { phone: value },
        select: {
          id: true,
          mobileVerified: true,
        },
      })
    }

    if (!user) {
      return res.status(404).json({
        message: `${type === 'email' ? 'Email' : 'Mobile number'} not registered`,
        canSendOTP: false,
      })
    }

    // Check if verification timestamp is not null
    let isVerified = false
    if (type === 'email' && 'emailVerified' in user) {
      isVerified = user.emailVerified !== null
    } else if (type === 'mobile' && 'mobileVerified' in user) {
      isVerified = user.mobileVerified !== null
    }

    if (!isVerified) {
      return res.status(400).json({
        message: `${type === 'email' ? 'Email' : 'Mobile number'} not verified. Please verify in your profile first.`,
        canSendOTP: false,
      })
    }

    // User exists and is verified - can send OTP
    res.status(200).json({
      message: 'Can send OTP',
      canSendOTP: true,
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Verification check error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
