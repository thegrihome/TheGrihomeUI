import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/properties/create'
import { prisma } from '@/lib/cockroachDB/prisma'
import { geocodeAddress } from '@/lib/utils/geocoding'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    location: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    property: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/utils/geocoding', () => ({
  geocodeAddress: jest.fn(),
}))

describe('/api/properties/create', () => {
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

  const mockLocation = {
    id: 'location-123',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    zipcode: '500081',
    locality: 'Madhapur',
    latitude: 17.385,
    longitude: 78.4867,
  }

  const mockGeocodeResult = {
    latitude: 17.385,
    longitude: 78.4867,
    formattedAddress: '123 Main St, Madhapur, Hyderabad, Telangana 500081, India',
    neighborhood: 'Madhapur',
    locality: 'Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    zipcode: '500081',
  }

  const validPropertyData = {
    title: 'Beautiful Apartment',
    propertyType: 'CONDO',
    listingType: 'SALE',
    bedrooms: '3',
    bathrooms: '2',
    propertySize: '1200',
    propertySizeUnit: 'sq_ft',
    plotSize: '150',
    plotSizeUnit: 'sq_yd',
    facing: 'East',
    description: 'A beautiful apartment in prime location',
    price: '5000000',
    location: {
      address: '123 Main St, Madhapur, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      zipcode: '500081',
      locality: 'Madhapur',
    },
    imageUrls: ['https://example.com/img1.jpg'],
    thumbnailUrl: 'https://example.com/thumb.jpg',
    projectId: 'project-123',
  }

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'POST',
      body: validPropertyData,
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(geocodeAddress as jest.Mock).mockResolvedValue(mockGeocodeResult)
    ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.location.create as jest.Mock).mockResolvedValue(mockLocation)
    ;(prisma.property.create as jest.Mock).mockResolvedValue({
      id: 'property-123',
      ...validPropertyData,
    })
  })

  describe('HTTP Method Validation', () => {
    it('should return 405 for GET requests', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT requests', async () => {
      req.method = 'PUT'

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

    it('should return 405 for PATCH requests', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept POST requests', async () => {
      req.method = 'POST'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
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

    it('should proceed when valid session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should call getServerSession with correct parameters', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(getServerSession).toHaveBeenCalledWith(req, res, expect.anything())
    })
  })

  describe('Required Field Validation', () => {
    it('should return 400 when title is missing', async () => {
      req.body = { ...validPropertyData, title: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when propertyType is missing', async () => {
      req.body = { ...validPropertyData, propertyType: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when price is missing', async () => {
      req.body = { ...validPropertyData, price: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when location is missing', async () => {
      req.body = { ...validPropertyData, location: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when location.address is missing', async () => {
      req.body = { ...validPropertyData, location: { city: 'Hyderabad' } }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should return 400 when title is empty string', async () => {
      req.body = { ...validPropertyData, title: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing required fields' })
    })

    it('should accept request with all required fields', async () => {
      req.body = validPropertyData

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })
  })

  describe('Geocoding Functionality', () => {
    it('should call geocodeAddress with location address', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(geocodeAddress).toHaveBeenCalledWith('123 Main St, Madhapur, Hyderabad')
    })

    it('should use geocoded data to create location', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          city: mockGeocodeResult.city,
          state: mockGeocodeResult.state,
          country: mockGeocodeResult.country,
          zipcode: mockGeocodeResult.zipcode,
          latitude: mockGeocodeResult.latitude,
          longitude: mockGeocodeResult.longitude,
        }),
      })
    })

    it('should check for existing location by coordinates', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.findFirst).toHaveBeenCalledWith({
        where: {
          latitude: expect.objectContaining({
            gte: expect.any(Number),
            lte: expect.any(Number),
          }),
          longitude: expect.objectContaining({
            gte: expect.any(Number),
            lte: expect.any(Number),
          }),
        },
      })
    })

    it('should reuse existing location with matching coordinates', async () => {
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).not.toHaveBeenCalled()
      expect(prisma.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            locationId: mockLocation.id,
          }),
        })
      )
    })

    it('should handle geocoding failure gracefully', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should create location without coordinates when geocoding fails', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.findFirst).toHaveBeenCalled()
    })

    it('should fallback to request data when geocoding fails', async () => {
      ;(geocodeAddress as jest.Mock).mockResolvedValue(null)
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          city: validPropertyData.location.city,
          state: validPropertyData.location.state,
          country: validPropertyData.location.country,
        }),
      })
    })
  })

  describe('Location Creation', () => {
    it('should create new location when not exists', async () => {
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalled()
    })

    it('should include all geocoded fields in location', async () => {
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          city: mockGeocodeResult.city,
          state: mockGeocodeResult.state,
          country: mockGeocodeResult.country,
          zipcode: mockGeocodeResult.zipcode,
          locality: mockGeocodeResult.locality,
          neighborhood: mockGeocodeResult.neighborhood,
          latitude: mockGeocodeResult.latitude,
          longitude: mockGeocodeResult.longitude,
          formattedAddress: mockGeocodeResult.formattedAddress,
        }),
      })
    })

    it('should default country to India when not provided', async () => {
      req.body = {
        ...validPropertyData,
        location: { ...validPropertyData.location, country: undefined },
      }
      ;(geocodeAddress as jest.Mock).mockResolvedValue({
        ...mockGeocodeResult,
        country: undefined,
      })
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          country: 'India',
        }),
      })
    })

    it('should handle empty zipcode', async () => {
      req.body = {
        ...validPropertyData,
        location: { ...validPropertyData.location, zipcode: undefined },
      }
      ;(geocodeAddress as jest.Mock).mockResolvedValue({
        ...mockGeocodeResult,
        zipcode: undefined,
      })
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          zipcode: '',
        }),
      })
    })

    it('should handle empty locality', async () => {
      req.body = {
        ...validPropertyData,
        location: { ...validPropertyData.location, locality: undefined },
      }
      ;(geocodeAddress as jest.Mock).mockResolvedValue({
        ...mockGeocodeResult,
        locality: undefined,
      })
      ;(prisma.location.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          locality: '',
        }),
      })
    })
  })

  describe('Property Creation', () => {
    it('should create property with all required fields', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          streetAddress: validPropertyData.location.address,
          userId: mockSession.user.id,
          propertyType: validPropertyData.propertyType,
        }),
      })
    })

    it('should include user information in property', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockSession.user.id,
          postedBy: mockSession.user.name,
        }),
      })
    })

    it('should use email when user name is not available', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: null },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postedBy: 'test@example.com',
        }),
      })
    })

    it('should use "Anonymous" when neither name nor email available', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: null, name: null },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postedBy: 'Anonymous',
        }),
      })
    })

    it('should include bedrooms in propertyDetails when provided', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            bedrooms: 3,
          }),
        }),
      })
    })

    it('should include bathrooms in propertyDetails when provided', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            bathrooms: 2,
          }),
        }),
      })
    })

    it('should exclude bedrooms when not provided', async () => {
      req.body = { ...validPropertyData, bedrooms: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArgs = (prisma.property.create as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.propertyDetails.bedrooms).toBeUndefined()
    })

    it('should exclude bathrooms when not provided', async () => {
      req.body = { ...validPropertyData, bathrooms: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArgs = (prisma.property.create as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.propertyDetails.bathrooms).toBeUndefined()
    })

    it('should include property size in propertyDetails', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            propertySize: 1200,
            propertySizeUnit: 'sq_ft',
          }),
        }),
      })
    })

    it('should include plot size in propertyDetails', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            plotSize: 150,
            plotSizeUnit: 'sq_yd',
          }),
        }),
      })
    })

    it('should default listingType to SALE when not provided', async () => {
      req.body = { ...validPropertyData, listingType: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          listingType: 'SALE',
        }),
      })
    })

    it('should include thumbnailUrl when provided', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          thumbnailUrl: 'https://example.com/thumb.jpg',
        }),
      })
    })

    it('should set thumbnailUrl to null when not provided', async () => {
      req.body = { ...validPropertyData, thumbnailUrl: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          thumbnailUrl: null,
        }),
      })
    })

    it('should include imageUrls when provided', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          imageUrls: ['https://example.com/img1.jpg'],
        }),
      })
    })

    it('should default imageUrls to empty array when not provided', async () => {
      req.body = { ...validPropertyData, imageUrls: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          imageUrls: [],
        }),
      })
    })

    it('should include projectId when provided', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-123',
        }),
      })
    })

    it('should set projectId to null when empty string', async () => {
      req.body = { ...validPropertyData, projectId: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: null,
        }),
      })
    })

    it('should set projectId to null when only whitespace', async () => {
      req.body = { ...validPropertyData, projectId: '   ' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: null,
        }),
      })
    })
  })

  describe('Square Feet Calculation', () => {
    it('should calculate sqFt for sq_ft unit', async () => {
      req.body = { ...validPropertyData, propertySize: '1200', propertySizeUnit: 'sq_ft' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sqFt: 1200,
        }),
      })
    })

    it('should convert sq_m to sq_ft', async () => {
      req.body = { ...validPropertyData, propertySize: '100', propertySizeUnit: 'sq_m' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sqFt: expect.closeTo(1076.4, 0.1),
        }),
      })
    })

    it('should convert sq_yd to sq_ft', async () => {
      req.body = { ...validPropertyData, propertySize: '100', propertySizeUnit: 'sq_yd' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sqFt: 900,
        }),
      })
    })

    it('should set sqFt to null when propertySize not provided', async () => {
      req.body = { ...validPropertyData, propertySize: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sqFt: null,
        }),
      })
    })

    it('should handle decimal property sizes', async () => {
      req.body = { ...validPropertyData, propertySize: '1200.5', propertySizeUnit: 'sq_ft' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sqFt: 1200.5,
        }),
      })
    })
  })

  describe('Property Details JSON', () => {
    it('should include title in propertyDetails', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            title: 'Beautiful Apartment',
          }),
        }),
      })
    })

    it('should include description in propertyDetails', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            description: 'A beautiful apartment in prime location',
          }),
        }),
      })
    })

    it('should parse price as float', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            price: 5000000,
          }),
        }),
      })
    })

    it('should include location address in propertyDetails', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            location: '123 Main St, Madhapur, Hyderabad',
          }),
        }),
      })
    })

    it('should include locality in propertyDetails', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            locality: 'Madhapur',
          }),
        }),
      })
    })

    it('should default locality to empty string when not provided', async () => {
      req.body = {
        ...validPropertyData,
        location: { ...validPropertyData.location, locality: undefined },
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            locality: '',
          }),
        }),
      })
    })

    it('should include facing when provided', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            facing: 'East',
          }),
        }),
      })
    })

    it('should set facing to null when not provided', async () => {
      req.body = { ...validPropertyData, facing: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            facing: null,
          }),
        }),
      })
    })
  })

  describe('Success Response', () => {
    it('should return 201 status on success', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should return success message', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property created successfully',
        propertyId: 'property-123',
      })
    })

    it('should return created property ID', async () => {
      ;(prisma.property.create as jest.Mock).mockResolvedValue({ id: 'new-property-id' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: 'new-property-id',
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle session retrieval error', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle geocoding error', async () => {
      ;(geocodeAddress as jest.Mock).mockRejectedValue(new Error('Geocoding failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle location creation error', async () => {
      ;(prisma.location.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle property creation error', async () => {
      ;(prisma.property.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle invalid price format', async () => {
      req.body = { ...validPropertyData, price: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      // Should still attempt to create property, parseFloat will return NaN
      expect(prisma.property.create).toHaveBeenCalled()
    })

    it('should handle invalid propertySize format', async () => {
      req.body = { ...validPropertyData, propertySize: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.create).toHaveBeenCalled()
    })
  })

  describe('Optional Fields', () => {
    it('should handle property without bedrooms and bathrooms', async () => {
      req.body = {
        ...validPropertyData,
        bedrooms: undefined,
        bathrooms: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should handle property without plot size', async () => {
      req.body = {
        ...validPropertyData,
        plotSize: undefined,
        plotSizeUnit: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should handle property without images', async () => {
      req.body = {
        ...validPropertyData,
        imageUrls: undefined,
        thumbnailUrl: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should handle property without project', async () => {
      req.body = {
        ...validPropertyData,
        projectId: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should handle property without facing', async () => {
      req.body = {
        ...validPropertyData,
        facing: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should handle property without description', async () => {
      req.body = {
        ...validPropertyData,
        description: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should include first video URL when walkthroughVideoUrls provided', async () => {
      req.body = {
        ...validPropertyData,
        walkthroughVideoUrls: [
          'https://youtube.com/watch?v=123',
          'https://youtube.com/watch?v=456',
        ],
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(mockPrismaPropertyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            walkthroughVideoUrl: 'https://youtube.com/watch?v=123',
          }),
        })
      )
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should handle property without video URLs', async () => {
      req.body = {
        ...validPropertyData,
        walkthroughVideoUrls: undefined,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(mockPrismaPropertyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            walkthroughVideoUrl: null,
          }),
        })
      )
      expect(statusMock).toHaveBeenCalledWith(201)
    })
  })
})
