import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id: projectId } = req.query
    const { propertyId, duration = 30 } = req.body

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' })
    }

    // Validate duration
    const days = parseInt(String(duration))
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ message: 'Duration must be between 1 and 365 days' })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify user owns the property and it's part of the project
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        projectId,
        userId: user.id,
        listingStatus: 'ACTIVE',
      },
    })

    if (!property) {
      return res
        .status(403)
        .json({ message: 'Property not found or you do not have permission to promote it' })
    }

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + days)

    // Payment amount is 0 for now
    const totalAmount = 0

    // Check if ProjectProperty record exists
    const existingProjectProperty = await prisma.projectProperty.findUnique({
      where: {
        projectId_propertyId: {
          projectId,
          propertyId,
        },
      },
    })

    let projectProperty
    if (existingProjectProperty) {
      // Update existing record
      projectProperty = await prisma.projectProperty.update({
        where: { id: existingProjectProperty.id },
        data: {
          isPromoted: true,
          promotionStartDate: startDate,
          promotionEndDate: endDate,
          promotionPaymentAmount: totalAmount,
        },
      })
    } else {
      // Create new record
      projectProperty = await prisma.projectProperty.create({
        data: {
          projectId,
          propertyId,
          isPromoted: true,
          promotionStartDate: startDate,
          promotionEndDate: endDate,
          promotionPaymentAmount: totalAmount,
        },
      })
    }

    return res.status(200).json({
      message: 'Property promoted successfully',
      promotion: {
        id: projectProperty.id,
        startDate: projectProperty.promotionStartDate,
        endDate: projectProperty.promotionEndDate,
        totalAmount: projectProperty.promotionPaymentAmount,
        totalDays: days,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
