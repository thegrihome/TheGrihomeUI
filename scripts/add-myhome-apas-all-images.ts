import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Base URL for Vercel Blob storage (updated to correct path)
const BASE_URL =
  'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/hyderabad-projects/myhome-apas'

async function main() {
  try {
    console.log('Adding all images to My Home APAS project...')

    // Find the project
    const project = await prisma.project.findFirst({
      where: {
        name: 'My Home APAS',
      },
    })

    if (!project) {
      console.error('❌ Project not found!')
      return
    }

    console.log('Found project:', project.name)

    // Update the builder logo
    const builder = await prisma.builder.findFirst({
      where: { name: 'My Home Constructions' },
    })

    if (builder) {
      await prisma.builder.update({
        where: { id: builder.id },
        data: {
          logoUrl: `${BASE_URL}/builder-logo.webp`,
        },
      })
      console.log('✅ Updated builder logo')
    }

    // Get current project details
    const currentDetails = (project.projectDetails as any) || {}

    // Clubhouse images (c1.png, c2.png)
    const clubhouseImages = [
      {
        url: `${BASE_URL}/clubhouse/c1.png`,
        name: 'Clubhouse 1 - Cotta',
      },
      {
        url: `${BASE_URL}/clubhouse/c2.png`,
        name: 'Clubhouse 2 - Terra',
      },
    ]

    // Floorplans (1.webp to 13.webp)
    const floorPlans = []
    for (let i = 1; i <= 13; i++) {
      floorPlans.push({
        image: `${BASE_URL}/floorplans/${i}.webp`,
        name: `Floor Plan ${i}`,
      })
    }

    // Gallery (g1.webp to g6.webp)
    const gallery = []
    for (let i = 1; i <= 6; i++) {
      gallery.push({
        image: `${BASE_URL}/gallery/g${i}.webp`,
        name: `Gallery Image ${i}`,
      })
    }

    // Update the project with all images
    await prisma.project.update({
      where: { id: project.id },
      data: {
        thumbnailUrl: `${BASE_URL}/banner.png`,
        googlePin:
          'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15228.717134506809!2d78.3286962!3d17.4031817!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9514a6cf3c95%3A0x40985155a2395027!2sMy%20Home%20APAS!5e0!3m2!1sen!2sin!4v1692941911814!5m2!1sen!2sin',
        projectDetails: {
          ...currentDetails,
          logo: `${BASE_URL}/myhome-apas-logo.png`,
          clubhouseImages,
          floorPlans,
          gallery,
          assets: {
            ...currentDetails.assets,
            layout: {
              url: `${BASE_URL}/layout.webp`,
              title: 'My Home APAS Site Layout',
            },
            videos: [
              {
                url: `${BASE_URL}/video.mp4`,
                poster: `${BASE_URL}/banner.png`,
              },
            ],
          },
        },
      },
    })

    console.log('✅ Successfully updated My Home APAS project with all images!')
    console.log('- Updated banner image')
    console.log('- Updated Google Maps embed')
    console.log('- Updated project logo')
    console.log(`- Added ${clubhouseImages.length} clubhouse images`)
    console.log(`- Added ${floorPlans.length} floor plans`)
    console.log(`- Added ${gallery.length} gallery images`)
    console.log('- Updated layout image')
    console.log('- Updated video with poster')
  } catch (error) {
    console.error('❌ Error updating project:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    console.log('You can now view the project with all images!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
