import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addCities() {
  try {
    console.log('🚀 Adding new cities to database...')

    // Check if Pune already exists
    let pune = await prisma.location.findFirst({
      where: {
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
      },
    })

    if (!pune) {
      pune = await prisma.location.create({
        data: {
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          zipcode: null,
          locality: null,
        },
      })
    }

    // Check if Gurgaon already exists
    let gurgaon = await prisma.location.findFirst({
      where: {
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
      },
    })

    if (!gurgaon) {
      gurgaon = await prisma.location.create({
        data: {
          city: 'Gurgaon',
          state: 'Haryana',
          country: 'India',
          zipcode: null,
          locality: null,
        },
      })
    }

    // Check if Noida already exists
    let noida = await prisma.location.findFirst({
      where: {
        city: 'Noida',
        state: 'Uttar Pradesh',
        country: 'India',
      },
    })

    if (!noida) {
      noida = await prisma.location.create({
        data: {
          city: 'Noida',
          state: 'Uttar Pradesh',
          country: 'India',
          zipcode: null,
          locality: null,
        },
      })
    }

    console.log('✅ Cities added successfully:')
    console.log(`   - Pune: ${pune.id}`)
    console.log(`   - Gurgaon: ${gurgaon.id}`)
    console.log(`   - Noida: ${noida.id}`)
  } catch (error) {
    console.error('❌ Error adding cities:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addCities()
  .then(() => {
    console.log('🎉 Script completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
