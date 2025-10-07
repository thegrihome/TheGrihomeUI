import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating ad slot pricing to row-based model...')

  // Delete slots beyond 6
  const deletedSlots = await prisma.adSlotConfig.deleteMany({
    where: {
      slotNumber: {
        gt: 6,
      },
    },
  })
  console.log(`Deleted ${deletedSlots.count} slots (slots 7-21)`)

  // Update pricing for remaining slots
  // Row 1 (slots 1-3): ₹1000/day
  await prisma.adSlotConfig.updateMany({
    where: {
      slotNumber: {
        in: [1, 2, 3],
      },
    },
    data: {
      basePrice: 1000,
    },
  })
  console.log('Updated slots 1-3 to ₹1000/day')

  // Row 2 (slots 4-6): ₹900/day
  await prisma.adSlotConfig.updateMany({
    where: {
      slotNumber: {
        in: [4, 5, 6],
      },
    },
    data: {
      basePrice: 900,
    },
  })
  console.log('Updated slots 4-6 to ₹900/day')

  // Verify the updates
  const slots = await prisma.adSlotConfig.findMany({
    orderBy: {
      slotNumber: 'asc',
    },
  })

  console.log('\nFinal pricing structure:')
  slots.forEach(slot => {
    console.log(`Slot ${slot.slotNumber}: ₹${slot.basePrice}/day`)
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
