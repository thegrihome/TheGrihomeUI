import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/properties/list'
import { prisma } from '@/lib/cockroachDB/prisma'
import { PropertyType, ListingType, ListingStatus } from '@prisma/client'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('/api/properties/list', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  const mockProperties = [
    {
      id: 'prop-1',
      streetAddress: '123 Main St',
      location: {
        city: 'Hyderabad',
        state: 'Telangana',
        zipcode: '500081',
        locality: 'Madhapur',
      },
      builder: { name: 'ABC Builders' },
      project: { name: 'Green Valley' },
      propertyType: 'CONDO' as PropertyType,
      listingType: 'SALE' as ListingType,
      sqFt: 1200,
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      imageUrls: ['https://example.com/image1.jpg'],
      listingStatus: 'ACTIVE' as ListingStatus,
      createdAt: new Date('2024-01-15'),
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'ABC Realty',
      },
      userId: 'user-1',
      images: [{ imageUrl: 'https://example.com/img1.jpg' }],
      propertyDetails: {
        title: 'Beautiful Apartment',
        bedrooms: 3,
        bathrooms: 2,
        price: '5000000',
        propertySize: 1200,
        propertySizeUnit: 'sq_ft',
        description: 'A beautiful apartment',
      },
    },
    {
      id: 'prop-2',
      streetAddress: '456 Oak Ave',
      location: {
        city: 'Bangalore',
        state: 'Karnataka',
        zipcode: '560001',
        locality: 'Koramangala',
      },
      builder: null,
      project: null,
      propertyType: 'SINGLE_FAMILY' as PropertyType,
      listingType: 'RENT' as ListingType,
      sqFt: 2000,
      thumbnailUrl: null,
      imageUrls: [],
      listingStatus: 'ACTIVE' as ListingStatus,
      createdAt: new Date('2024-01-10'),
      user: {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        companyName: null,
      },
      userId: 'user-2',
      images: [{ imageUrl: 'https://example.com/img2.jpg' }],
      propertyDetails: {
        title: 'Spacious Villa',
        bedrooms: 4,
        bathrooms: 3,
        price: '30000',
        propertySize: 2000,
        propertySizeUnit: 'sq_ft',
      },
    },
  ]

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'GET',
      query: {},
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
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

    it('should return 405 for PATCH requests', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept GET requests', async () => {
      req.method = 'GET'
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Basic Listing Functionality', () => {
    it('should return empty array when no properties exist', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        properties: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    })

    it('should return properties with default pagination', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 1,
            totalCount: 2,
          }),
        })
      )
    })

    it('should query with ACTIVE listing status filter', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            listingStatus: ListingStatus.ACTIVE,
          }),
        })
      )
    })

    it('should transform property data correctly', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[0]])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: [
            expect.objectContaining({
              id: 'prop-1',
              streetAddress: '123 Main St',
              location: expect.objectContaining({
                city: 'Hyderabad',
                state: 'Telangana',
                zipcode: '500081',
                locality: 'Madhapur',
              }),
              bedrooms: 3,
              bathrooms: 2,
              price: '5000000',
            }),
          ],
        })
      )
    })

    it('should include related data in query', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            location: expect.any(Object),
            builder: expect.any(Object),
            project: expect.any(Object),
            user: expect.any(Object),
            images: expect.any(Object),
          }),
        })
      )
    })
  })

  describe('Property Type Filtering', () => {
    it('should filter by CONDO property type', async () => {
      req.query = { propertyType: 'CONDO' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'CONDO',
          }),
        })
      )
    })

    it('should filter by SINGLE_FAMILY property type', async () => {
      req.query = { propertyType: 'SINGLE_FAMILY' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'SINGLE_FAMILY',
          }),
        })
      )
    })

    it('should filter by TOWNHOUSE property type', async () => {
      req.query = { propertyType: 'TOWNHOUSE' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'TOWNHOUSE',
          }),
        })
      )
    })

    it('should filter by COMMERCIAL property type', async () => {
      req.query = { propertyType: 'COMMERCIAL' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'COMMERCIAL',
          }),
        })
      )
    })

    it('should map LAND_RESIDENTIAL to LAND property type', async () => {
      req.query = { propertyType: 'LAND_RESIDENTIAL' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'LAND',
          }),
        })
      )
    })

    it('should map LAND_AGRICULTURE to LAND property type', async () => {
      req.query = { propertyType: 'LAND_AGRICULTURE' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'LAND',
          }),
        })
      )
    })
  })

  describe('Listing Type Filtering', () => {
    it('should filter by SALE listing type', async () => {
      req.query = { listingType: 'SALE' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            listingType: 'SALE',
          }),
        })
      )
    })

    it('should filter by RENT listing type', async () => {
      req.query = { listingType: 'RENT' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            listingType: 'RENT',
          }),
        })
      )
    })

    it('should combine property type and listing type filters', async () => {
      req.query = { propertyType: 'CONDO', listingType: 'SALE' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'CONDO',
            listingType: 'SALE',
          }),
        })
      )
    })
  })

  describe('Location Filtering', () => {
    it('should filter by location with streetAddress contains', async () => {
      req.query = { location: 'Main' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                streetAddress: { contains: 'Main', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      )
    })

    it('should filter by location with city contains', async () => {
      req.query = { location: 'Hyderabad' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: { city: { contains: 'Hyderabad', mode: 'insensitive' } },
              }),
            ]),
          }),
        })
      )
    })

    it('should filter by location with state contains', async () => {
      req.query = { location: 'Telangana' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: { state: { contains: 'Telangana', mode: 'insensitive' } },
              }),
            ]),
          }),
        })
      )
    })

    it('should filter by location with locality contains', async () => {
      req.query = { location: 'Madhapur' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: { locality: { contains: 'Madhapur', mode: 'insensitive' } },
              }),
            ]),
          }),
        })
      )
    })

    it('should filter by location with neighborhood contains', async () => {
      req.query = { location: 'Gachibowli' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: { neighborhood: { contains: 'Gachibowli', mode: 'insensitive' } },
              }),
            ]),
          }),
        })
      )
    })

    it('should filter by location with zipcode contains', async () => {
      req.query = { location: '500081' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: { zipcode: { contains: '500081', mode: 'insensitive' } },
              }),
            ]),
          }),
        })
      )
    })

    it('should filter by location with formattedAddress contains', async () => {
      req.query = { location: '123 Main St' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: {
                  formattedAddress: { contains: '123 Main St', mode: 'insensitive' },
                },
              }),
            ]),
          }),
        })
      )
    })

    it('should filter by specific zipcode parameter', async () => {
      req.query = { zipcode: '500081' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: expect.objectContaining({
              zipcode: { contains: '500081' },
            }),
          }),
        })
      )
    })

    it('should handle case-insensitive location search', async () => {
      req.query = { location: 'HYDERABAD' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: { city: { contains: 'HYDERABAD', mode: 'insensitive' } },
              }),
            ]),
          }),
        })
      )
    })
  })

  describe('Bedrooms and Bathrooms Filtering', () => {
    it('should filter by bedrooms count', async () => {
      req.query = { bedrooms: '3' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyDetails: expect.objectContaining({
              AND: expect.arrayContaining([{ path: ['bedrooms'], equals: '3' }]),
            }),
          }),
        })
      )
    })

    it('should filter by bathrooms count', async () => {
      req.query = { bathrooms: '2' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyDetails: expect.objectContaining({
              AND: expect.arrayContaining([{ path: ['bathrooms'], equals: '2' }]),
            }),
          }),
        })
      )
    })

    it('should filter by both bedrooms and bathrooms', async () => {
      req.query = { bedrooms: '4', bathrooms: '3' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyDetails: expect.objectContaining({
              AND: expect.arrayContaining([
                { path: ['bedrooms'], equals: '4' },
                { path: ['bathrooms'], equals: '3' },
              ]),
            }),
          }),
        })
      )
    })

    it('should handle string bedrooms values', async () => {
      req.query = { bedrooms: '5' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyDetails: expect.objectContaining({
              AND: [{ path: ['bedrooms'], equals: '5' }],
            }),
          }),
        })
      )
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort by newest by default', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('should sort by newest when sortBy=newest', async () => {
      req.query = { sortBy: 'newest' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('should sort by oldest when sortBy=oldest', async () => {
      req.query = { sortBy: 'oldest' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      )
    })

    it('should handle price_asc sorting', async () => {
      req.query = { sortBy: 'price_asc' }
      const propsWithPrices = [
        { ...mockProperties[0], propertyDetails: { ...mockProperties[0].propertyDetails, price: '3000000' } },
        { ...mockProperties[1], propertyDetails: { ...mockProperties[1].propertyDetails, price: '5000000' } },
      ]
      ;(prisma.property.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(propsWithPrices)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const result = jsonMock.mock.calls[0][0]
      expect(result.properties[0].price).toBe('3000000')
      expect(result.properties[1].price).toBe('5000000')
    })

    it('should handle price_desc sorting', async () => {
      req.query = { sortBy: 'price_desc' }
      const propsWithPrices = [
        { ...mockProperties[0], propertyDetails: { ...mockProperties[0].propertyDetails, price: '3000000' } },
        { ...mockProperties[1], propertyDetails: { ...mockProperties[1].propertyDetails, price: '5000000' } },
      ]
      ;(prisma.property.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(propsWithPrices)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const result = jsonMock.mock.calls[0][0]
      expect(result.properties[0].price).toBe('5000000')
      expect(result.properties[1].price).toBe('3000000')
    })

    it('should handle properties with missing price when sorting by price', async () => {
      req.query = { sortBy: 'price_asc' }
      const propsWithMissingPrice = [
        { ...mockProperties[0], propertyDetails: { ...mockProperties[0].propertyDetails, price: null } },
        { ...mockProperties[1], propertyDetails: { ...mockProperties[1].propertyDetails, price: '5000000' } },
      ]
      ;(prisma.property.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(propsWithMissingPrice)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Pagination', () => {
    it('should use default pagination values (page=1, limit=12)', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 12,
        })
      )
    })

    it('should handle custom page parameter', async () => {
      req.query = { page: '2' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(24)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 12,
          take: 12,
        })
      )
    })

    it('should handle custom limit parameter', async () => {
      req.query = { limit: '20' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      )
    })

    it('should handle both page and limit parameters', async () => {
      req.query = { page: '3', limit: '10' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      )
    })

    it('should calculate correct pagination metadata', async () => {
      req.query = { page: '2', limit: '10' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(25)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            currentPage: 2,
            totalPages: 3,
            totalCount: 25,
            hasNextPage: true,
            hasPrevPage: true,
          },
        })
      )
    })

    it('should indicate hasNextPage=false on last page', async () => {
      req.query = { page: '3', limit: '10' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(25)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            hasNextPage: false,
          }),
        })
      )
    })

    it('should indicate hasPrevPage=false on first page', async () => {
      req.query = { page: '1', limit: '10' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(25)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            hasPrevPage: false,
          }),
        })
      )
    })

    it('should handle string pagination parameters', async () => {
      req.query = { page: '2', limit: '15' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 15,
        })
      )
    })
  })

  describe('Data Transformation', () => {
    it('should transform property with all fields', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[0]])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: [
            expect.objectContaining({
              id: 'prop-1',
              streetAddress: '123 Main St',
              builder: 'ABC Builders',
              project: 'Beautiful Apartment',
              propertyType: 'CONDO',
              listingType: 'SALE',
              bedrooms: 3,
              bathrooms: 2,
              price: '5000000',
            }),
          ],
        })
      )
    })

    it('should handle property without builder', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[1]])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: [expect.objectContaining({ builder: 'Independent' })],
        })
      )
    })

    it('should use thumbnailUrl when available', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[0]])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: [
            expect.objectContaining({ thumbnailUrl: 'https://example.com/thumb1.jpg' }),
          ],
        })
      )
    })

    it('should fallback to first image when thumbnailUrl is null', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[1]])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: [expect.objectContaining({ thumbnailUrl: 'https://example.com/img2.jpg' })],
        })
      )
    })

    it('should create full address from location fields', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[0]])

      await handler(req as NextApiRequest, res as NextApiResponse)

      const result = jsonMock.mock.calls[0][0]
      expect(result.properties[0].location.fullAddress).toContain('123 Main St')
      expect(result.properties[0].location.fullAddress).toContain('Hyderabad')
      expect(result.properties[0].location.fullAddress).toContain('Telangana')
    })

    it('should include user details in transformed property', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[0]])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: [
            expect.objectContaining({
              postedBy: 'John Doe',
              companyName: 'ABC Realty',
              userId: 'user-1',
              userEmail: 'john@example.com',
            }),
          ],
        })
      )
    })
  })

  describe('Complex Filtering Scenarios', () => {
    it('should combine all filter types', async () => {
      req.query = {
        propertyType: 'CONDO',
        listingType: 'SALE',
        bedrooms: '3',
        bathrooms: '2',
        location: 'Hyderabad',
        zipcode: '500081',
      }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            listingStatus: ListingStatus.ACTIVE,
            propertyType: 'CONDO',
            listingType: 'SALE',
            propertyDetails: expect.any(Object),
          }),
        })
      )
    })

    it('should handle filtering with pagination', async () => {
      req.query = {
        propertyType: 'SINGLE_FAMILY',
        page: '2',
        limit: '5',
      }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(15)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'SINGLE_FAMILY',
          }),
          skip: 5,
          take: 5,
        })
      )
    })

    it('should handle filtering with sorting', async () => {
      req.query = {
        propertyType: 'CONDO',
        sortBy: 'oldest',
      }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: 'CONDO',
          }),
          orderBy: { createdAt: 'asc' },
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid page number gracefully', async () => {
      req.query = { page: 'invalid' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle invalid limit number gracefully', async () => {
      req.query = { limit: 'invalid' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle empty location string', async () => {
      req.query = { location: '' }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property with missing propertyDetails', async () => {
      const propWithoutDetails = {
        ...mockProperties[0],
        propertyDetails: null,
      }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([propWithoutDetails])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property with missing location fields', async () => {
      const propWithPartialLocation = {
        ...mockProperties[0],
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          zipcode: null,
          locality: null,
        },
      }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([propWithPartialLocation])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property with no images', async () => {
      const propWithoutImages = {
        ...mockProperties[0],
        images: [],
        thumbnailUrl: null,
      }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([propWithoutImages])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle database count error', async () => {
      ;(prisma.property.count as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle database findMany error', async () => {
      ;(prisma.property.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.property.findMany as jest.Mock).mockRejectedValue(new Error('Query failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle unexpected errors during transformation', async () => {
      const invalidProperty = {
        ...mockProperties[0],
        location: null,
      }
      ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([invalidProperty])

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })
  })
})
