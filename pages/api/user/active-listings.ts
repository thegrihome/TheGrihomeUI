import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getSession({ req })

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Get user's active properties and projects
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        listedProperties: {
          where: {
            listingStatus: 'ACTIVE',
          },
          include: {
            project: true,
            location: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get projects where user is the builder/owner (simplified approach)
    // Note: This is a simplified approach. In production, you might want a proper user-project relationship
    const projects: any[] = []

    // Transform properties
    const activeProperties = user.listedProperties.map(property => {
      const propertyDetails = property.propertyDetails as any
      return {
        id: property.id,
        title: property.project?.name || propertyDetails?.projectName || 'Individual Property',
        type: property.propertyType,
        sqFt: property.sqFt,
        location: {
          locality: property.location.locality,
          city: property.location.city,
          state: property.location.state,
        },
        thumbnail: property.thumbnailUrl || property.imageUrls[0],
        details: propertyDetails,
      }
    })

    // Transform projects
    const activeProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      location: {
        locality: project.location.locality,
        city: project.location.city,
        state: project.location.state,
      },
      thumbnail: project.thumbnailUrl || project.imageUrls[0],
      builder: project.builder.name,
    }))

    res.status(200).json({
      properties: activeProperties,
      projects: activeProjects,
      hasActiveListings: activeProperties.length > 0 || activeProjects.length > 0,
    })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
