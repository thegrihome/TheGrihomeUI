import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/update'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { geocodeAddress } from '@/lib/utils/geocoding'
import { uploadProjectImage, uploadMultipleProjectImages } from '@/lib/utils/vercel-blob'

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

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/utils/geocoding', () => ({
  geocodeAddress: jest.fn(),
}))

jest.mock('@/lib/utils/vercel-blob', () => ({
  uploadProjectImage: jest.fn(),
  uploadMultipleProjectImages: jest.fn(),
}))

describe('/api/projects/[id]/update', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  }

  const mockBuilder = {
    id: 'builder-123',
    name: 'Test Builder',
  }

  const mockProject = {
    id: 'project-123',
    postedByUserId: 'user-123',
    name: 'Old Project',
    bannerImageUrl: 'https://old-banner.png',
    floorplanImageUrls: ['https://old-floor1.png'],
    clubhouseImageUrls: ['https://old-club1.png'],
    galleryImageUrls: ['https://old-gallery1.png'],
  }

  const mockLocation = {
    id: 'location-123',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    zipcode: '400001',
    locality: 'Andheri',
    neighborhood: 'Versova',
    latitude: 19.1234,
    longitude: 72.5678,
    formattedAddress: 'Andheri, Mumbai',
  }

  const baseRequestBody = {
    name: 'Updated Project',
    description: 'Updated Description',
    builderId: 'builder-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should accept PUT method', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return 401 when session has no user ID', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: {} })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('Project ID Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when id is missing', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: {},
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project ID is required' })
    })

    it('should return 400 when id is not a string', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: ['array', 'value'] },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project ID is required' })
    })

    it('should accept valid string id', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('Project Existence & Ownership', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 404 when project does not exist', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'nonexistent' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project not found' })
    })

    it('should return 403 when user does not own project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        postedByUserId: 'different-user',
      })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'You do not have permission to edit this project',
      })
    })

    it('should continue when user owns project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(403)
    })
  })

  describe('Input Validation - Required Fields', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should return 400 when name is missing', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          description: 'Description',
          builderId: 'builder-123',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Missing required fields' })
    })

    it('should return 400 when description is missing', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          name: 'Name',
          builderId: 'builder-123',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should return 400 when builderId is missing', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          name: 'Name',
          description: 'Description',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('Builder Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should return 400 when builder does not exist', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Invalid builder ID' })
    })

    it('should continue when builder exists', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(prisma.project.update as jest.Mock).mockResolvedValue({ ...mockProject, ...baseRequestBody })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Location Update', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    })

    it('should not update location when locationAddress not provided', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(geocodeAddress).not.toHaveBeenCalled()
    })

    it('should geocode new location when provided', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          locationAddress: 'New Address, Mumbai',
        },
      })

      await handler(req, res)

      expect(geocodeAddress).toHaveBeenCalledWith('New Address, Mumbai')
    })

    it('should create new location if not found', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.location.create as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          locationAddress: 'New Address',
        },
      })

      await handler(req, res)

      expect(prisma.location.create).toHaveBeenCalled()
    })

    it('should use existing location if found', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          locationAddress: 'Existing Address',
        },
      })

      await handler(req, res)

      expect(prisma.location.create).not.toHaveBeenCalled()
    })
  })

  describe('Image Upload - Keep Existing', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    })

    it('should keep existing banner when keepExistingImages.banner is true', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          keepExistingImages: { banner: true },
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bannerImageUrl: mockProject.bannerImageUrl,
          }),
        })
      )
    })

    it('should keep existing floorplans when keepExistingImages.floorplans is true', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          keepExistingImages: { floorplans: true },
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            floorplanImageUrls: mockProject.floorplanImageUrls,
          }),
        })
      )
    })

    it('should keep existing clubhouse when keepExistingImages.clubhouse is true', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          keepExistingImages: { clubhouse: true },
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clubhouseImageUrls: mockProject.clubhouseImageUrls,
          }),
        })
      )
    })

    it('should keep existing gallery when keepExistingImages.gallery is true', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          keepExistingImages: { gallery: true },
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            galleryImageUrls: mockProject.galleryImageUrls,
          }),
        })
      )
    })
  })

  describe('Image Upload - New Images', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    })

    it('should upload new banner image', async () => {
      ;(uploadProjectImage as jest.Mock).mockResolvedValue('https://new-banner.png')
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          bannerImageBase64: 'data:image/png;base64,newimage',
        },
      })

      await handler(req, res)

      expect(uploadProjectImage).toHaveBeenCalledWith({
        projectName: 'Updated Project',
        folder: 'banner',
        base64Image: 'data:image/png;base64,newimage',
      })
    })

    it('should not upload banner if not base64 data', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          bannerImageBase64: 'https://existing-url.png',
        },
      })

      await handler(req, res)

      expect(uploadProjectImage).not.toHaveBeenCalled()
    })

    it('should upload new floorplan images', async () => {
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(['url1.png', 'url2.png'])
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          floorplanImagesBase64: ['data:image/png;base64,img1', 'data:image/png;base64,img2'],
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Updated Project',
        'floorplans',
        ['data:image/png;base64,img1', 'data:image/png;base64,img2']
      )
    })

    it('should limit floorplans to 20 images', async () => {
      const images = Array(25).fill('data:image/png;base64,img')
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(Array(20).fill('url.png'))
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          floorplanImagesBase64: images,
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Updated Project',
        'floorplans',
        images.slice(0, 20)
      )
    })

    it('should append new floorplans to existing when keeping existing', async () => {
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(['new1.png', 'new2.png'])
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          floorplanImagesBase64: ['data:image/png;base64,new1'],
          keepExistingImages: { floorplans: true },
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            floorplanImageUrls: expect.arrayContaining([...mockProject.floorplanImageUrls, 'new1.png', 'new2.png']),
          }),
        })
      )
    })

    it('should limit clubhouse to 10 images', async () => {
      const images = Array(15).fill('data:image/png;base64,img')
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(Array(10).fill('url.png'))
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          clubhouseImagesBase64: images,
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Updated Project',
        'clubhouse',
        images.slice(0, 10)
      )
    })

    it('should limit gallery to 20 images', async () => {
      const images = Array(25).fill('data:image/png;base64,img')
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(Array(20).fill('url.png'))
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          galleryImagesBase64: images,
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Updated Project',
        'gallery',
        images.slice(0, 20)
      )
    })

    it('should return 500 when image upload fails', async () => {
      ;(uploadProjectImage as jest.Mock).mockRejectedValue(new Error('Upload failed'))

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          bannerImageBase64: 'data:image/png;base64,img',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Failed to upload images' })
    })
  })

  describe('Project Update', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    })

    it('should update project with basic fields', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'project-123' },
          data: expect.objectContaining({
            name: 'Updated Project',
            description: 'Updated Description',
            builderId: 'builder-123',
          }),
        })
      )
    })

    it('should update with custom type', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          type: 'COMMERCIAL',
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMERCIAL',
          }),
        })
      )
    })

    it('should include location and builder in response', async () => {
      const updatedProject = {
        ...mockProject,
        ...baseRequestBody,
        location: mockLocation,
        builder: mockBuilder,
      }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            location: true,
            builder: true,
          },
        })
      )
    })
  })

  describe('Optional Fields', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    })

    it('should update builderWebsiteLink', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          builderWebsiteLink: 'https://newbuilder.com',
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            builderWebsiteLink: 'https://newbuilder.com',
          }),
        })
      )
    })

    it('should update highlights', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          highlights: ['New highlight 1', 'New highlight 2'],
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            highlights: ['New highlight 1', 'New highlight 2'],
          }),
        })
      )
    })

    it('should update amenities', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          amenities: ['Pool', 'Gym', 'Parking'],
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amenities: ['Pool', 'Gym', 'Parking'],
          }),
        })
      )
    })

    it('should update walkthroughVideoUrl', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: {
          ...baseRequestBody,
          walkthroughVideoUrl: 'https://youtube.com/watch?v=new',
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            walkthroughVideoUrl: 'https://youtube.com/watch?v=new',
          }),
        })
      )
    })
  })

  describe('Success Response', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    })

    it('should return 200 on successful update', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should return success message and updated project', async () => {
      const updatedProject = {
        ...mockProject,
        ...baseRequestBody,
        location: mockLocation,
        builder: mockBuilder,
      }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toEqual({
        message: 'Project updated successfully',
        project: updatedProject,
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 500 on database error', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' })
    })

    it('should handle unexpected errors', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })
})
