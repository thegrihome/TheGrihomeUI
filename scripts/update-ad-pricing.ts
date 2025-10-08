import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating ad slot pricing to row-based model (7 rows)...')

  // Create missing slots if needed (slots 7-21)
  const existingSlots = await prisma.adSlotConfig.findMany()
  const maxSlot = Math.max(...existingSlots.map(s => s.slotNumber))

  if (maxSlot < 21) {
    console.log(`Creating slots ${maxSlot + 1}-21...`)
    const newSlots = []
    for (let i = maxSlot + 1; i <= 21; i++) {
      const row = Math.ceil(i / 3)
      let basePrice
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
      newSlots.push({
        slotNumber: i,
        basePrice: basePrice,
        isActive: true,
      })
    }
    await prisma.adSlotConfig.createMany({
      data: newSlots,
    })
    console.log(`Created ${newSlots.length} new slots`)
  }

  // Update pricing for all slots based on row
  // Row 1 (slots 1-3): ₹1500/day
  await prisma.adSlotConfig.updateMany({
    where: { slotNumber: { in: [1, 2, 3] } },
    data: { basePrice: 1500 },
  })
  console.log('Updated Row 1 (slots 1-3) to ₹1500/day')

  // Row 2 (slots 4-6): ₹1400/day
  await prisma.adSlotConfig.updateMany({
    where: { slotNumber: { in: [4, 5, 6] } },
    data: { basePrice: 1400 },
  })
  console.log('Updated Row 2 (slots 4-6) to ₹1400/day')

  // Row 3 (slots 7-9): ₹1300/day
  await prisma.adSlotConfig.updateMany({
    where: { slotNumber: { in: [7, 8, 9] } },
    data: { basePrice: 1300 },
  })
  console.log('Updated Row 3 (slots 7-9) to ₹1300/day')

  // Row 4 (slots 10-12): ₹1200/day
  await prisma.adSlotConfig.updateMany({
    where: { slotNumber: { in: [10, 11, 12] } },
    data: { basePrice: 1200 },
  })
  console.log('Updated Row 4 (slots 10-12) to ₹1200/day')

  // Row 5 (slots 13-15): ₹1100/day
  await prisma.adSlotConfig.updateMany({
    where: { slotNumber: { in: [13, 14, 15] } },
    data: { basePrice: 1100 },
  })
  console.log('Updated Row 5 (slots 13-15) to ₹1100/day')

  // Row 6 (slots 16-18): ₹1000/day
  await prisma.adSlotConfig.updateMany({
    where: { slotNumber: { in: [16, 17, 18] } },
    data: { basePrice: 1000 },
  })
  console.log('Updated Row 6 (slots 16-18) to ₹1000/day')

  // Row 7 (slots 19-21): ₹900/day
  await prisma.adSlotConfig.updateMany({
    where: { slotNumber: { in: [19, 20, 21] } },
    data: { basePrice: 900 },
  })
  console.log('Updated Row 7 (slots 19-21) to ₹900/day')

  // Verify the updates
  const slots = await prisma.adSlotConfig.findMany({
    orderBy: {
      slotNumber: 'asc',
    },
  })

  console.log('\nFinal pricing structure (7 rows):')
  slots.forEach(slot => {
    const row = Math.ceil(slot.slotNumber / 3)
    console.log(`Row ${row} - Slot ${slot.slotNumber}: ₹${slot.basePrice}/day`)
  })

  console.log('\n✅ Ad slot pricing updated successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('Error updating ad slot pricing:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
