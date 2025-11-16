import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import handler from '@/pages/api/user/properties'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      findMany: jest.fn(),
    },
  },
}))

describe('/api/user/properties', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    req = {
      method: 'GET',
      headers: {},
    }
    res = {
      status: statusMock,
    }
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for POST method', async () => {
      req.method = 'POST'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      req.method = 'PUT'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept GET method', async () => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Authentication', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return 401 when no session exists', async () => {
      ;(getSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({})

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user has no email', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: {},
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user email is empty string', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: '' },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should pass authentication with valid session', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })
  })

  describe('Property Retrieval', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should return empty array when no properties found', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ properties: [] })
    })

    it('should query properties by user email', async () => {
      const email = 'test@example.com'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user: {
              email,
            },
          },
        })
      )
    })

    it('should include location data', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            location: true,
          }),
        })
      )
    })

    it('should include builder data', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            builder: true,
          }),
        })
      )
    })

    it('should include project data', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            project: true,
          }),
        })
      )
    })

    it('should include interests with user data', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            interests: expect.objectContaining({
              include: expect.objectContaining({
                user: expect.objectContaining({
                  select: expect.objectContaining({
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  }),
                }),
              }),
            }),
          }),
        })
      )
    })

    it('should include soldToUser data', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            soldToUser: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                email: true,
              }),
            }),
          }),
        })
      )
    })

    it('should order by createdAt descending', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        })
      )
    })
  })

  describe('Property Transformation', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should transform single property correctly', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          zipcode: '400001',
          locality: 'Bandra',
        },
        builder: { name: 'Builder Co' },
        project: { name: 'Test Project' },
        propertyType: 'APARTMENT',
        sqFt: 1200,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        imageUrls: ['https://example.com/img1.jpg'],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {
          bedrooms: 3,
          bathrooms: 2,
          price: 5000000,
          description: 'Nice property',
        },
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            id: 'prop-1',
            streetAddress: '123 Main St',
            location: expect.objectContaining({
              city: 'Mumbai',
              state: 'Maharashtra',
              zipcode: '400001',
              locality: 'Bandra',
            }),
            builder: 'Builder Co',
            project: 'Test Project',
            propertyType: 'APARTMENT',
            sqFt: 1200,
          }),
        ],
      })
    })

    it('should handle property without builder', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Delhi',
          state: 'Delhi',
          zipcode: '110001',
          locality: null,
        },
        builder: null,
        project: null,
        propertyType: 'VILLA',
        sqFt: 2000,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            builder: 'Independent',
          }),
        ],
      })
    })

    it('should handle property without project', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Pune',
          state: 'Maharashtra',
          zipcode: '411001',
          locality: 'Koregaon Park',
        },
        builder: null,
        project: null,
        propertyType: 'APARTMENT',
        sqFt: 1000,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            project: 'Individual Property',
          }),
        ],
      })
    })

    it('should use project name when available', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          zipcode: '560001',
          locality: 'Indiranagar',
        },
        builder: { name: 'Builder' },
        project: { name: 'Luxury Apartments' },
        propertyType: 'APARTMENT',
        sqFt: 1500,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: { title: 'Old Title' },
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            project: 'Luxury Apartments',
          }),
        ],
      })
    })

    it('should use propertyDetails title when no project', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          zipcode: '500001',
          locality: 'Banjara Hills',
        },
        builder: null,
        project: null,
        propertyType: 'VILLA',
        sqFt: 3000,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: { title: 'Custom Title' },
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            project: 'Custom Title',
          }),
        ],
      })
    })

    it('should include full address in location', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Chennai',
          state: 'Tamil Nadu',
          zipcode: '600001',
          locality: 'T Nagar',
        },
        builder: null,
        project: null,
        propertyType: 'PLOT',
        sqFt: 1800,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            location: expect.objectContaining({
              fullAddress: 'T Nagar, Chennai, Tamil Nadu 600001',
            }),
          }),
        ],
      })
    })

    it('should handle location without locality', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Kolkata',
          state: 'West Bengal',
          zipcode: '700001',
          locality: null,
        },
        builder: null,
        project: null,
        propertyType: 'APARTMENT',
        sqFt: 900,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            location: expect.objectContaining({
              fullAddress: 'Kolkata, West Bengal 700001',
            }),
          }),
        ],
      })
    })

    it('should handle location without zipcode', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Ahmedabad',
          state: 'Gujarat',
          zipcode: null,
          locality: 'Satellite',
        },
        builder: null,
        project: null,
        propertyType: 'HOUSE',
        sqFt: 1600,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            location: expect.objectContaining({
              zipcode: '',
            }),
          }),
        ],
      })
    })
  })

  describe('Interests Transformation', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should transform interests correctly', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Jaipur',
          state: 'Rajasthan',
          zipcode: '302001',
          locality: 'C Scheme',
        },
        builder: null,
        project: null,
        propertyType: 'APARTMENT',
        sqFt: 1100,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [
          {
            id: 'int-1',
            user: {
              id: 'buyer-1',
              name: 'Buyer One',
              email: 'buyer1@example.com',
              phone: '+911234567890',
            },
            createdAt: new Date('2024-01-05'),
          },
          {
            id: 'int-2',
            user: {
              id: 'buyer-2',
              name: 'Buyer Two',
              email: 'buyer2@example.com',
              phone: '+919876543210',
            },
            createdAt: new Date('2024-01-06'),
          },
        ],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            interests: [
              {
                id: 'int-1',
                user: {
                  name: 'Buyer One',
                  email: 'buyer1@example.com',
                  phone: '+911234567890',
                },
                createdAt: '2024-01-05T00:00:00.000Z',
              },
              {
                id: 'int-2',
                user: {
                  name: 'Buyer Two',
                  email: 'buyer2@example.com',
                  phone: '+919876543210',
                },
                createdAt: '2024-01-06T00:00:00.000Z',
              },
            ],
          }),
        ],
      })
    })

    it('should handle interest with null user name', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Surat',
          state: 'Gujarat',
          zipcode: '395001',
          locality: 'Adajan',
        },
        builder: null,
        project: null,
        propertyType: 'COMMERCIAL',
        sqFt: 2000,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [
          {
            id: 'int-1',
            user: {
              id: 'buyer-1',
              name: null,
              email: 'buyer@example.com',
              phone: '+911234567890',
            },
            createdAt: new Date('2024-01-05'),
          },
        ],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            interests: [
              expect.objectContaining({
                user: expect.objectContaining({
                  name: 'Unknown User',
                }),
              }),
            ],
          }),
        ],
      })
    })

    it('should handle interest with null phone', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          zipcode: '226001',
          locality: 'Gomti Nagar',
        },
        builder: null,
        project: null,
        propertyType: 'APARTMENT',
        sqFt: 1300,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [
          {
            id: 'int-1',
            user: {
              id: 'buyer-1',
              name: 'Buyer',
              email: 'buyer@example.com',
              phone: null,
            },
            createdAt: new Date('2024-01-05'),
          },
        ],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            interests: [
              expect.objectContaining({
                user: expect.objectContaining({
                  phone: 'Not provided',
                }),
              }),
            ],
          }),
        ],
      })
    })

    it('should order interests by createdAt descending', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            interests: expect.objectContaining({
              orderBy: {
                createdAt: 'desc',
              },
            }),
          }),
        })
      )
    })
  })

  describe('Multiple Properties', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should handle multiple properties', async () => {
      const mockProperties = [
        {
          id: 'prop-1',
          streetAddress: '123 Main St',
          location: {
            city: 'Indore',
            state: 'Madhya Pradesh',
            zipcode: '452001',
            locality: 'Vijay Nagar',
          },
          builder: null,
          project: null,
          propertyType: 'APARTMENT',
          sqFt: 1000,
          thumbnailUrl: null,
          imageUrls: [],
          listingStatus: 'ACTIVE',
          soldTo: null,
          soldToUserId: null,
          soldDate: null,
          createdAt: new Date('2024-01-01'),
          postedBy: 'user-1',
          propertyDetails: {},
          interests: [],
        },
        {
          id: 'prop-2',
          streetAddress: '456 Oak Ave',
          location: {
            city: 'Nagpur',
            state: 'Maharashtra',
            zipcode: '440001',
            locality: 'Dharampeth',
          },
          builder: null,
          project: null,
          propertyType: 'VILLA',
          sqFt: 2500,
          thumbnailUrl: null,
          imageUrls: [],
          listingStatus: 'ACTIVE',
          soldTo: null,
          soldToUserId: null,
          soldDate: null,
          createdAt: new Date('2024-01-02'),
          postedBy: 'user-1',
          propertyDetails: {},
          interests: [],
        },
      ]

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: expect.arrayContaining([
          expect.objectContaining({ id: 'prop-1' }),
          expect.objectContaining({ id: 'prop-2' }),
        ]),
      })
    })
  })

  describe('PropertyDetails Fields', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should include bedrooms from propertyDetails', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Chandigarh',
          state: 'Chandigarh',
          zipcode: '160001',
          locality: 'Sector 17',
        },
        builder: null,
        project: null,
        propertyType: 'APARTMENT',
        sqFt: 1200,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: { bedrooms: 3 },
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            bedrooms: 3,
          }),
        ],
      })
    })

    it('should include bathrooms from propertyDetails', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Bhopal',
          state: 'Madhya Pradesh',
          zipcode: '462001',
          locality: 'MP Nagar',
        },
        builder: null,
        project: null,
        propertyType: 'HOUSE',
        sqFt: 1500,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: { bathrooms: 2 },
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            bathrooms: 2,
          }),
        ],
      })
    })

    it('should include price from propertyDetails', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          zipcode: '530001',
          locality: 'MVP Colony',
        },
        builder: null,
        project: null,
        propertyType: 'APARTMENT',
        sqFt: 1100,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: { price: 7500000 },
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            price: 7500000,
          }),
        ],
      })
    })

    it('should include all propertyDetails fields', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Vadodara',
          state: 'Gujarat',
          zipcode: '390001',
          locality: 'Alkapuri',
        },
        builder: null,
        project: null,
        propertyType: 'VILLA',
        sqFt: 3000,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {
          bedrooms: 4,
          bathrooms: 3,
          price: 12000000,
          size: 3000,
          sizeUnit: 'sqft',
          plotSize: 5000,
          plotSizeUnit: 'sqft',
          description: 'Luxury villa',
          companyName: 'Realty Co',
        },
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            bedrooms: 4,
            bathrooms: 3,
            price: 12000000,
            size: 3000,
            sizeUnit: 'sqft',
            plotSize: 5000,
            plotSizeUnit: 'sqft',
            description: 'Luxury villa',
            companyName: 'Realty Co',
          }),
        ],
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return 500 on database error', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.property.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on session error', async () => {
      ;(getSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle Prisma connection error', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.property.findMany as jest.Mock).mockRejectedValue({
        code: 'P1001',
        message: 'Cannot connect to database',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle timeout error', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.property.findMany as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Sold Properties', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should include sold properties with soldTo info', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Gurgaon',
          state: 'Haryana',
          zipcode: '122001',
          locality: 'Cyber City',
        },
        builder: null,
        project: null,
        propertyType: 'APARTMENT',
        sqFt: 1400,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'SOLD',
        soldTo: 'Buyer Name',
        soldToUserId: 'buyer-1',
        soldDate: new Date('2024-02-01'),
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
        soldToUser: {
          id: 'buyer-1',
          name: 'Buyer Name',
          email: 'buyer@example.com',
        },
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            listingStatus: 'SOLD',
            soldTo: 'Buyer Name',
            soldToUserId: 'buyer-1',
            soldDate: '2024-02-01T00:00:00.000Z',
          }),
        ],
      })
    })

    it('should handle property with different listing statuses', async () => {
      const mockProperties = [
        {
          id: 'prop-1',
          streetAddress: '123 Main St',
          location: {
            city: 'Noida',
            state: 'Uttar Pradesh',
            zipcode: '201301',
            locality: 'Sector 62',
          },
          builder: null,
          project: null,
          propertyType: 'APARTMENT',
          sqFt: 1100,
          thumbnailUrl: null,
          imageUrls: [],
          listingStatus: 'ACTIVE',
          soldTo: null,
          soldToUserId: null,
          soldDate: null,
          createdAt: new Date('2024-01-01'),
          postedBy: 'user-1',
          propertyDetails: {},
          interests: [],
        },
        {
          id: 'prop-2',
          streetAddress: '456 Oak Ave',
          location: {
            city: 'Noida',
            state: 'Uttar Pradesh',
            zipcode: '201301',
            locality: 'Sector 18',
          },
          builder: null,
          project: null,
          propertyType: 'VILLA',
          sqFt: 2200,
          thumbnailUrl: null,
          imageUrls: [],
          listingStatus: 'INACTIVE',
          soldTo: null,
          soldToUserId: null,
          soldDate: null,
          createdAt: new Date('2024-01-02'),
          postedBy: 'user-1',
          propertyDetails: {},
          interests: [],
        },
      ]

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: expect.arrayContaining([
          expect.objectContaining({ listingStatus: 'ACTIVE' }),
          expect.objectContaining({ listingStatus: 'INACTIVE' }),
        ]),
      })
    })
  })

  describe('Date Conversion', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should convert createdAt to ISO string', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Kochi',
          state: 'Kerala',
          zipcode: '682001',
          locality: 'MG Road',
        },
        builder: null,
        project: null,
        propertyType: 'COMMERCIAL',
        sqFt: 1800,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            createdAt: '2024-01-15T10:30:00.000Z',
          }),
        ],
      })
    })

    it('should convert soldDate to ISO string when present', async () => {
      const mockProperty = {
        id: 'prop-1',
        streetAddress: '123 Main St',
        location: {
          city: 'Thiruvananthapuram',
          state: 'Kerala',
          zipcode: '695001',
          locality: 'Statue',
        },
        builder: null,
        project: null,
        propertyType: 'HOUSE',
        sqFt: 2000,
        thumbnailUrl: null,
        imageUrls: [],
        listingStatus: 'SOLD',
        soldTo: 'Buyer',
        soldToUserId: 'buyer-1',
        soldDate: new Date('2024-02-20T14:45:00Z'),
        createdAt: new Date('2024-01-01'),
        postedBy: 'user-1',
        propertyDetails: {},
        interests: [],
        soldToUser: {
          id: 'buyer-1',
          name: 'Buyer',
          email: 'buyer@example.com',
        },
      }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            soldDate: '2024-02-20T14:45:00.000Z',
          }),
        ],
      })
    })
  })
})
