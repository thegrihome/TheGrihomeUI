import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getSession({ req })

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { slotNumber, propertyId, projectId, totalDays, paymentMethod, isRenewal, renewalAdId } =
      req.body

    if (!slotNumber || !totalDays || (!propertyId && !projectId)) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get slot configuration
    const slotConfig = await prisma.adSlotConfig.findUnique({
      where: { slotNumber: parseInt(slotNumber) },
    })

    if (!slotConfig || !slotConfig.isActive) {
      return res.status(404).json({ message: 'Ad slot not found or inactive' })
    }

    // Check if slot is already occupied (unless it's a renewal)
    if (!isRenewal) {
      const existingAd = await prisma.ad.findFirst({
        where: {
          slotNumber: parseInt(slotNumber),
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
          },
        },
      })

      if (existingAd) {
        return res.status(400).json({ message: 'This ad slot is already occupied' })
      }
    }

    // Verify user owns the property/project
    if (propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          userId: user.id,
          listingStatus: 'ACTIVE',
        },
      })

      if (!property) {
        return res.status(403).json({ message: 'Property not found or you do not own it' })
      }
    }

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          builder: {
            contactInfo: {
              path: ['email'],
              equals: session.user.email,
            },
          },
        },
      })

      if (!project) {
        return res.status(403).json({ message: 'Project not found or you do not own it' })
      }
    }

    // Calculate dates and amount
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + parseInt(totalDays))

    const totalAmount = slotConfig.basePrice * parseInt(totalDays)

    // If this is a renewal, expire the old ad
    if (isRenewal && renewalAdId) {
      await prisma.ad.update({
        where: { id: renewalAdId },
        data: { status: 'EXPIRED' },
      })
    }

    // Create new ad
    const ad = await prisma.ad.create({
      data: {
        slotNumber: parseInt(slotNumber),
        userId: user.id,
        propertyId: propertyId || null,
        projectId: projectId || null,
        startDate,
        endDate,
        totalDays: parseInt(totalDays),
        pricePerDay: slotConfig.basePrice,
        totalAmount,
        status: 'ACTIVE',
        paymentStatus: 'COMPLETED', // Demo: Auto-complete payment
        paymentMethod: paymentMethod || 'UPI',
        paymentId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    })

    res.status(201).json({
      message: isRenewal ? 'Ad renewed successfully' : 'Ad purchased successfully',
      ad: {
        id: ad.id,
        slotNumber: ad.slotNumber,
        startDate: ad.startDate,
        endDate: ad.endDate,
        totalAmount: ad.totalAmount,
        paymentId: ad.paymentId,
      },
    })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
