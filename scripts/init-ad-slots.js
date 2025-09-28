const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initializeAdSlots() {
  try {
    console.log('Initializing ad slots...')

    // Check if slots already exist
    const existingSlots = await prisma.adSlotConfig.count()

    if (existingSlots > 0) {
      console.log('Ad slots already initialized')
      return
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

    console.log('✅ Successfully initialized 21 ad slots')
    console.log('Slot pricing:')
    console.log('- Slot 1: ₹1500/day')
    console.log('- Slot 2: ₹1450/day')
    console.log('- ...')
    console.log('- Slot 20: ₹550/day')
    console.log('- Slot 21: ₹500/day')
  } catch (error) {
    console.error('Error initializing ad slots:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initializeAdSlots()
