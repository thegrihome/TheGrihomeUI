import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateMyHomeDescription() {
  console.log('🔄 Updating My Home Group description...')

  try {
    const updatedBuilder = await prisma.builder.updateMany({
      where: {
        name: 'My Home Group',
      },
      data: {
        description:
          'Myhome Constructions are a trusted builder in Hyderabad, India, known for on-time completion and superior quality. They have built over 26 million square feet of happy homes and prime commercial properties.',
      },
    })

    console.log(`✅ Updated ${updatedBuilder.count} builder(s)`)

    // Verify the update
    const builder = await prisma.builder.findFirst({
      where: { name: 'My Home Group' },
      select: { id: true, name: true, description: true },
    })

    if (builder) {
      console.log('📋 Current description:')
      console.log(builder.description)
    }

    console.log('🎉 My Home Group description update completed!')
  } catch (error) {
    console.error('❌ Error updating description:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateMyHomeDescription().catch(error => {
  console.error(error)
  process.exit(1)
})
