import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Updating My Home APAS project description...')

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

    // Get current project details
    const currentDetails = (project.projectDetails as any) || {}

    // New description with proper formatting
    const newDescription = `Taking inspiration from the revitalising power of water, My Home Apas aims to strike a symmetry in living well - for oneself, and the environment around them. A sustainable, comfortable and healthy way of living. A home that doesn't just welcome you, but refreshes you, like cool water on a hot summer's day.

An oasis of tranquillity in the hustle-bustle of modern life, My Home Apas is a community overlooking the calming vistas of lakes Kokapet and Osman Sagar. Nestled in the charming neighborhood of Kokapet, My Home Apas is a residential haven that promises an exceptional living experience. Serene and thoughtfully designed, Kokapet offers easy connectivity to the vibrant hubs of Hyderabad, including the bustling Wipro Junction and Gachibowli, through its well-connected wide roads. Moreover, the Outer Ring Road (ORR) facilitates a convenient route to the airport. If you seek a prestigious address that places you at the heart of luxury, with access to top-tier shopping malls, upscale restaurants, renowned educational institutions, and global corporate offices, then My Home Apas in Kokapet is the ideal destination to embrace the elevated lifestyle you desire.`

    // Update clubhouse data with bold formatting
    const clubhouseData = {
      description:
        'The clubhouse at My Home APAS offers a world-class amenity experience spread across two magnificent buildings - Cotta and Terra.',
      images: [
        {
          url: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/hyderabad-projects/myhome-apas/clubhouse/c1.png',
          name: 'CLUBHOUSE 1 - COTTA',
          details: '58,000 SFT, G+4 FLOORS',
        },
        {
          url: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/hyderabad-projects/myhome-apas/clubhouse/c2.png',
          name: 'CLUBHOUSE 2 - TERRA',
          details: '14,000 SFT, G+1 FLOORS',
        },
      ],
    }

    // Update the project
    await prisma.project.update({
      where: { id: project.id },
      data: {
        description: newDescription,
        projectDetails: {
          ...currentDetails,
          reraNumber: 'P02400006812',
          clubhouse: clubhouseData,
        },
      },
    })

    console.log('✅ Successfully updated My Home APAS project description!')
    console.log('- Updated description with 2 paragraphs')
    console.log('- Added RERA number as separate field')
    console.log('- Updated clubhouse data with bold text and combined sections')
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
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
