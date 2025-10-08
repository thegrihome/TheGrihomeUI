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

    // Create 21 ad slots with row-based pricing (7 rows x 3 slots per row)
    // Row 1 (slots 1-3): ₹1500/day
    // Row 2 (slots 4-6): ₹1400/day
    // Row 3 (slots 7-9): ₹1300/day
    // Row 4 (slots 10-12): ₹1200/day
    // Row 5 (slots 13-15): ₹1100/day
    // Row 6 (slots 16-18): ₹1000/day
    // Row 7 (slots 19-21): ₹900/day
    const slots = []
    for (let i = 1; i <= 21; i++) {
      let basePrice
      const row = Math.ceil(i / 3) // Calculate which row the slot is in

      switch (row) {
        case 1:
          basePrice = 1500
          break
        case 2:
          basePrice = 1400
          break
        case 3:
          basePrice = 1300
          break
        case 4:
          basePrice = 1200
          break
        case 5:
          basePrice = 1100
          break
        case 6:
          basePrice = 1000
          break
        case 7:
          basePrice = 900
          break
        default:
          basePrice = 900
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
      totalSlots: 21,
    })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
