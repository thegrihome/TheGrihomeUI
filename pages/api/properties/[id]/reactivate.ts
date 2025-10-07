import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { LISTING_STATUS } from '@/lib/constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const { id } = req.query

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
      return res.status(403).json({ message: 'You can only reactivate your own properties' })
    }

    if (property.listingStatus !== LISTING_STATUS.ARCHIVED) {
      return res.status(400).json({ message: 'Only archived properties can be reactivated' })
    }

    // Reactivate the property
    await prisma.property.update({
      where: { id },
      data: {
        listingStatus: LISTING_STATUS.ACTIVE,
        updatedAt: new Date(),
      },
    })

    res.status(200).json({ message: 'Property reactivated successfully' })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error reactivating property:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
