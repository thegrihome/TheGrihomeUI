import { NextApiRequest, NextApiResponse } from 'next'
import validator from 'validator'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { type, value } = req.body

  // Debug: Log what we received
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('check-user API received:', { type, value, body: req.body })
  }

  if (!type || !value) {
    return res.status(400).json({ message: 'Type and value are required' })
  }

  if (!['email', 'mobile'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type' })
  }

  // No validation in API - frontend handles all validation

  try {
    let whereClause: any

    switch (type) {
      case 'email':
        whereClause = { email: value }
        break
      case 'mobile':
        whereClause = { phone: value }
        break
    }

    // For mobile searches, try multiple formats to handle legacy data
    let existingUser
    if (type === 'mobile') {
      const phoneDigits = value.replace(/\D/g, '') // Extract just digits

      // Try exact match first
      existingUser = await prisma.user.findFirst({
        where: { phone: value },
        select: {
          id: true,
          emailVerified: true,
          mobileVerified: true,
        },
      })

      // If no exact match, try common alternative formats
      if (!existingUser) {
        const alternativeFormats = [
          phoneDigits, // Just digits: "1234567890"
          `+91${phoneDigits}`, // India format: "+911234567890"
          `+1${phoneDigits}`, // US format: "+11234567890"
          `91${phoneDigits}`, // Without + sign: "911234567890"
        ]

        for (const format of alternativeFormats) {
          if (format !== value) {
            // Skip if same as original
            existingUser = await prisma.user.findFirst({
              where: { phone: format },
              select: {
                id: true,
                emailVerified: true,
                mobileVerified: true,
              },
            })
            if (existingUser) break
          }
        }
      }
    } else {
      // For email, use exact match
      existingUser = await prisma.user.findFirst({
        where: whereClause,
        select: {
          id: true,
          emailVerified: true,
          mobileVerified: true,
        },
      })
    }

    if (!existingUser) {
      return res.status(404).json({
        message: `${type === 'email' ? 'Email' : 'Mobile number'} not registered. Please sign up first`,
        exists: false,
      })
    }

    // Check verification status
    const isVerified =
      type === 'email' ? existingUser.emailVerified !== null : existingUser.mobileVerified !== null

    // User exists - return success (OTP login works for both verified and unverified)
    res.status(200).json({
      exists: true,
      verified: isVerified,
      user: {
        id: existingUser.id,
        emailVerified: existingUser.emailVerified,
        mobileVerified: existingUser.mobileVerified,
      },
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('User check error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
