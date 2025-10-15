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

    // Get all properties for this project
    const properties = await prisma.property.findMany({
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
          },
        },
        projectProperties: {
          where: {
            projectId,
          },
        },
      },
      orderBy: {
        postedDate: 'desc',
      },
    })

    // Check for expired promotions and update them
    const now = new Date()
    for (const property of properties) {
      if (property.projectProperties.length > 0) {
        const projectProperty = property.projectProperties[0]
        if (
          projectProperty.isPromoted &&
          projectProperty.promotionEndDate &&
          projectProperty.promotionEndDate < now
        ) {
          await prisma.projectProperty.update({
            where: { id: projectProperty.id },
            data: {
              isPromoted: false,
              promotionStartDate: null,
              promotionEndDate: null,
            },
          })
          projectProperty.isPromoted = false
        }
      }
    }

    // Format response
    const formattedProperties = properties.map(property => {
      const projectProperty = property.projectProperties[0]
      const isFeatured =
        projectProperty?.isPromoted &&
        projectProperty.promotionEndDate &&
        projectProperty.promotionEndDate > now

      return {
        id: property.id,
        streetAddress: property.streetAddress,
        propertyType: property.propertyType,
        sqFt: property.sqFt,
        thumbnailUrl: property.thumbnailUrl,
        thumbnailIndex: property.thumbnailIndex,
        imageUrls: property.imageUrls,
        propertyDetails: property.propertyDetails,
        postedDate: property.postedDate,
        location: property.location,
        agent: property.user,
        isFeatured,
        promotionEndDate: projectProperty?.promotionEndDate || null,
        projectPropertyId: projectProperty?.id || null,
      }
    })

    // Separate featured (top 5) and regular properties
    const featuredProperties = formattedProperties.filter(p => p.isFeatured).slice(0, 5)
    const regularProperties = formattedProperties.filter(p => !p.isFeatured)

    return res.status(200).json({
      featuredProperties,
      regularProperties,
      totalProperties: formattedProperties.length,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
