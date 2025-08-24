import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateApasImages() {
  console.log('🖼️  Updating My Home Apas images...')

  try {
    const updatedProject = await prisma.project.updateMany({
      where: {
        name: {
          contains: 'My Home Apas',
          mode: 'insensitive',
        },
      },
      data: {
        thumbnailUrl:
          'https://www.myhomeconstructions.com/my-home-apas/assets-avali/my-home-apas-mobile.webp',
        imageUrls: [],
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
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        imageUrls: true,
      },
    })

    if (project) {
      console.log('📋 Updated project images:')
      console.log(`   - Name: ${project.name}`)
      console.log(`   - Thumbnail: ${project.thumbnailUrl}`)
      console.log(`   - Image URLs count: ${project.imageUrls.length}`)
      console.log(`   - Project URL: localhost:3000/projects/${project.id}`)
    }

    console.log('🎉 My Home Apas images update completed!')
  } catch (error) {
    console.error('❌ Error updating images:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateApasImages().catch(error => {
  console.error(error)
  process.exit(1)
})
