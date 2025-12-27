import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { checkUserVerification } from '@/lib/utils/verify-user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const { propertyId } = req.body

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' })
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { userId: true },
    })

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    // Prevent owner from favoriting their own property
    if (property.userId === session.user.id) {
      return res.status(403).json({ message: 'You cannot favorite your own property' })
    }

    // Check if already favorited
    const existingFavorite = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId,
        },
      },
    })

    if (existingFavorite) {
      // Remove from favorites
      await prisma.savedProperty.delete({
        where: {
          id: existingFavorite.id,
        },
      })

      return res.status(200).json({
        message: 'Property removed from favorites',
        isFavorited: false,
      })
    } else {
      // Add to favorites
      await prisma.savedProperty.create({
        data: {
          userId: session.user.id,
          propertyId,
        },
      })

      return res.status(200).json({
        message: 'Property added to favorites',
        isFavorited: true,
      })
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Toggle favorite error:', error)
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
