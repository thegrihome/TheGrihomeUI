import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

/**
 * Public API endpoint to initialize forum cities (one-time setup)
 * This can be called without authentication for initial database setup
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Find or create General Discussions category
    let generalDiscussions = await prisma.forumCategory.findUnique({
      where: { slug: 'general-discussions' },
    })

    if (!generalDiscussions) {
      generalDiscussions = await prisma.forumCategory.create({
        data: {
          name: 'General Discussions',
          slug: 'general-discussions',
          description: 'Discuss real estate topics across Indian cities',
          displayOrder: 3,
          isActive: true,
        },
      })
    }

    // Check existing cities
    const existingCities = await prisma.forumCategory.findMany({
      where: {
        parentId: generalDiscussions.id,
      },
      select: {
        city: true,
      },
    })

    const existingCitySlugs = existingCities.map(c => c.city).filter(Boolean)

    // Define new cities to add (only add if they don't exist)
    const newCities = [
      {
        name: 'Gurgaon',
        slug: 'gurgaon',
        city: 'gurgaon',
        description: 'Gurgaon Real Estate Discussions',
        displayOrder: 6,
      },
      {
        name: 'Noida',
        slug: 'noida',
        city: 'noida',
        description: 'Noida Real Estate Discussions',
        displayOrder: 7,
      },
      {
        name: 'Pune',
        slug: 'pune',
        city: 'pune',
        description: 'Pune Real Estate Discussions',
        displayOrder: 8,
      },
      {
        name: 'Other Cities',
        slug: 'other-cities',
        city: 'other-cities',
        description: 'Real Estate Discussions in cities, towns and villages across India ❤️',
        displayOrder: 9,
      },
    ].filter(city => !existingCitySlugs.includes(city.city))

    if (newCities.length === 0) {
      return res.status(200).json({
        message: 'All cities already exist',
        citiesAdded: 0,
      })
    }

    // Define property types for each city
    const propertyTypes = [
      {
        name: 'Villas',
        slug: 'villas',
        type: 'VILLAS',
        displayOrder: 0,
      },
      {
        name: 'Apartments',
        slug: 'apartments',
        type: 'APARTMENTS',
        displayOrder: 1,
      },
      {
        name: 'Residential Lands',
        slug: 'residential-lands',
        type: 'RESIDENTIAL_LANDS',
        displayOrder: 2,
      },
      {
        name: 'Agriculture Lands',
        slug: 'agriculture-lands',
        type: 'AGRICULTURE_LANDS',
        displayOrder: 3,
      },
      {
        name: 'Commercial Properties',
        slug: 'commercial-properties',
        type: 'COMMERCIAL_PROPERTIES',
        displayOrder: 4,
      },
    ]

    const createdCities = []

    // Create each city category with its property type subcategories
    for (const cityData of newCities) {
      // Create city category
      const cityCategory = await prisma.forumCategory.create({
        data: {
          name: cityData.name,
          slug: cityData.slug,
          city: cityData.city,
          description: cityData.description,
          parentId: generalDiscussions.id,
          displayOrder: cityData.displayOrder,
          isActive: true,
        },
      })

      // Create property type subcategories for this city
      const propertyTypeCategories = []
      for (const propType of propertyTypes) {
        const propertyTypeCategory = await prisma.forumCategory.create({
          data: {
            name: `${propType.name} in ${cityData.name}`,
            slug: `${cityData.city}-${propType.slug}`,
            city: cityData.city,
            propertyType: propType.type as any,
            description: `Discuss ${propType.name.toLowerCase()} in ${cityData.name}`,
            parentId: cityCategory.id,
            displayOrder: propType.displayOrder,
            isActive: true,
          },
        })
        propertyTypeCategories.push(propertyTypeCategory)
      }

      createdCities.push({
        city: cityCategory,
        propertyTypes: propertyTypeCategories,
      })
    }

    return res.status(200).json({
      message: `Successfully initialized ${createdCities.length} new cities`,
      citiesAdded: createdCities.length,
      cities: createdCities.map(c => c.city.name),
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing forum cities:', error)
    return res.status(500).json({ message: 'Internal server error', error: String(error) })
  }
}
