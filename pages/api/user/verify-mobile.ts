import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserSession } from '../../../lib/cookies'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { userId, otp } = req.body

  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' })
  }

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' })
  }

  // For development, we only accept OTP 123456
  if (otp !== '123456') {
    return res.status(401).json({ message: 'Invalid OTP' })
  }

  try {
    // Update user mobile verification status in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isMobileVerified: true },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        mobileNumber: true,
        isAgent: true,
        role: true,
        companyName: true,
        imageLink: true,
        isEmailVerified: true,
        isMobileVerified: true,
        createdAt: true,
      },
    })

    res.status(200).json({
      message: 'Mobile verified successfully',
      user: updatedUser,
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Mobile verification error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
