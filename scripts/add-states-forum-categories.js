// Script to add States and Union Territories to forum categories
// Run this after cities are already set up

// Use the configured prisma client from the project
const { getDatabaseConfig } = require('../lib/cockroachDB/database-config')
const { PrismaClient } = require('@prisma/client')

const config = getDatabaseConfig()
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.url,
    },
  },
})

const statesAndUTs = [
  { name: 'Andhra Pradesh', slug: 'andhra-pradesh' },
  { name: 'Arunachal Pradesh', slug: 'arunachal-pradesh' },
  { name: 'Assam', slug: 'assam' },
  { name: 'Bihar', slug: 'bihar' },
  { name: 'Chhattisgarh', slug: 'chhattisgarh' },
  { name: 'Goa', slug: 'goa' },
  { name: 'Gujarat', slug: 'gujarat' },
  { name: 'Haryana', slug: 'haryana' },
  { name: 'Himachal Pradesh', slug: 'himachal-pradesh' },
  { name: 'Jammu and Kashmir', slug: 'jammu-and-kashmir' },
  { name: 'Jharkhand', slug: 'jharkhand' },
  { name: 'Karnataka', slug: 'karnataka' },
  { name: 'Kerala', slug: 'kerala' },
  { name: 'Madhya Pradesh', slug: 'madhya-pradesh' },
  { name: 'Maharashtra', slug: 'maharashtra' },
  { name: 'Manipur', slug: 'manipur' },
  { name: 'Meghalaya', slug: 'meghalaya' },
  { name: 'Mizoram', slug: 'mizoram' },
  { name: 'Nagaland', slug: 'nagaland' },
  { name: 'Odisha', slug: 'odisha' },
  { name: 'Punjab', slug: 'punjab' },
  { name: 'Rajasthan', slug: 'rajasthan' },
  { name: 'Sikkim', slug: 'sikkim' },
  { name: 'Tamil Nadu', slug: 'tamil-nadu' },
  { name: 'Telangana', slug: 'telangana' },
  { name: 'Tripura', slug: 'tripura' },
  { name: 'Uttarakhand', slug: 'uttarakhand' },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh' },
  { name: 'West Bengal', slug: 'west-bengal' },
  { name: 'Andaman and Nicobar Islands', slug: 'andaman-and-nicobar-islands' },
  { name: 'Chandigarh', slug: 'chandigarh' },
  { name: 'Dadra and Nagar Haveli', slug: 'dadra-and-nagar-haveli' },
  { name: 'Daman and Diu', slug: 'daman-and-diu' },
  { name: 'Lakshadweep', slug: 'lakshadweep' },
  { name: 'Puducherry', slug: 'puducherry' },
]

const propertyTypes = [
  { name: 'Villas', slug: 'villas', type: 'VILLAS' },
  { name: 'Apartments', slug: 'apartments', type: 'APARTMENTS' },
  { name: 'Residential Lands', slug: 'residential-lands', type: 'RESIDENTIAL_LANDS' },
  { name: 'Agriculture Lands', slug: 'agriculture-lands', type: 'AGRICULTURE_LANDS' },
  { name: 'Commercial Properties', slug: 'commercial-properties', type: 'COMMERCIAL_PROPERTIES' },
]

async function addStatesToForumCategories() {
  try {
    console.log('Starting States and Union Territories addition...')

    // Get the General Discussions category
    const generalDiscussions = await prisma.forumCategory.findUnique({
      where: { slug: 'general-discussions' },
    })

    if (!generalDiscussions) {
      console.error('General Discussions category not found. Please run init-forum-categories.js first.')
      return
    }

    console.log('Found General Discussions category')

    // Get the highest displayOrder from existing subcategories
    const existingCategories = await prisma.forumCategory.findMany({
      where: { parentId: generalDiscussions.id },
      orderBy: { displayOrder: 'desc' },
      take: 1,
    })

    let stateOrder = existingCategories.length > 0 ? existingCategories[0].displayOrder + 1 : 100

    // Create state subcategories under General Discussions
    for (const state of statesAndUTs) {
      const stateCategory = await prisma.forumCategory.upsert({
        where: { slug: state.slug },
        update: {
          name: state.name,
          description: `Real estate discussions specific to ${state.name}`,
          parentId: generalDiscussions.id,
          city: null, // States have city field as null
          displayOrder: stateOrder,
          isActive: true,
        },
        create: {
          name: state.name,
          slug: state.slug,
          description: `Real estate discussions specific to ${state.name}`,
          parentId: generalDiscussions.id,
          city: null, // States have city field as null
          displayOrder: stateOrder,
          isActive: true,
        },
      })

      console.log(`State category created/updated: ${state.name}`)
      stateOrder++

      // Create property type subcategories under each state
      let propertyOrder = 1
      for (const propertyType of propertyTypes) {
        const propertySlug = `${state.slug}-${propertyType.slug}`
        await prisma.forumCategory.upsert({
          where: { slug: propertySlug },
          update: {
            name: `${propertyType.name} in ${state.name}`,
            description: `${propertyType.name} discussions in ${state.name}`,
            parentId: stateCategory.id,
            city: null, // Property types under states also have city as null
            propertyType: propertyType.type,
            displayOrder: propertyOrder,
            isActive: true,
          },
          create: {
            name: `${propertyType.name} in ${state.name}`,
            slug: propertySlug,
            description: `${propertyType.name} discussions in ${state.name}`,
            parentId: stateCategory.id,
            city: null, // Property types under states also have city as null
            propertyType: propertyType.type,
            displayOrder: propertyOrder,
            isActive: true,
          },
        })
        propertyOrder++
      }

      console.log(`Property type subcategories created for ${state.name}`)
    }

    console.log('\nStates and Union Territories addition completed successfully!')
    console.log(`Total states/UTs added: ${statesAndUTs.length}`)

    // Show summary
    const allStates = await prisma.forumCategory.findMany({
      where: {
        parentId: generalDiscussions.id,
        city: null,
      },
      include: {
        children: true,
      },
      orderBy: { displayOrder: 'asc' },
    })

    console.log(`\n${allStates.length} States/UTs in database:`)
    allStates.forEach(state => {
      console.log(`- ${state.name} (${state.slug}) - ${state.children.length} property types`)
    })
  } catch (error) {
    console.error('Error adding states to forum categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addStatesToForumCategories()
