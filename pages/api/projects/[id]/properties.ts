import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id: projectId } = req.query

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const now = new Date()

    // Get only properties that have been explicitly linked via ProjectProperty
    // AND have an active promotion (promotionEndDate > now)
    // Properties with expired promotions will not appear
    const projectProperties = await prisma.projectProperty.findMany({
      where: {
        projectId,
        isPromoted: true,
        promotionEndDate: {
          gt: now,
        },
      },
      include: {
        property: {
          include: {
            location: {
              select: {
                city: true,
                state: true,
                locality: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    })

    // Filter out properties that are not active
    const properties = projectProperties
      .filter(pp => pp.property.listingStatus === 'ACTIVE')
      .map(pp => ({
        ...pp.property,
        projectProperty: pp,
      }))

    // Format response - all properties here are actively promoted
    const formattedProperties = properties.map(property => ({
      id: property.id,
      streetAddress: property.streetAddress,
      propertyType: property.propertyType,
      listingType: property.listingType,
      sqFt: property.sqFt,
      thumbnailUrl: property.thumbnailUrl,
      thumbnailIndex: property.thumbnailIndex,
      imageUrls: property.imageUrls,
      propertyDetails: property.propertyDetails,
      postedDate: property.postedDate,
      location: property.location,
      agent: property.user,
      isFeatured: true, // All properties shown are featured (actively promoted)
      promotionEndDate: property.projectProperty.promotionEndDate,
      projectPropertyId: property.projectProperty.id,
    }))

    // All properties are featured since we only fetch actively promoted ones
    const featuredProperties = formattedProperties.slice(0, 5)
    const regularProperties: typeof formattedProperties = [] // No regular properties anymore

    return res.status(200).json({
      featuredProperties,
      regularProperties,
      totalProperties: formattedProperties.length,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
