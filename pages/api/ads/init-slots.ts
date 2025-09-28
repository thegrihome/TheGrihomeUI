import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

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

    // Create 21 ad slots with pricing: slot 21 = 500, slot 20 = 550, ..., slot 1 = 1500
    const slots = []
    for (let i = 1; i <= 21; i++) {
      const basePrice = 500 + (21 - i) * 50 // slot 21 = 500, slot 1 = 1500
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
      totalSlots: 21,
    })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
