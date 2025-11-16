import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/properties/[id]/index'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    location: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('/api/properties/[id]', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  const mockProperty = {
    id: 'property-123',
    streetAddress: '123 Main St',
    locationId: 'location-123',
    userId: 'user-123',
    postedBy: 'John Doe',
    propertyType: 'CONDO',
    listingType: 'SALE',
    sqFt: 1200,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    imageUrls: ['https://example.com/img1.jpg'],
    listingStatus: 'ACTIVE',
    soldTo: null,
    soldDate: null,
    createdAt: new Date('2024-01-15'),
    projectId: 'project-123',
    propertyDetails: {
      title: 'Beautiful Apartment',
      bedrooms: 3,
      bathrooms: 2,
      price: 5000000,
      propertySize: 1200,
      propertySizeUnit: 'sq_ft',
      plotSize: 150,
      plotSizeUnit: 'sq_yd',
      facing: 'East',
      description: 'A beautiful apartment',
      companyName: 'ABC Realty',
    },
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      zipcode: '500081',
      locality: 'Madhapur',
      neighborhood: 'Gachibowli',
      latitude: 17.385,
      longitude: 78.4867,
      formattedAddress: '123 Main St, Madhapur, Hyderabad, Telangana 500081',
    },
    builder: {
      name: 'ABC Builders',
    },
    project: {
      name: 'Green Valley',
    },
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210',
    },
    interests: [
      {
        id: 'interest-1',
        user: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+919123456789',
        },
        createdAt: new Date('2024-01-20'),
      },
    ],
    soldToUser: null,
  }

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'john@example.com',
      name: 'John Doe',
    },
  }

  const mockUser = {
    id: 'user-123',
    email: 'john@example.com',
  }

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'GET',
      query: { id: 'property-123' },
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.location.create as jest.Mock).mockResolvedValue({ id: 'new-location-123' })
  })

  describe('HTTP Method Validation', () => {
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

    it('should return 405 for PATCH requests', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept GET requests', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept PUT requests', async () => {
      req.method = 'PUT'
      req.body = {
        title: 'Updated Title',
        propertyType: 'CONDO',
        listingType: 'SALE',
        price: '6000000',
        location: {
          address: '123 Main St',
          city: 'Hyderabad',
          state: 'Telangana',
        },
      }
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: 'user-123',
      })
      ;(prisma.property.update as jest.Mock).mockResolvedValue(mockProperty)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('GET - Property ID Validation', () => {
    it('should return 400 when id is missing', async () => {
      req.query = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should return 400 when id is not a string', async () => {
      req.query = { id: ['array-value'] }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should accept valid string id', async () => {
      req.query = { id: 'property-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('GET - Property Retrieval', () => {
    it('should fetch property by id', async () => {
      req.query = { id: 'property-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        include: expect.objectContaining({
          location: true,
          builder: true,
          project: true,
          user: expect.any(Object),
          interests: expect.any(Object),
          soldToUser: expect.any(Object),
        }),
      })
    })

    it('should return 404 when property not found', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property not found' })
    })

    it('should return transformed property data', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          id: 'property-123',
          streetAddress: '123 Main St',
          propertyType: 'CONDO',
          listingType: 'SALE',
        }),
      })
    })

    it('should include location details', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          location: expect.objectContaining({
            city: 'Hyderabad',
            state: 'Telangana',
            zipcode: '500081',
            locality: 'Madhapur',
            neighborhood: 'Gachibowli',
            latitude: 17.385,
            longitude: 78.4867,
          }),
        }),
      })
    })

    it('should include property details from JSON field', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          bedrooms: 3,
          bathrooms: 2,
          price: 5000000,
          size: 1200,
          sizeUnit: 'sq_ft',
          plotSize: 150,
          plotSizeUnit: 'sq_yd',
          facing: 'East',
          description: 'A beautiful apartment',
        }),
      })
    })

    it('should include user information', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          userId: 'user-123',
          userEmail: 'john@example.com',
          userPhone: '+919876543210',
          postedBy: 'John Doe',
        }),
      })
    })

    it('should include interests with user details', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          interests: [
            expect.objectContaining({
              id: 'interest-1',
              user: expect.objectContaining({
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '+919123456789',
              }),
            }),
          ],
        }),
      })
    })

    it('should handle property without builder', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        builder: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          builder: 'Independent',
        }),
      })
    })

    it('should use title from propertyDetails for project name', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          project: 'Beautiful Apartment',
        }),
      })
    })

    it('should fallback to project name when title not available', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        propertyDetails: { ...mockProperty.propertyDetails, title: null },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          project: 'Green Valley',
        }),
      })
    })

    it('should fallback to streetAddress when no project or title', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        propertyDetails: { ...mockProperty.propertyDetails, title: null },
        project: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          project: '123 Main St',
        }),
      })
    })

    it('should convert dates to ISO strings', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const result = jsonMock.mock.calls[0][0]
      expect(typeof result.property.createdAt).toBe('string')
    })

    it('should include soldDate when property is sold', async () => {
      const soldDate = new Date('2024-01-25')
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        soldDate,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          soldDate: soldDate.toISOString(),
        }),
      })
    })

    it('should handle property without interests', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        interests: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          interests: [],
        }),
      })
    })

    it('should handle interest with missing user name', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        interests: [
          {
            id: 'interest-1',
            user: { name: null, email: 'test@example.com', phone: '+91123456789' },
            createdAt: new Date(),
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          interests: [
            expect.objectContaining({
              user: expect.objectContaining({
                name: 'Unknown User',
              }),
            }),
          ],
        }),
      })
    })

    it('should handle interest with missing phone', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        interests: [
          {
            id: 'interest-1',
            user: { name: 'Test User', email: 'test@example.com', phone: null },
            createdAt: new Date(),
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        property: expect.objectContaining({
          interests: [
            expect.objectContaining({
              user: expect.objectContaining({
                phone: 'Not provided',
              }),
            }),
          ],
        }),
      })
    })
  })

  describe('PUT - Authentication', () => {
    beforeEach(() => {
      req.method = 'PUT'
      req.body = {
        title: 'Updated Title',
        propertyType: 'CONDO',
        listingType: 'SALE',
        price: '6000000',
        location: {
          address: '123 Main St',
          city: 'Hyderabad',
          state: 'Telangana',
        },
      }
      ;(prisma.property.update as jest.Mock).mockResolvedValue(mockProperty)
    })

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

    it('should return 401 when session user has no email', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-123' } })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should proceed when valid session exists', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('PUT - Property Validation', () => {
    beforeEach(() => {
      req.method = 'PUT'
      req.body = {
        title: 'Updated Title',
        propertyType: 'CONDO',
        listingType: 'SALE',
        price: '6000000',
        location: {
          address: '123 Main St',
          city: 'Hyderabad',
          state: 'Telangana',
        },
      }
      ;(prisma.property.update as jest.Mock).mockResolvedValue(mockProperty)
    })

    it('should return 400 when property ID is missing', async () => {
      req.query = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should return 400 when id is not a string', async () => {
      req.query = { id: ['array-value'] }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should return 404 when property not found', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property not found' })
    })

    it('should return 403 when user does not own property', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        userId: 'different-user',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'You do not have permission to edit this property',
      })
    })

    it('should verify ownership before updating', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockSession.user.email },
        select: { id: true },
      })
    })
  })

  describe('PUT - Property Update', () => {
    beforeEach(() => {
      req.method = 'PUT'
      req.body = {
        title: 'Updated Title',
        propertyType: 'CONDO',
        listingType: 'SALE',
        bedrooms: '4',
        bathrooms: '3',
        propertySize: '1500',
        propertySizeUnit: 'sq_ft',
        plotSize: '200',
        plotSizeUnit: 'sq_yd',
        facing: 'North',
        description: 'Updated description',
        price: '6000000',
        location: {
          address: '456 New St',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          zipcode: '560001',
          locality: 'Koramangala',
        },
        imageUrls: ['https://example.com/new-img.jpg'],
        thumbnailUrl: 'https://example.com/new-thumb.jpg',
        projectId: 'new-project-id',
      }
      ;(prisma.property.update as jest.Mock).mockResolvedValue(mockProperty)
    })

    it('should create new location', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          zipcode: '560001',
          locality: 'Koramangala',
        }),
      })
    })

    it('should default country to India when not provided', async () => {
      req.body.location.country = undefined

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          country: 'India',
        }),
      })
    })

    it('should update property with new data', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          streetAddress: '456 New St',
          propertyType: 'CONDO',
          listingType: 'SALE',
          sqFt: 1500,
          imageUrls: ['https://example.com/new-img.jpg'],
          thumbnailUrl: 'https://example.com/new-thumb.jpg',
          projectId: 'new-project-id',
        }),
      })
    })

    it('should update propertyDetails JSON field', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            title: 'Updated Title',
            bedrooms: 4,
            bathrooms: 3,
            propertySize: 1500,
            propertySizeUnit: 'sq_ft',
            plotSize: 200,
            plotSizeUnit: 'sq_yd',
            facing: 'North',
            description: 'Updated description',
            price: 6000000,
          }),
        }),
      })
    })

    it('should handle null values in propertyDetails', async () => {
      req.body.bedrooms = null
      req.body.bathrooms = null
      req.body.facing = null

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            bedrooms: null,
            bathrooms: null,
            facing: null,
          }),
        }),
      })
    })

    it('should use projectName when title not provided', async () => {
      req.body.title = undefined
      req.body.projectName = 'Project Name'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          propertyDetails: expect.objectContaining({
            title: 'Project Name',
          }),
        }),
      })
    })

    it('should set projectId to null when not provided', async () => {
      req.body.projectId = undefined

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          projectId: null,
        }),
      })
    })

    it('should fallback to first image for thumbnail when not provided', async () => {
      req.body.thumbnailUrl = undefined

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          thumbnailUrl: 'https://example.com/new-img.jpg',
        }),
      })
    })

    it('should handle empty imageUrls array', async () => {
      req.body.imageUrls = []
      req.body.thumbnailUrl = undefined

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          imageUrls: [],
          thumbnailUrl: null,
        }),
      })
    })

    it('should include locationId when location is created', async () => {
      ;(prisma.location.create as jest.Mock).mockResolvedValue({ id: 'new-location-id' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          locationId: 'new-location-id',
        }),
      })
    })

    it('should not include locationId when location address is missing', async () => {
      req.body.location.address = undefined

      await handler(req as NextApiRequest, res as NextApiResponse)

      const updateCall = (prisma.property.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data.locationId).toBeUndefined()
    })

    it('should return success message on update', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property updated successfully',
        property: mockProperty,
      })
    })
  })

  describe('GET - Error Handling', () => {
    it('should return 500 on database error', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle null location gracefully', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        location: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })

    it('should handle unexpected errors', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })
  })

  describe('PUT - Error Handling', () => {
    beforeEach(() => {
      req.method = 'PUT'
      req.body = {
        title: 'Updated Title',
        propertyType: 'CONDO',
        listingType: 'SALE',
        price: '6000000',
        location: {
          address: '123 Main St',
          city: 'Hyderabad',
          state: 'Telangana',
        },
      }
    })

    it('should return 500 on database error during fetch', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database error during update', async () => {
      ;(prisma.property.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on location creation error', async () => {
      ;(prisma.location.create as jest.Mock).mockRejectedValue(new Error('Location error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(prisma.property.update as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Update property error:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle property with null propertyDetails', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        propertyDetails: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property with empty location fields', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          zipcode: null,
          locality: null,
          neighborhood: null,
          latitude: null,
          longitude: null,
          formattedAddress: null,
        },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle multiple interests', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        interests: [
          {
            id: 'interest-1',
            user: { name: 'User 1', email: 'user1@example.com', phone: '+911111111111' },
            createdAt: new Date(),
          },
          {
            id: 'interest-2',
            user: { name: 'User 2', email: 'user2@example.com', phone: '+912222222222' },
            createdAt: new Date(),
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const result = jsonMock.mock.calls[0][0]
      expect(result.property.interests).toHaveLength(2)
    })

    it('should handle property update with minimal data', async () => {
      req.method = 'PUT'
      req.body = {
        propertyType: 'CONDO',
        listingType: 'SALE',
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
        },
      }
      ;(prisma.property.update as jest.Mock).mockResolvedValue(mockProperty)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })
})
