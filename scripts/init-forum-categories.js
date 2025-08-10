// Database initialization script for forum categories
// Run this after running prisma db push/migrate

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const cities = [
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Bengaluru', slug: 'bengaluru' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Kolkata', slug: 'kolkata' },
]

const propertyTypes = [
  { name: 'Villas', slug: 'villas', type: 'VILLAS' },
  { name: 'Apartments', slug: 'apartments', type: 'APARTMENTS' },
  { name: 'Residential Lands', slug: 'residential-lands', type: 'RESIDENTIAL_LANDS' },
  { name: 'Agriculture Lands', slug: 'agriculture-lands', type: 'AGRICULTURE_LANDS' },
  { name: 'Commercial Properties', slug: 'commercial-properties', type: 'COMMERCIAL_PROPERTIES' },
]

async function initializeForumCategories() {
  try {
    console.log('Starting forum categories initialization...')

    // Create main categories
    const memberIntroductions = await prisma.forumCategory.upsert({
      where: { slug: 'member-introductions' },
      update: {},
      create: {
        name: 'Member Introductions',
        slug: 'member-introductions',
        description: 'Introduce yourself to the Grihome community',
        displayOrder: 1,
      },
    })

    const generalDiscussions = await prisma.forumCategory.upsert({
      where: { slug: 'general-discussions' },
      update: {},
      create: {
        name: 'General Discussions',
        slug: 'general-discussions',
        description: 'General real estate discussions and city-specific topics',
        displayOrder: 2,
      },
    })

    const latestNews = await prisma.forumCategory.upsert({
      where: { slug: 'latest-news' },
      update: {},
      create: {
        name: 'Latest News',
        slug: 'latest-news',
        description: 'Real estate news and market updates',
        displayOrder: 3,
      },
    })

    const grihomeDeals = await prisma.forumCategory.upsert({
      where: { slug: 'grihome-latest-deals' },
      update: {},
      create: {
        name: 'Grihome Latest Deals',
        slug: 'grihome-latest-deals',
        description: 'Exclusive deals and offers from Grihome',
        displayOrder: 4,
      },
    })

    console.log('Main categories created/updated')

    // Create city subcategories under General Discussions
    let cityOrder = 1
    for (const city of cities) {
      const cityCategory = await prisma.forumCategory.upsert({
        where: { slug: `general-discussions-${city.slug}` },
        update: {},
        create: {
          name: city.name,
          slug: `general-discussions-${city.slug}`,
          description: `Real estate discussions specific to ${city.name}`,
          parentId: generalDiscussions.id,
          city: city.slug,
          displayOrder: cityOrder++,
        },
      })

      console.log(`City category created/updated: ${city.name}`)

      // Create property type subcategories under each city
      let propertyOrder = 1
      for (const propertyType of propertyTypes) {
        await prisma.forumCategory.upsert({
          where: { slug: `${city.slug}-${propertyType.slug}` },
          update: {},
          create: {
            name: `${propertyType.name} in ${city.name}`,
            slug: `${city.slug}-${propertyType.slug}`,
            description: `${propertyType.name} discussions in ${city.name}`,
            parentId: cityCategory.id,
            city: city.slug,
            propertyType: propertyType.type,
            displayOrder: propertyOrder++,
          },
        })
      }

      console.log(`Property type subcategories created for ${city.name}`)
    }

    console.log('Forum categories initialization completed successfully!')

    // Show the structure
    const allCategories = await prisma.forumCategory.findMany({
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      where: { parentId: null },
      orderBy: { displayOrder: 'asc' },
    })

    console.log('\nForum structure:')
    allCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`)
      category.children.forEach(child => {
        console.log(`  - ${child.name} (${child.slug})`)
        child.children.forEach(grandchild => {
          console.log(`    - ${grandchild.name} (${grandchild.slug})`)
        })
      })
    })
  } catch (error) {
    console.error('Error initializing forum categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initializeForumCategories()
