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

    if (!session?.user?.email || !session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const {
      slotNumber,
      propertyId,
      projectId,
      totalDays,
      paymentMethod,
      isRenewal,
      renewalAdId,
      totalAmount: clientTotalAmount,
      discountApplied,
    } = req.body

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

    // Calculate discount based on duration (same logic as frontend)
    const getDiscount = (days: number): number => {
      // Check if pre-launch offer is active (till December 31, 2025)
      const today = new Date()
      const offerEndDate = new Date('2025-12-31T23:59:59')
      if (today <= offerEndDate) {
        return 1.0 // 100% discount during pre-launch
      }
      if (days >= 15) return 0.3
      if (days >= 7) return 0.2
      if (days >= 3) return 0.1
      if (days > 0) return 0.05
      return 0
    }

    const days = parseInt(totalDays)
    const baseAmount = slotConfig.basePrice * days
    const discountPercent = getDiscount(days)
    const discount = baseAmount * discountPercent
    const totalAmount = baseAmount - discount

    // Verify the client-sent amount matches our calculation (security check)
    if (clientTotalAmount !== undefined && Math.abs(clientTotalAmount - totalAmount) > 0.01) {
      return res.status(400).json({
        message: 'Payment amount mismatch. Please refresh and try again.',
      })
    }

    // If this is a renewal, expire the old ad
    if (isRenewal && renewalAdId) {
      await prisma.ad.update({
        where: { id: renewalAdId },
        data: { status: 'EXPIRED' },
      })
    }

    // Create new ad with accurate payment details
    const ad = await prisma.ad.create({
      data: {
        slotNumber: parseInt(slotNumber),
        userId: user.id,
        propertyId: propertyId || null,
        projectId: projectId || null,
        startDate,
        endDate,
        totalDays: parseInt(totalDays),
        pricePerDay: slotConfig.basePrice, // Original price per day (before discount)
        totalAmount, // Actual amount paid after discount
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
