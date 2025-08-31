import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { projectData } = req.body

    if (!projectData) {
      return res.status(400).json({ message: 'Project data is required' })
    }

    // Extract basic project info from projectData
    const {
      name,
      description,
      type,
      numberOfUnits,
      size,
      thumbnailUrl,
      location,
      builderId,
      overview,
      ...projectDetails
    } = projectData

    // Use overview data if direct fields aren't available
    const projectName = name || 'Untitled Project'
    const projectDescription = description || overview?.description || 'No description provided'
    const projectLocation = location || overview?.location || 'Unknown Location'

    // Find or create location
    let locationRecord
    if (typeof projectLocation === 'string') {
      // Parse location string (e.g., "Kokapet, Hyderabad, Telangana")
      const locationParts = projectLocation.split(',').map(part => part.trim())
      const city = locationParts[1] || locationParts[0] || 'Unknown'
      const state = locationParts[2] || 'Unknown'
      const locality = locationParts.length > 2 ? locationParts[0] : null

      locationRecord = await prisma.location.findFirst({
        where: {
          city,
          state,
        },
      })

      if (!locationRecord) {
        locationRecord = await prisma.location.create({
          data: {
            city,
            state,
            country: 'India',
            locality,
          },
        })
      }
    } else if (projectLocation?.id) {
      // If location has an ID, use it
      locationRecord = await prisma.location.findUnique({
        where: { id: projectLocation.id },
      })
    } else if (typeof projectLocation === 'object') {
      // Create new location from provided data
      locationRecord = await prisma.location.create({
        data: {
          city: projectLocation.city || 'Unknown',
          state: projectLocation.state || 'Unknown',
          country: projectLocation.country || 'India',
          locality: projectLocation.locality || null,
        },
      })
    } else {
      // Fallback: create default location
      locationRecord = await prisma.location.create({
        data: {
          city: 'Unknown',
          state: 'Unknown',
          country: 'India',
        },
      })
    }

    if (!locationRecord) {
      return res.status(400).json({ message: 'Invalid location data' })
    }

    // Find or default builder
    let builderRecord
    if (builderId) {
      builderRecord = await prisma.builder.findUnique({
        where: { id: builderId },
      })
    }

    if (!builderRecord) {
      // Default to first builder or create a default one
      builderRecord = await prisma.builder.findFirst()

      if (!builderRecord) {
        builderRecord = await prisma.builder.create({
          data: {
            name: 'Unknown Builder',
            description: 'Builder information not provided',
          },
        })
      }
    }

    // Create the project
    const newProject = await prisma.project.create({
      data: {
        name: projectName,
        description: projectDescription,
        type: (type as any) || 'RESIDENTIAL',
        numberOfUnits: numberOfUnits || null,
        size: size || null,
        thumbnailUrl: thumbnailUrl || null,
        locationId: locationRecord.id,
        builderId: builderRecord.id,
        projectDetails: {
          ...projectDetails,
          overview,
          name: projectName,
          description: projectDescription,
          location: projectLocation,
          builderId,
        },
      },
      include: {
        location: true,
        builder: true,
      },
    })

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  } finally {
    await prisma.$disconnect()
  }
}
