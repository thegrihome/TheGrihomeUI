import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/properties/favorites'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    savedProperty: {
      findMany: jest.fn(),
    },
  },
}))

describe('/api/properties/favorites', () => {
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

  const mockFavorites = [
    {
      id: 'saved-1',
      userId: 'user-123',
      propertyId: 'property-1',
      createdAt: new Date('2024-01-15'),
      property: {
        id: 'property-1',
        streetAddress: '123 Main St',
        propertyType: 'SINGLE_FAMILY',
        listingType: 'SALE',
        sqFt: 2000,
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        imageUrls: ['https://example.com/img1.jpg'],
        listingStatus: 'ACTIVE',
        soldTo: null,
        soldToUserId: null,
        soldDate: null,
        createdAt: new Date('2024-01-10'),
        userId: 'owner-1',
        propertyDetails: {
          bedrooms: 3,
          bathrooms: 2,
          price: 500000,
          size: '2000',
          sizeUnit: 'sqft',
          plotSize: '5000',
          plotSizeUnit: 'sqft',
        },
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          zipcode: '500001',
          locality: 'Banjara Hills',
          formattedAddress: '123 Main St, Banjara Hills, Hyderabad',
        },
        builder: {
          name: 'Test Builder',
        },
        project: {
          id: 'project-1',
          name: 'Test Project',
        },
        user: {
          id: 'owner-1',
          name: 'Owner Name',
          email: 'owner@example.com',
          companyName: 'Owner Company',
        },
        images: [],
      },
    },
  ]

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'GET',
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(mockFavorites)
  })

  describe('HTTP Method Validation', () => {
    it('should return 405 for POST requests', async () => {
      req.method = 'POST'

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

    it('should accept GET requests', async () => {
      req.method = 'GET'

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

    it('should proceed when valid session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Fetch Favorites Functionality', () => {
    it('should fetch favorites for the authenticated user', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.savedProperty.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockSession.user.id,
        },
        include: {
          property: {
            include: {
              location: true,
              builder: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  companyName: true,
                },
              },
              images: {
                orderBy: {
                  displayOrder: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    })

    it('should return transformed favorites with correct structure', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        favorites: expect.arrayContaining([
          expect.objectContaining({
            id: 'property-1',
            streetAddress: '123 Main St',
            location: expect.objectContaining({
              city: 'Hyderabad',
              state: 'Telangana',
              zipcode: '500001',
              locality: 'Banjara Hills',
              fullAddress: '123 Main St, Banjara Hills, Hyderabad',
            }),
            builder: 'Test Builder',
            project: { id: 'project-1', name: 'Test Project' },
            propertyType: 'SINGLE_FAMILY',
            listingType: 'SALE',
            sqFt: 2000,
            bedrooms: 3,
            bathrooms: 2,
            price: 500000,
            postedBy: 'Owner Name',
            companyName: 'Owner Company',
            userId: 'owner-1',
            userEmail: 'owner@example.com',
          }),
        ]),
        count: 1,
      })
    })

    it('should include favoritedAt timestamp', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].favoritedAt).toBe(mockFavorites[0].createdAt.toISOString())
    })

    it('should return empty array when user has no favorites', async () => {
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        favorites: [],
        count: 0,
      })
    })

    it('should handle properties without builder', async () => {
      const favoritesWithoutBuilder = [
        {
          ...mockFavorites[0],
          property: {
            ...mockFavorites[0].property,
            builder: null,
          },
        },
      ]
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(favoritesWithoutBuilder)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].builder).toBe('')
    })

    it('should handle properties without project', async () => {
      const favoritesWithoutProject = [
        {
          ...mockFavorites[0],
          property: {
            ...mockFavorites[0].property,
            project: null,
          },
        },
      ]
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(favoritesWithoutProject)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].project).toBe('')
    })

    it('should handle propertyDetails as null', async () => {
      const favoritesWithoutDetails = [
        {
          ...mockFavorites[0],
          property: {
            ...mockFavorites[0].property,
            propertyDetails: null,
          },
        },
      ]
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(favoritesWithoutDetails)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].bedrooms).toBeUndefined()
      expect(responseData.favorites[0].bathrooms).toBeUndefined()
      expect(responseData.favorites[0].price).toBeUndefined()
    })

    it('should convert dates to ISO strings', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(typeof responseData.favorites[0].createdAt).toBe('string')
      expect(typeof responseData.favorites[0].favoritedAt).toBe('string')
    })

    it('should handle soldDate conversion', async () => {
      const favoritesWithSoldDate = [
        {
          ...mockFavorites[0],
          property: {
            ...mockFavorites[0].property,
            soldDate: new Date('2024-01-20'),
          },
        },
      ]
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(favoritesWithSoldDate)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].soldDate).toBe(new Date('2024-01-20').toISOString())
    })
  })

  describe('Multiple Favorites', () => {
    it('should handle multiple favorited properties', async () => {
      const multipleFavorites = [
        mockFavorites[0],
        {
          ...mockFavorites[0],
          id: 'saved-2',
          propertyId: 'property-2',
          property: {
            ...mockFavorites[0].property,
            id: 'property-2',
          },
        },
        {
          ...mockFavorites[0],
          id: 'saved-3',
          propertyId: 'property-3',
          property: {
            ...mockFavorites[0].property,
            id: 'property-3',
          },
        },
      ]
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(multipleFavorites)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites).toHaveLength(3)
      expect(responseData.count).toBe(3)
    })

    it('should order favorites by creation date descending', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.savedProperty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when database query fails', async () => {
      ;(prisma.savedProperty.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

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
      ;(prisma.savedProperty.findMany as jest.Mock).mockRejectedValue(testError)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: testError,
      })
      process.env.NODE_ENV = originalEnv
    })

    it('should handle session retrieval error', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })
  })

  describe('Edge Cases', () => {
    it('should handle properties with missing optional fields', async () => {
      const favoritesWithMissingFields = [
        {
          ...mockFavorites[0],
          property: {
            ...mockFavorites[0].property,
            location: {
              ...mockFavorites[0].property.location,
              zipcode: null,
              locality: null,
            },
          },
        },
      ]
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(favoritesWithMissingFields)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].location.zipcode).toBe('')
      expect(responseData.favorites[0].location.locality).toBe('')
    })

    it('should handle user with no company name', async () => {
      const favoritesWithoutCompany = [
        {
          ...mockFavorites[0],
          property: {
            ...mockFavorites[0].property,
            user: {
              ...mockFavorites[0].property.user,
              companyName: null,
            },
          },
        },
      ]
      ;(prisma.savedProperty.findMany as jest.Mock).mockResolvedValue(favoritesWithoutCompany)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].companyName).toBeNull()
    })

    it('should use description as streetAddress', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseData = jsonMock.mock.calls[0][0]
      expect(responseData.favorites[0].description).toBe('123 Main St')
    })
  })
})
