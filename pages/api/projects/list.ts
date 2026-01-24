import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { ProjectType } from '@prisma/client'

interface QueryParams {
  propertyType?: string
  projectType?: string
  location?: string
  page?: string
  limit?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      propertyType,
      projectType,
      location,
      page = '1',
      limit = '12',
    } = req.query as QueryParams

    // Validate and cap pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12))
    const skip = (pageNum - 1) * limitNum

    // Build where clause - always exclude archived projects
    const where: any = {
      isArchived: false,
    }

    // Property type filter (VILLA, APARTMENT, etc.)
    if (propertyType) {
      where.propertyType = propertyType
    }

    // Project type filter (RESIDENTIAL, COMMERCIAL, etc.)
    if (projectType) {
      where.type = projectType as ProjectType
    }

    // Location filter - search in searchText OR name (same as properties)
    // Split location into words and require ALL words to be present (AND logic)
    if (location) {
      const words = location
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 0)

      // Each word must be present in searchText OR name
      if (words.length > 0) {
        where.AND = [
          ...(where.AND || []),
          ...words.map(word => ({
            OR: [
              {
                searchText: {
                  contains: word,
                  mode: 'insensitive' as const,
                },
              },
              {
                name: {
                  contains: word,
                  mode: 'insensitive' as const,
                },
              },
            ],
          })),
        ]
      }
    }

    // Run count and findMany in parallel for better performance
    const [totalCount, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          location: {
            select: {
              city: true,
              state: true,
              zipcode: true,
              locality: true,
            },
          },
          builder: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      }),
    ])

    // Transform projects for frontend
    const transformedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      propertyType: project.propertyType,
      thumbnailUrl: project.thumbnailUrl || project.imageUrls?.[0],
      imageUrls: project.imageUrls,
      location: {
        city: project.location.city,
        state: project.location.state,
        zipcode: project.location.zipcode,
        locality: project.location.locality,
        fullAddress: `${project.location.locality ? project.location.locality + ', ' : ''}${project.location.city}, ${project.location.state}${project.location.zipcode ? ' - ' + project.location.zipcode : ''}`,
      },
      builder: project.builder
        ? {
            id: project.builder.id,
            name: project.builder.name,
            logoUrl: project.builder.logoUrl,
          }
        : null,
      createdAt: project.createdAt,
    }))

    res.status(200).json({
      projects: transformedProjects,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1,
      },
    })
  } catch (error) {
    // Error handled by API response
    res.status(500).json({ message: 'Internal server error' })
  }
}
