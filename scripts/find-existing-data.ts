import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findExistingData() {
  console.log('🔍 Finding existing builder and location data...')

  try {
    // Find My Home Group builder
    const myHomeBuilder = await prisma.builder.findFirst({
      where: {
        name: {
          contains: 'My Home',
          mode: 'insensitive',
        },
      },
    })

    if (myHomeBuilder) {
      console.log(`✅ Found My Home Builder:`)
      console.log(`   - ID: ${myHomeBuilder.id}`)
      console.log(`   - Name: ${myHomeBuilder.name}`)
    } else {
      console.log('❌ My Home Group builder not found')
    }

    // Find Hyderabad location
    const hyderabadLocation = await prisma.location.findFirst({
      where: {
        city: {
          contains: 'Hyderabad',
          mode: 'insensitive',
        },
      },
    })

    if (hyderabadLocation) {
      console.log(`✅ Found Hyderabad Location:`)
      console.log(`   - ID: ${hyderabadLocation.id}`)
      console.log(`   - City: ${hyderabadLocation.city}`)
      console.log(`   - State: ${hyderabadLocation.state}`)
      console.log(`   - Country: ${hyderabadLocation.country}`)
    } else {
      console.log('❌ Hyderabad location not found')
      console.log('📝 Available locations:')
      const allLocations = await prisma.location.findMany()
      allLocations.forEach(loc => {
        console.log(`   - ${loc.city}, ${loc.state} (ID: ${loc.id})`)
      })
    }

    // Check if My Home Apas project already exists
    const existingProject = await prisma.project.findFirst({
      where: {
        name: {
          contains: 'My Home Apas',
          mode: 'insensitive',
        },
      },
    })

    if (existingProject) {
      console.log(`⚠️  Project 'My Home Apas' already exists (ID: ${existingProject.id})`)
    } else {
      console.log('✅ No existing "My Home Apas" project found - safe to create')
    }

    return {
      builderId: myHomeBuilder?.id,
      locationId: hyderabadLocation?.id,
      projectExists: !!existingProject,
    }
  } catch (error) {
    console.error('❌ Error finding existing data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
findExistingData()
  .then(result => {
    console.log('\n📊 Summary:')
    console.log(`Builder ID: ${result.builderId || 'NOT FOUND'}`)
    console.log(`Location ID: ${result.locationId || 'NOT FOUND'}`)
    console.log(`Project exists: ${result.projectExists}`)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
