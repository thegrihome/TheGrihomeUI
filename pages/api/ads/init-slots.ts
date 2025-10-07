import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check if slots already exist
    const existingSlots = await prisma.adSlotConfig.count()

    if (existingSlots > 0) {
      return res.status(200).json({ message: 'Ad slots already initialized' })
    }

    // Create 6 ad slots with row-based pricing
    // Row 1 (slots 1-3): ₹1000/day
    // Row 2 (slots 4-6): ₹900/day
    const slots = []
    for (let i = 1; i <= 6; i++) {
      let basePrice
      if (i <= 3) {
        basePrice = 1000 // Row 1: slots 1-3
      } else {
        basePrice = 900 // Row 2: slots 4-6
      }

      slots.push({
        slotNumber: i,
        basePrice: basePrice,
        isActive: true,
      })
    }

    await prisma.adSlotConfig.createMany({
      data: slots,
    })

    res.status(201).json({
      message: 'Ad slots initialized successfully',
      totalSlots: 6,
    })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
