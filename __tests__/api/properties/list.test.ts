import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/properties/list'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('/api/properties/list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    })
  })

  it('returns properties with pagination', async () => {
    const mockProperties = [
      {
        id: '1',
        streetAddress: '123 Test St',
        propertyType: 'CONDO',
        listingType: 'SALE',
        sqFt: 1500,
        price: 5000000,
        thumbnailUrl: 'https://example.com/image.jpg',
        imageUrls: [],
        listingStatus: 'ACTIVE',
        createdAt: new Date(),
        userId: 'user-1',
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          zipcode: '500072',
          locality: 'Kukatpally',
        },
        builder: { name: 'Test Builder' },
        project: { name: 'Test Project' },
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          companyName: null,
        },
        images: [],
        propertyDetails: {
          bedrooms: '3',
          bathrooms: '2',
          price: '5000000',
        },
      },
    ]

    ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties)

    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.properties).toHaveLength(1)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.totalCount).toBe(1)
  })

  it('filters properties by location (city)', async () => {
    ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        location: 'Hyderabad',
      },
    })

    await handler(req, res)

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              location: {
                city: {
                  contains: 'Hyderabad',
                  mode: 'insensitive',
                },
              },
            }),
          ]),
        }),
      })
    )
  })

  it('filters properties by location (neighborhood)', async () => {
    ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        location: 'Kukatpally',
      },
    })

    await handler(req, res)

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              location: {
                neighborhood: {
                  contains: 'Kukatpally',
                  mode: 'insensitive',
                },
              },
            }),
          ]),
        }),
      })
    )
  })

  it('filters properties by location (zipcode)', async () => {
    ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        location: '500072',
      },
    })

    await handler(req, res)

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              location: {
                zipcode: {
                  contains: '500072',
                  mode: 'insensitive',
                },
              },
            }),
          ]),
        }),
      })
    )
  })

  it('filters properties by type', async () => {
    ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        propertyType: 'CONDO',
      },
    })

    await handler(req, res)

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyType: 'CONDO',
        }),
      })
    )
  })

  it('filters properties by listing type (SALE/RENT)', async () => {
    ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        listingType: 'SALE',
      },
    })

    await handler(req, res)

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          listingType: 'SALE',
        }),
      })
    )
  })

  it('sorts properties by newest first', async () => {
    ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        sortBy: 'newest',
      },
    })

    await handler(req, res)

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('paginates results correctly', async () => {
    ;(prisma.property.count as jest.Mock).mockResolvedValue(50)
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        page: '2',
        limit: '12',
      },
    })

    await handler(req, res)

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 12, // (page 2 - 1) * 12
        take: 12,
      })
    )
  })

  it('handles errors gracefully', async () => {
    ;(prisma.property.count as jest.Mock).mockRejectedValue(new Error('Database error'))

    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    })
  })
})
