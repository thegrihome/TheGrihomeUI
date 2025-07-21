import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserSession } from '../../../lib/cookies'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { userId, imageUrl } = req.body

  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' })
  }

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required' })
  }

  try {
    // Update user avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { imageLink: imageUrl },
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
      message: 'Avatar updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Avatar update error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
