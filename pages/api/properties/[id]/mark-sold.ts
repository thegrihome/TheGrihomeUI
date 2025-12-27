import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { checkUserVerification } from '@/lib/utils/verify-user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const { id } = req.query
    const { soldTo, soldToUserId } = req.body

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Property ID is required' })
    }

    // First, verify that the property belongs to the current user
    const property = await prisma.property.findFirst({
      where: {
        id: id,
        user: {
          email: session.user.email,
        },
      },
    })

    if (!property) {
      return res
        .status(404)
        .json({ message: 'Property not found or you do not have permission to modify it' })
    }

    // Update the property status to SOLD
    const updatedProperty = await prisma.property.update({
      where: {
        id: id,
      },
      data: {
        listingStatus: 'SOLD',
        soldTo: soldTo || 'External Buyer',
        soldToUserId: soldToUserId || null,
        soldDate: new Date(),
      },
    })

    res.status(200).json({
      message: 'Property marked as sold successfully',
      property: updatedProperty,
    })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
