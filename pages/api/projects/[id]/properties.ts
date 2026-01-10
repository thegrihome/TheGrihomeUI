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

    // Get ALL properties that have projectId set to this project (auto-display)
    const allProjectProperties = await prisma.property.findMany({
      where: {
        projectId,
        listingStatus: 'ACTIVE',
      },
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
      orderBy: {
        postedDate: 'desc',
      },
    })

    // Get actively promoted properties via ProjectProperty
    const promotedProjectProperties = await prisma.projectProperty.findMany({
      where: {
        projectId,
        isPromoted: true,
        promotionEndDate: {
          gt: now,
        },
      },
      select: {
        propertyId: true,
        promotionEndDate: true,
        id: true,
      },
    })

    // Create a map of promoted property IDs for quick lookup
    const promotedMap = new Map(
      promotedProjectProperties.map(pp => [
        pp.propertyId,
        { promotionEndDate: pp.promotionEndDate, projectPropertyId: pp.id },
      ])
    )

    // Format all properties with promotion info
    const formattedProperties = allProjectProperties.map(property => {
      const promotionInfo = promotedMap.get(property.id)
      return {
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
        isFeatured: !!promotionInfo,
        promotionEndDate: promotionInfo?.promotionEndDate || null,
        projectPropertyId: promotionInfo?.projectPropertyId || null,
      }
    })

    // Separate featured (promoted) from regular properties
    const featuredProperties = formattedProperties.filter(p => p.isFeatured).slice(0, 5)
    const regularProperties = formattedProperties.filter(p => !p.isFeatured)

    return res.status(200).json({
      featuredProperties,
      regularProperties,
      allProperties: formattedProperties,
      totalProperties: formattedProperties.length,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
