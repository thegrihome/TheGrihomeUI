import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/create'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { geocodeAddress } from '@/lib/utils/geocoding'
import { uploadProjectImage, uploadMultipleProjectImages } from '@/lib/utils/vercel-blob'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    builder: {
      findUnique: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    project: {
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

describe('/api/projects/create', () => {
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

  const mockGeocodeResult = {
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    zipcode: '400001',
    locality: 'Andheri',
    neighborhood: 'Versova',
    latitude: 19.1234,
    longitude: 72.5678,
    formattedAddress: 'Andheri, Mumbai, Maharashtra 400001',
  }

  const mockLocation = {
    id: 'location-123',
    ...mockGeocodeResult,
  }

  const baseRequestBody = {
    name: 'Test Project',
    description: 'Test Description',
    builderId: 'builder-123',
    locationAddress: 'Mumbai, India',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should accept POST method', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
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
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user ID', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: {} })

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' })
    })

    it('should pass authentication with valid session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(401)
    })
  })

  describe('Input Validation - Required Fields', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when name is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          description: 'Test Description',
          builderId: 'builder-123',
          locationAddress: 'Mumbai, India',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Missing required fields' })
    })

    it('should return 400 when description is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Project',
          builderId: 'builder-123',
          locationAddress: 'Mumbai, India',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Missing required fields' })
    })

    it('should return 400 when builderId is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Project',
          description: 'Test Description',
          locationAddress: 'Mumbai, India',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Missing required fields' })
    })

    it('should return 400 when locationAddress is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Project',
          description: 'Test Description',
          builderId: 'builder-123',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Missing required fields' })
    })

    it('should return 400 when all required fields are missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Missing required fields' })
    })

    it('should pass validation with all required fields', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.location.create as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('Builder Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when builder does not exist', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Invalid builder ID' })
    })

    it('should call prisma.builder.findUnique with correct ID', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.builder.findUnique).toHaveBeenCalledWith({
        where: { id: 'builder-123' },
      })
    })

    it('should continue when builder exists', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Could not geocode the provided address',
      })
    })
  })

  describe('Geocoding', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
    })

    it('should call geocodeAddress with location address', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(geocodeAddress).toHaveBeenCalledWith('Mumbai, India')
    })

    it('should return 400 when geocoding fails', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Could not geocode the provided address',
      })
    })

    it('should return 400 when geocoding returns undefined', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(undefined)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Could not geocode the provided address',
      })
    })

    it('should continue when geocoding succeeds', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
    })
  })

  describe('Location Management - Finding Existing', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
    })

    it('should search for existing location with tolerance', async () => {
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.location.create as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.location.findFirst).toHaveBeenCalledWith({
        where: {
          latitude: {
            gte: mockGeocodeResult.latitude - 0.0001,
            lte: mockGeocodeResult.latitude + 0.0001,
          },
          longitude: {
            gte: mockGeocodeResult.longitude - 0.0001,
            lte: mockGeocodeResult.longitude + 0.0001,
          },
        },
      })
    })

    it('should use existing location if found', async () => {
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.create as jest.Mock).mockResolvedValue({
        id: 'project-123',
        locationId: 'location-123',
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.location.create).not.toHaveBeenCalled()
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            locationId: 'location-123',
          }),
        })
      )
    })
  })

  describe('Location Management - Creating New', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)
    })

    it('should create new location when not found', async () => {
      ;(prisma.location.create as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

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

    it('should default country to India when not provided', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue({
        ...mockGeocodeResult,
        country: null,
      })
      ;(prisma.location.create as jest.Mock).mockResolvedValue(mockLocation)
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.location.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            country: 'India',
          }),
        })
      )
    })
  })

  describe('Image Upload - Banner', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    })

    it('should not upload banner when not provided', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(uploadProjectImage).not.toHaveBeenCalled()
    })

    it('should upload banner when provided', async () => {
      ;(uploadProjectImage as jest.Mock).mockResolvedValue(
        'https://blob.vercel-storage.com/banner.png'
      )
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          bannerImageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
        },
      })

      await handler(req, res)

      expect(uploadProjectImage).toHaveBeenCalledWith({
        projectName: 'Test Project',
        folder: 'banner',
        base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
      })
    })

    it('should return 500 when banner upload fails', async () => {
      ;(uploadProjectImage as jest.Mock).mockRejectedValue(new Error('Upload failed'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          bannerImageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Failed to upload images' })
    })
  })

  describe('Image Upload - Floorplans', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    })

    it('should not upload floorplans when not provided', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).not.toHaveBeenCalled()
    })

    it('should upload floorplans when provided', async () => {
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(['url1.png', 'url2.png'])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          floorplanImagesBase64: ['data:image/png;base64,img1', 'data:image/png;base64,img2'],
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith('Test Project', 'floorplans', [
        'data:image/png;base64,img1',
        'data:image/png;base64,img2',
      ])
    })

    it('should limit floorplans to 20 images', async () => {
      const images = Array(25).fill('data:image/png;base64,img')
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue([])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          floorplanImagesBase64: images,
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Test Project',
        'floorplans',
        images.slice(0, 20)
      )
    })

    it('should handle empty floorplan array', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          floorplanImagesBase64: [],
        },
      })

      await handler(req, res)

      // Handler still calls upload function with empty array, which is fine
      expect(uploadMultipleProjectImages).toHaveBeenCalledWith('Test Project', 'floorplans', [])
    })
  })

  describe('Image Upload - Clubhouse', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    })

    it('should upload clubhouse images when provided', async () => {
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(['url1.png', 'url2.png'])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          clubhouseImagesBase64: ['data:image/png;base64,img1', 'data:image/png;base64,img2'],
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith('Test Project', 'clubhouse', [
        'data:image/png;base64,img1',
        'data:image/png;base64,img2',
      ])
    })

    it('should limit clubhouse images to 10', async () => {
      const images = Array(15).fill('data:image/png;base64,img')
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue([])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          clubhouseImagesBase64: images,
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Test Project',
        'clubhouse',
        images.slice(0, 10)
      )
    })
  })

  describe('Image Upload - Gallery', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    })

    it('should upload gallery images when provided', async () => {
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue(['url1.png', 'url2.png'])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          galleryImagesBase64: ['data:image/png;base64,img1', 'data:image/png;base64,img2'],
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith('Test Project', 'gallery', [
        'data:image/png;base64,img1',
        'data:image/png;base64,img2',
      ])
    })

    it('should limit gallery images to 20', async () => {
      const images = Array(25).fill('data:image/png;base64,img')
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue([])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          galleryImagesBase64: images,
        },
      })

      await handler(req, res)

      expect(uploadMultipleProjectImages).toHaveBeenCalledWith(
        'Test Project',
        'gallery',
        images.slice(0, 20)
      )
    })
  })

  describe('Project Creation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    })

    it('should create project with required fields only', async () => {
      const mockProject = { id: 'project-123', name: 'Test Project' }
      ;(prisma.project.create as jest.Mock).mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Project',
            description: 'Test Description',
            builderId: 'builder-123',
            locationId: 'location-123',
            postedByUserId: 'user-123',
            isArchived: false,
          }),
        })
      )
    })

    it('should create project with default type RESIDENTIAL', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RESIDENTIAL',
          }),
        })
      )
    })

    it('should create project with custom type', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          type: 'COMMERCIAL',
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMERCIAL',
          }),
        })
      )
    })

    it('should set thumbnail to banner if available', async () => {
      ;(uploadProjectImage as jest.Mock).mockResolvedValue('https://banner.png')
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          bannerImageBase64: 'data:image/png;base64,banner',
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            thumbnailUrl: 'https://banner.png',
          }),
        })
      )
    })

    it('should set thumbnail to first gallery image if no banner', async () => {
      ;(uploadMultipleProjectImages as jest.Mock).mockResolvedValue([
        'https://gallery1.png',
        'https://gallery2.png',
      ])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          galleryImagesBase64: ['data:image/png;base64,img1', 'data:image/png;base64,img2'],
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            thumbnailUrl: 'https://gallery1.png',
          }),
        })
      )
    })

    it('should combine all image URLs in imageUrls field', async () => {
      ;(uploadMultipleProjectImages as jest.Mock)
        .mockResolvedValueOnce(['floor1.png', 'floor2.png'])
        .mockResolvedValueOnce(['club1.png'])
        .mockResolvedValueOnce(['gallery1.png', 'gallery2.png'])
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          floorplanImagesBase64: ['img1', 'img2'],
          clubhouseImagesBase64: ['img3'],
          galleryImagesBase64: ['img4', 'img5'],
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imageUrls: ['floor1.png', 'floor2.png', 'club1.png', 'gallery1.png', 'gallery2.png'],
          }),
        })
      )
    })
  })

  describe('Optional Fields', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    })

    it('should include builderWebsiteLink when provided', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          builderWebsiteLink: 'https://builder.com',
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            builderWebsiteLink: 'https://builder.com',
          }),
        })
      )
    })

    it('should include brochureUrl when provided', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          brochureUrl: 'https://brochure.pdf',
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            brochureUrl: 'https://brochure.pdf',
          }),
        })
      )
    })

    it('should include highlights when provided', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          highlights: ['Modern design', 'Eco-friendly'],
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            highlights: ['Modern design', 'Eco-friendly'],
          }),
        })
      )
    })

    it('should include amenities when provided', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          amenities: ['Swimming pool', 'Gym'],
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amenities: ['Swimming pool', 'Gym'],
          }),
        })
      )
    })

    it('should include walkthroughVideoUrl when provided', async () => {
      ;(prisma.project.create as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...baseRequestBody,
          walkthroughVideoUrl: 'https://youtube.com/watch?v=123',
        },
      })

      await handler(req, res)

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            walkthroughVideoUrl: 'https://youtube.com/watch?v=123',
          }),
        })
      )
    })
  })

  describe('Success Response', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.builder.findUnique as jest.Mock).mockResolvedValue(mockBuilder)
      ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)
    })

    it('should return 201 on successful creation', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        location: mockLocation,
        builder: mockBuilder,
      }
      ;(prisma.project.create as jest.Mock).mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
    })

    it('should return success message and project', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        location: mockLocation,
        builder: mockBuilder,
      }
      ;(prisma.project.create as jest.Mock).mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toEqual({
        message: 'Project created successfully',
        project: mockProject,
      })
    })

    it('should include location and builder in response', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        location: mockLocation,
        builder: mockBuilder,
      }
      ;(prisma.project.create as jest.Mock).mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.project).toHaveProperty('location')
      expect(data.project).toHaveProperty('builder')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 500 on database error', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toHaveProperty('message', 'Internal server error')
    })

    it('should return 500 on unexpected error', async () => {
      ;(prisma.builder.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should include error details in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      ;(prisma.builder.findUnique as jest.Mock).mockRejectedValue(error)

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('error')

      process.env.NODE_ENV = originalEnv
    })

    it('should not include error details in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      ;(prisma.builder.findUnique as jest.Mock).mockRejectedValue(new Error('Test error'))

      const { req, res } = createMocks({
        method: 'POST',
        body: baseRequestBody,
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.error).toBeUndefined()

      process.env.NODE_ENV = originalEnv
    })
  })
})
