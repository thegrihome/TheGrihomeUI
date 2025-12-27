import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { LISTING_STATUS } from '@/lib/constants'
import { checkUserVerification } from '@/lib/utils/verify-user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const { id } = req.query
    const { markAsSold, soldTo, soldToUserId } = req.body

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Property ID is required' })
    }

    // Find the property and verify ownership
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        listingStatus: true,
      },
    })

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.userId !== session.user.id) {
      return res.status(403).json({ message: 'You can only archive your own properties' })
    }

    if (property.listingStatus !== LISTING_STATUS.ACTIVE) {
      return res.status(400).json({ message: 'Only active properties can be archived' })
    }

    // Determine status and additional fields based on markAsSold flag
    const newStatus = markAsSold ? LISTING_STATUS.SOLD : LISTING_STATUS.ARCHIVED
    const updateData: any = {
      listingStatus: newStatus,
      updatedAt: new Date(),
    }

    if (markAsSold) {
      updateData.soldTo = soldTo || 'External Buyer'
      updateData.soldToUserId = soldToUserId || null
      updateData.soldDate = new Date()
    }

    // Archive/Sell the property and expire any active ads
    await prisma.$transaction([
      prisma.property.update({
        where: { id },
        data: updateData,
      }),
      prisma.ad.updateMany({
        where: {
          propertyId: id,
          status: 'ACTIVE',
        },
        data: {
          status: 'EXPIRED',
        },
      }),
    ])

    res.status(200).json({
      message: markAsSold
        ? 'Property marked as sold successfully'
        : 'Property archived successfully',
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error archiving property:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
