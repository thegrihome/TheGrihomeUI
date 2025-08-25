const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addCities() {
  try {
    console.log('🚀 Adding new cities to database...')

    // Add Pune, Maharashtra, India
    let pune = await prisma.location.findFirst({
      where: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    })

    if (!pune) {
      pune = await prisma.location.create({
        data: { city: 'Pune', state: 'Maharashtra', country: 'India' },
      })
      console.log('➕ Created Pune location')
    } else {
      console.log('✓ Pune already exists')
    }

    // Add Gurgaon, Haryana, India
    let gurgaon = await prisma.location.findFirst({
      where: { city: 'Gurgaon', state: 'Haryana', country: 'India' },
    })

    if (!gurgaon) {
      gurgaon = await prisma.location.create({
        data: { city: 'Gurgaon', state: 'Haryana', country: 'India' },
      })
      console.log('➕ Created Gurgaon location')
    } else {
      console.log('✓ Gurgaon already exists')
    }

    // Add Noida, Uttar Pradesh, India
    let noida = await prisma.location.findFirst({
      where: { city: 'Noida', state: 'Uttar Pradesh', country: 'India' },
    })

    if (!noida) {
      noida = await prisma.location.create({
        data: { city: 'Noida', state: 'Uttar Pradesh', country: 'India' },
      })
      console.log('➕ Created Noida location')
    } else {
      console.log('✓ Noida already exists')
    }

    console.log('✅ Cities process completed:')
    console.log(`   - Pune: ${pune.id}`)
    console.log(`   - Gurgaon: ${gurgaon.id}`)
    console.log(`   - Noida: ${noida.id}`)
  } catch (error) {
    console.error('❌ Error adding cities:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addCities()
  .then(() => console.log('🎉 Script completed successfully!'))
  .catch(console.error)
