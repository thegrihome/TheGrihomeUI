import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import handler from '@/pages/api/user/active-listings'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('/api/user/active-listings', () => {
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
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

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
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })
  })

  describe('User Retrieval', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return 404 when user not found', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' })
    })

    it('should query user with correct email', async () => {
      const email = 'test@example.com'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: expect.objectContaining({
          listedProperties: expect.objectContaining({
            where: {
              listingStatus: 'ACTIVE',
            },
          }),
        }),
      })
    })

    it('should include properties with ACTIVE status only', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            listedProperties: expect.objectContaining({
              where: {
                listingStatus: 'ACTIVE',
              },
            }),
          }),
        })
      )
    })

    it('should include project relation', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            listedProperties: expect.objectContaining({
              include: expect.objectContaining({
                project: true,
              }),
            }),
          }),
        })
      )
    })

    it('should include location relation', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            listedProperties: expect.objectContaining({
              include: expect.objectContaining({
                location: true,
              }),
            }),
          }),
        })
      )
    })
  })

  describe('Active Properties Transformation', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should return empty arrays when no active listings', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        properties: [],
        projects: [],
        hasActiveListings: false,
      })
    })

    it('should set hasActiveListings true when properties exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1000,
            location: {
              locality: 'Bandra',
              city: 'Mumbai',
              state: 'Maharashtra',
            },
            project: null,
            thumbnailUrl: 'https://example.com/thumb.jpg',
            imageUrls: ['https://example.com/img1.jpg'],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          hasActiveListings: true,
        })
      )
    })

    it('should transform property with project name', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1200,
            location: {
              locality: 'Koramangala',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: {
              name: 'Luxury Apartments',
            },
            thumbnailUrl: 'https://example.com/thumb.jpg',
            imageUrls: ['https://example.com/img1.jpg'],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            title: 'Luxury Apartments',
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should use propertyDetails title when no project', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'VILLA',
            sqFt: 2500,
            location: {
              locality: 'Banjara Hills',
              city: 'Hyderabad',
              state: 'Telangana',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {
              title: 'Spacious Villa',
            },
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            title: 'Spacious Villa',
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should use propertyDetails projectName when available', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1100,
            location: {
              locality: 'Salt Lake',
              city: 'Kolkata',
              state: 'West Bengal',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {
              projectName: 'Green Gardens',
            },
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            title: 'Green Gardens',
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should fallback to Individual Property when no name', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'HOUSE',
            sqFt: 1800,
            location: {
              locality: 'Satellite',
              city: 'Ahmedabad',
              state: 'Gujarat',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            title: 'Individual Property',
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should include property type', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'COMMERCIAL',
            sqFt: 2000,
            location: {
              locality: 'MG Road',
              city: 'Pune',
              state: 'Maharashtra',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            type: 'COMMERCIAL',
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should include sqFt', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1350,
            location: {
              locality: 'JP Nagar',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            sqFt: 1350,
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should include location with locality, city, and state', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1000,
            location: {
              locality: 'Gomti Nagar',
              city: 'Lucknow',
              state: 'Uttar Pradesh',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            location: {
              locality: 'Gomti Nagar',
              city: 'Lucknow',
              state: 'Uttar Pradesh',
            },
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should use thumbnailUrl if available', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'VILLA',
            sqFt: 3000,
            location: {
              locality: 'Whitefield',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: 'https://example.com/thumbnail.jpg',
            imageUrls: ['https://example.com/img1.jpg'],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            thumbnail: 'https://example.com/thumbnail.jpg',
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should use first imageUrl if no thumbnailUrl', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1200,
            location: {
              locality: 'Anna Nagar',
              city: 'Chennai',
              state: 'Tamil Nadu',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: ['https://example.com/first.jpg', 'https://example.com/second.jpg'],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            thumbnail: 'https://example.com/first.jpg',
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should include propertyDetails', async () => {
      const details = {
        bedrooms: 3,
        bathrooms: 2,
        price: 8000000,
        description: 'Beautiful apartment',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1400,
            location: {
              locality: 'Madhapur',
              city: 'Hyderabad',
              state: 'Telangana',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: details,
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            details,
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })
  })

  describe('Multiple Properties', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should handle multiple active properties', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1000,
            location: {
              locality: 'Indira Nagar',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
          {
            id: 'prop-2',
            propertyType: 'VILLA',
            sqFt: 2500,
            location: {
              locality: 'Sarjapur',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
          {
            id: 'prop-3',
            propertyType: 'PLOT',
            sqFt: 1800,
            location: {
              locality: 'Electronic City',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: expect.arrayContaining([
          expect.objectContaining({ id: 'prop-1' }),
          expect.objectContaining({ id: 'prop-2' }),
          expect.objectContaining({ id: 'prop-3' }),
        ]),
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should count properties correctly for hasActiveListings', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1100,
            location: {
              locality: 'HSR Layout',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          hasActiveListings: true,
        })
      )
    })
  })

  describe('Projects Handling', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should return empty projects array', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projects: [],
        })
      )
    })

    it('should always return projects as empty array', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1000,
            location: {
              locality: 'Jayanagar',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: { name: 'Test Project' },
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projects: [],
        })
      )
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
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
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
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue({
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
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle network error', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Property Types', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should handle APARTMENT type', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1200,
            location: {
              locality: 'Malleswaram',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [expect.objectContaining({ type: 'APARTMENT' })],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should handle VILLA type', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'VILLA',
            sqFt: 2800,
            location: {
              locality: 'Yelahanka',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [expect.objectContaining({ type: 'VILLA' })],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should handle HOUSE type', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'HOUSE',
            sqFt: 1800,
            location: {
              locality: 'Rajaji Nagar',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [expect.objectContaining({ type: 'HOUSE' })],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should handle PLOT type', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'PLOT',
            sqFt: 2400,
            location: {
              locality: 'Hennur',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [expect.objectContaining({ type: 'PLOT' })],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should handle COMMERCIAL type', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'COMMERCIAL',
            sqFt: 3500,
            location: {
              locality: 'Residency Road',
              city: 'Bangalore',
              state: 'Karnataka',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [expect.objectContaining({ type: 'COMMERCIAL' })],
        projects: [],
        hasActiveListings: true,
      })
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should handle property with null location fields', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'APARTMENT',
            sqFt: 1000,
            location: {
              locality: null,
              city: 'Mumbai',
              state: 'Maharashtra',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property with empty imageUrls array', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'VILLA',
            sqFt: 2000,
            location: {
              locality: 'Juhu',
              city: 'Mumbai',
              state: 'Maharashtra',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [
          expect.objectContaining({
            thumbnail: undefined,
          }),
        ],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should handle property with null propertyDetails', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'HOUSE',
            sqFt: 1500,
            location: {
              locality: 'Andheri',
              city: 'Mumbai',
              state: 'Maharashtra',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: null,
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property with very large sqFt', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'COMMERCIAL',
            sqFt: 100000,
            location: {
              locality: 'BKC',
              city: 'Mumbai',
              state: 'Maharashtra',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [expect.objectContaining({ sqFt: 100000 })],
        projects: [],
        hasActiveListings: true,
      })
    })

    it('should handle property with zero sqFt', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [
          {
            id: 'prop-1',
            propertyType: 'PLOT',
            sqFt: 0,
            location: {
              locality: 'Powai',
              city: 'Mumbai',
              state: 'Maharashtra',
            },
            project: null,
            thumbnailUrl: null,
            imageUrls: [],
            propertyDetails: {},
          },
        ],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        properties: [expect.objectContaining({ sqFt: 0 })],
        projects: [],
        hasActiveListings: true,
      })
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should return 200 status on success', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return object with properties, projects, hasActiveListings keys', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.any(Array),
          projects: expect.any(Array),
          hasActiveListings: expect.any(Boolean),
        })
      )
    })

    it('should return hasActiveListings as boolean', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        listedProperties: [],
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(typeof callArg.hasActiveListings).toBe('boolean')
    })
  })
})
