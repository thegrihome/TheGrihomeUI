// Run this script with: npx ts-node scripts/update-builder-addresses.ts
// Or: npx tsx scripts/update-builder-addresses.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateBuilderAddresses() {
  try {
    // Update Aparna builder
    const aparna = await prisma.builder.updateMany({
      where: {
        name: {
          contains: 'Aparna',
          mode: 'insensitive',
        },
      },
      data: {
        builderDetails: {
          address:
            'Head Office - #802 Door no: 6-3-352/2&3, Astral Heights, Road No.1, Banjara Hills, Hyderabad - 500034',
          phone: '040-23352708',
        },
      },
    })
    console.log(`Updated Aparna builder: ${aparna.count} record(s)`)

    // Update MyHome builder
    const myhome = await prisma.builder.updateMany({
      where: {
        name: {
          contains: 'MyHome',
          mode: 'insensitive',
        },
      },
      data: {
        builderDetails: {
          address:
            'H NO 1-123, 8TH FLOOR, 3RD BLOCK, MY HOME HUB, HITECH CITY, MADHAPUR, HYDERABAD - 500 081.',
          phones: ['+91 91549 81692', '+91 91549 81691'],
          email: 'mktg@myhomeconstructions.com',
        },
      },
    })
    console.log(`Updated MyHome builder: ${myhome.count} record(s)`)

    console.log('Done!')
  } catch (error) {
    console.error('Error updating builders:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateBuilderAddresses()
