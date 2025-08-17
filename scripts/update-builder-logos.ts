import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const builderUpdates = [
  {
    name: 'My Home Group',
    logoUrl:
      'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/builder-logos/myhome-constructions.jpeg',
    contactInfoUpdate: {
      mapLink: 'https://maps.app.goo.gl/cb39H7rNT9LvGKSw7',
    },
  },
  {
    name: 'DSR Builders',
    logoUrl:
      'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/builder-logos/dsr-builders.jpeg',
  },
  {
    name: 'Sri Sreenivasa Infra',
    logoUrl:
      'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/builder-logos/sri%20sreenivasa-constructions.png',
  },
]

async function updateBuilderLogos() {
  console.log('🔄 Starting builder logo and map link updates...')

  try {
    for (const update of builderUpdates) {
      // Find the builder
      const builder = await prisma.builder.findFirst({
        where: { name: update.name },
      })

      if (!builder) {
        console.log(`⚠️  Builder '${update.name}' not found, skipping...`)
        continue
      }

      // Prepare update data
      const updateData: any = {
        logoUrl: update.logoUrl,
      }

      // If there's a contact info update (like map link for My Home Group)
      if (update.contactInfoUpdate) {
        const currentContactInfo = builder.contactInfo as any

        // Add map link to the first address for My Home Group
        if (update.name === 'My Home Group' && currentContactInfo?.addresses?.[0]) {
          currentContactInfo.addresses[0].mapLink = update.contactInfoUpdate.mapLink
          updateData.contactInfo = currentContactInfo
        }
      }

      // Update the builder
      const updatedBuilder = await prisma.builder.update({
        where: { id: builder.id },
        data: updateData,
      })

      console.log(`✅ Updated ${updatedBuilder.name}:`)
      console.log(`   - Logo URL: ${updatedBuilder.logoUrl}`)
      if (update.contactInfoUpdate) {
        console.log(`   - Added map link to contact info`)
      }
    }

    console.log('🎉 Builder updates completed successfully!')
  } catch (error) {
    console.error('❌ Error updating builders:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update function
updateBuilderLogos().catch(error => {
  console.error(error)
  process.exit(1)
})
