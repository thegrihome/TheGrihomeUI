import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/projects/update'
import { prisma } from '@/lib/cockroachDB/prisma'
import { geocodeAddress } from '@/lib/utils/geocoding'
import { uploadProjectImage, uploadMultipleProjectImages } from '@/lib/utils/vercel-blob'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    builder: {
      findUnique: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/utils/geocoding', () => ({
  geocodeAddress: jest.fn(),
}))

jest.mock('@/lib/utils/vercel-blob', () => ({
  uploadProjectImage: jest.fn(),
  uploadMultipleProjectImages: jest.fn(),
}))

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}))

describe('/api/projects/update', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  }

  const mockBuilder = {
    id: 'builder-123',
    name: 'Test Builder',
  }

  const mockLocation = {
    id: 'location-123',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    zipcode: '500001',
    locality: 'Banjara Hills',
    neighborhood: null,
    latitude: 17.4065,
    longitude: 78.4772,
    formattedAddress: 'Banjara Hills, Hyderabad, Telangana 500001',
  }

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    type: 'RESIDENTIAL',
    builderId: 'builder-123',
    locationId: 'location-123',
    postedByUserId: 'user-123',
    bannerImageUrl: 'https://example.com/banner.jpg',
    floorplanImageUrls: [],
    clubhouseImageUrls: [],
    galleryImageUrls: [],
    brochureUrl: null,
    location: mockLocation,
  }

  const mockGeocodeResult = {
    latitude: 17.4065,
    longitude: 78.4772,
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    zipcode: '500001',
    locality: 'Banjara Hills',
    neighborhood: null,
    formattedAddress: 'Banjara Hills, Hyderabad, Telangana 500001',
  }

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'PUT',
      body: {
        projectId: 'project-123',
        name: 'Updated Project',
        description: 'Updated Description',
        builderId: 'builder-123',
        locationAddress: 'Banjara Hills, Hyderabad, Telangana 500001',
      },
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
    ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    ;(prisma.project.update as jest.Mock).mockResolvedValue({
      ...mockProject,
      name: 'Updated Project',
      description: 'Updated Description',
    })
    ;(uploadProjectImage as jest.Mock).mockResolvedValue('https://example.com/new-banner.jpg')
    ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue([
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
    ])
  })

  describe('HTTP Method Validation', () => {
    it('should return 405 for GET requests', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for POST requests', async () => {
      req.method = 'POST'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE requests', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept PUT requests', async () => {
      req.method = 'PUT'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: null })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user has no id', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })
  })

  describe('Required Fields Validation', () => {
    it('should return 400 when projectId is missing', async () => {
      req.body = { ...req.body, projectId: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when name is missing', async () => {
      req.body = { ...req.body, name: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when description is missing', async () => {
      req.body = { ...req.body, description: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when builderId is missing', async () => {
      req.body = { ...req.body, builderId: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when locationAddress is missing', async () => {
      req.body = { ...req.body, locationAddress: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })
  })

  describe('Project Existence Validation', () => {
    it('should return 404 when project not found', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Project not found' })
    })

    it('should fetch project with location included', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        include: { location: true },
      })
    })
  })

  describe('Ownership Validation', () => {
    it('should return 403 when user does not own project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        postedByUserId: 'different-user-id',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'You do not have permission to edit this project',
      })
    })

    it('should allow owner to update', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        postedByUserId: mockSession.user.id,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Builder Validation', () => {
    it('should return 400 when builder does not exist', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid builder ID' })
    })

    it('should verify builder exists', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.builder.findUnique).toHaveBeenCalledWith({
        where: { id: 'builder-123' },
      })
    })
  })

  describe('Location Update', () => {
    it('should not update location when address unchanged', async () => {
      req.body = {
        ...req.body,
        locationAddress: mockLocation.formattedAddress,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(geocodeAddress).not.toHaveBeenCalled()
    })

    it('should geocode location when address changed', async () => {
      req.body = {
        ...req.body,
        locationAddress: 'New Address, Hyderabad',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(geocodeAddress).toHaveBeenCalledWith('New Address, Hyderabad')
    })

    it('should create new location when geocode result is not found', async () => {
      req.body = {
        ...req.body,
        locationAddress: 'New Address',
      }
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: {
          city: mockGeocodeResult.city,
          state: mockGeocodeResult.state,
          country: 'India',
          zipcode: mockGeocodeResult.zipcode,
          locality: mockGeocodeResult.locality,
          neighborhood: mockGeocodeResult.neighborhood,
          latitude: mockGeocodeResult.latitude,
          longitude: mockGeocodeResult.longitude,
          formattedAddress: mockGeocodeResult.formattedAddress,
        },
      })
    })

    it('should reuse existing location with similar coordinates', async () => {
      req.body = {
        ...req.body,
        locationAddress: 'New Address',
      }
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).not.toHaveBeenCalled()
      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            locationId: mockLocation.id,
          }),
        })
      )
    })
  })

  describe('Banner Image Upload', () => {
    it('should upload new banner image when provided', async () => {
      req.body = {
        ...req.body,
        bannerImageBase64:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(uploadProjectImage).toHaveBeenCalledWith({
        projectName: 'Updated Project',
        folder: 'banner',
        base64Image: expect.stringContaining('data:image/png;base64'),
      })
    })

    it('should not upload banner if not a base64 image', async () => {
      req.body = {
        ...req.body,
        bannerImageBase64: 'https://example.com/existing-banner.jpg',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(uploadProjectImage).not.toHaveBeenCalled()
    })

    it('should keep existing banner when new one not provided', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bannerImageUrl: mockProject.bannerImageUrl,
          }),
        })
      )
    })
  })

  describe('Floorplan Images Upload', () => {
    it('should upload new floorplan images', async () => {
      req.body = {
        ...req.body,
        floorplanImagesBase64: ['data:image/png;base64,abc', 'data:image/png;base64,def'],
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Updated Project',
        'floorplans',
        expect.arrayContaining(['data:image/png;base64,abc', 'data:image/png;base64,def'])
      )
    })

    it('should limit floorplan images to 20', async () => {
      const manyImages = Array(25).fill('data:image/png;base64,abc')
      req.body = {
        ...req.body,
        floorplanImagesBase64: manyImages,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      const uploadCall = (uploadMultipleProjectImages as jest.Mock).mock.calls[0]
      expect(uploadCall[2].length).toBe(20)
    })

    it('should append new floorplans to existing ones', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        floorplanImageUrls: ['https://example.com/existing1.jpg'],
      })
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue([
        'https://example.com/new1.jpg',
      ])
      req.body = {
        ...req.body,
        floorplanImagesBase64: ['data:image/png;base64,abc'],
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            floorplanImageUrls: expect.arrayContaining([
              'https://example.com/existing1.jpg',
              'https://example.com/new1.jpg',
            ]),
          }),
        })
      )
    })

    it('should filter out non-base64 images from upload', async () => {
      req.body = {
        ...req.body,
        floorplanImagesBase64: [
          'data:image/png;base64,abc',
          'https://example.com/existing.jpg',
          'data:image/png;base64,def',
        ],
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      const uploadCall = (uploadMultipleProjectImages as jest.Mock).mock.calls[0]
      expect(uploadCall[2].length).toBe(2)
    })
  })

  describe('Update Project Functionality', () => {
    it('should update project with all fields', async () => {
      req.body = {
        ...req.body,
        type: 'COMMERCIAL',
        builderWebsiteLink: 'https://builder.com',
        highlights: ['Highlight 1', 'Highlight 2'],
        amenities: ['Amenity 1', 'Amenity 2'],
        walkthroughVideoUrl: 'https://youtube.com/watch?v=123',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: expect.objectContaining({
          name: 'Updated Project',
          description: 'Updated Description',
          type: 'COMMERCIAL',
          builderId: 'builder-123',
          builderWebsiteLink: 'https://builder.com',
          highlights: ['Highlight 1', 'Highlight 2'],
          amenities: ['Amenity 1', 'Amenity 2'],
          walkthroughVideoUrl: 'https://youtube.com/watch?v=123',
        }),
        include: {
          location: true,
          builder: true,
        },
      })
    })

    it('should return updated project in response', async () => {
      const updatedProject = {
        ...mockProject,
        name: 'Updated Project',
      }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Project updated successfully',
        project: updatedProject,
      })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when image upload fails', async () => {
      req.body = {
        ...req.body,
        bannerImageBase64: 'data:image/png;base64,abc',
      }
      ;(uploadProjectImage as jest.Mock).mockRejectedValue(new Error('Upload failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to upload images or PDF' })
    })

    it('should return 500 when project update fails', async () => {
      ;(prisma.project.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: undefined,
      })
    })

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const testError = new Error('Test error')
      ;(prisma.project.update as jest.Mock).mockRejectedValue(testError)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: testError,
      })
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Edge Cases', () => {
    it('should handle null optional fields', async () => {
      req.body = {
        ...req.body,
        builderWebsiteLink: null,
        highlights: null,
        amenities: null,
        walkthroughVideoUrl: null,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            builderWebsiteLink: null,
            highlights: null,
            amenities: null,
            walkthroughVideoUrl: null,
          }),
        })
      )
    })

    it('should handle empty arrays for images', async () => {
      req.body = {
        ...req.body,
        floorplanImagesBase64: [],
        clubhouseImagesBase64: [],
        galleryImagesBase64: [],
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(uploadMultipleProjectImages).not.toHaveBeenCalled()
    })

    it('should default type to RESIDENTIAL if not provided', async () => {
      req.body = {
        ...req.body,
        type: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RESIDENTIAL',
          }),
        })
      )
    })
  })
})
