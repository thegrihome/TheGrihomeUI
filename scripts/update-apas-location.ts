import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateApasLocation() {
  console.log('🗺️  Updating My Home Apas location URL...')

  try {
    const updatedProject = await prisma.project.updateMany({
      where: {
        name: {
          contains: 'My Home Apas',
          mode: 'insensitive',
        },
      },
      data: {
        googlePin: 'https://maps.app.goo.gl/V21goB4Hxu3PnhhY7',
      },
    })

    console.log(`✅ Updated ${updatedProject.count} project(s)`)

    // Verify the update
    const project = await prisma.project.findFirst({
      where: {
        name: {
          contains: 'My Home Apas',
          mode: 'insensitive',
        },
      },
      select: { id: true, name: true, googlePin: true },
    })

    if (project) {
      console.log('📋 Updated project:')
      console.log(`   - Name: ${project.name}`)
      console.log(`   - Google Pin: ${project.googlePin}`)
      console.log(`   - Project URL: localhost:3000/projects/${project.id}`)
    }

    console.log('🎉 My Home Apas location update completed!')
  } catch (error) {
    console.error('❌ Error updating location:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateApasLocation().catch(error => {
  console.error(error)
  process.exit(1)
})
