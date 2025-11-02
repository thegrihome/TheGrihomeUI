import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { PropertyType } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const {
      title,
      propertyType,
      bedrooms,
      bathrooms,
      propertySize,
      propertySizeUnit,
      plotSize,
      plotSizeUnit,
      facing,
      description,
      price,
      location,
      imageUrls,
      thumbnailUrl,
      projectId,
    } = req.body

    // Validate required fields
    if (!title || !propertyType || !price || !location?.address) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Find or create location
    let locationRecord = await prisma.location.findFirst({
      where: {
        city: location.city,
        state: location.state,
        country: location.country,
      },
    })

    if (!locationRecord) {
      locationRecord = await prisma.location.create({
        data: {
          city: location.city,
          state: location.state,
          country: location.country,
          zipcode: location.zipcode || '',
        },
      })
    }

    // Prepare property details
    const propertyDetails: any = {
      title,
      description,
      price: parseFloat(price),
      location: location.address,
      locality: location.locality || '',
      facing: facing || null,
    }

    // Add bedrooms/bathrooms if applicable
    if (bedrooms) {
      propertyDetails.bedrooms = parseInt(bedrooms)
    }
    if (bathrooms) {
      propertyDetails.bathrooms = parseInt(bathrooms)
    }

    // Add property size
    if (propertySize) {
      propertyDetails.propertySize = parseFloat(propertySize)
      propertyDetails.propertySizeUnit = propertySizeUnit
    }

    // Add plot size if applicable
    if (plotSize) {
      propertyDetails.plotSize = parseFloat(plotSize)
      propertyDetails.plotSizeUnit = plotSizeUnit
    }

    // Calculate sqFt for search purposes
    let sqFt: number | null = null
    if (propertySize) {
      const size = parseFloat(propertySize)
      if (propertySizeUnit === 'sq_ft') {
        sqFt = size
      } else if (propertySizeUnit === 'sq_m') {
        sqFt = size * 10.764 // Convert sq meters to sq feet
      } else if (propertySizeUnit === 'sq_yd') {
        sqFt = size * 9 // Convert sq yards to sq feet
      }
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        streetAddress: location.address,
        locationId: locationRecord.id,
        userId: session.user.id,
        postedBy: session.user.name || session.user.email || 'Anonymous',
        propertyDetails,
        propertyType: propertyType as PropertyType,
        sqFt,
        thumbnailUrl: thumbnailUrl || null,
        imageUrls: imageUrls || [],
        projectId: projectId && projectId.trim() !== '' ? projectId : null,
      },
    })

    return res.status(201).json({
      message: 'Property created successfully',
      propertyId: property.id,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
