import { ProjectType } from '@prisma/client'
import {
  searchProperties,
  getPropertyById,
  getUserListings,
  getUserSavedProperties,
  batchCreatePropertyImages,
  getRecentListings,
  countProperties,
} from '@/lib/cockroachDB/queries'

// Mock the prisma client
jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    savedProperty: {
      findMany: jest.fn(),
    },
    propertyImage: {
      createMany: jest.fn(),
    },
  },
}))

const { prisma } = require('@/lib/cockroachDB/prisma')

describe('Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchProperties', () => {
    it('searches properties with city and state', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          streetAddress: '123 Main St',
          imageUrls: ['img1.jpg'],
          thumbnailIndex: 0,
          createdAt: new Date(),
          location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
          project: { id: 'proj1', type: 'APARTMENT', numberOfUnits: 10 },
        },
      ]

      prisma.property.findMany.mockResolvedValue(mockProperties)

      const result = await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: expect.objectContaining({
              city: 'Mumbai',
              state: 'Maharashtra',
            }),
          }),
        })
      )
      expect(result).toEqual(mockProperties)
    })

    it('searches properties with city, state, and locality', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
        locality: 'Andheri',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: expect.objectContaining({
              city: 'Mumbai',
              state: 'Maharashtra',
            }),
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: expect.objectContaining({
                  locality: expect.objectContaining({ contains: 'Andheri' }),
                }),
              }),
            ]),
          }),
        })
      )
    })

    it('searches properties with general location string', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        location: 'Mumbai',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: expect.objectContaining({
                  city: expect.objectContaining({ contains: 'Mumbai' }),
                }),
              }),
            ]),
          }),
        })
      )
    })

    it('respects limit parameter', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
        limit: 10,
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('respects offset parameter', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
        offset: 20,
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
        })
      )
    })

    it('uses default country as India', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: expect.objectContaining({
              country: 'India',
            }),
          }),
        })
      )
    })

    it('allows custom country', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'New York',
        state: 'NY',
        country: 'USA',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: expect.objectContaining({
              country: 'USA',
            }),
          }),
        })
      )
    })

    it('uses default limit of 20', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      )
    })

    it('orders by createdAt descending', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }],
        })
      )
    })

    it('selects only required fields', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            streetAddress: true,
            imageUrls: true,
            thumbnailIndex: true,
            createdAt: true,
            location: expect.any(Object),
            project: expect.any(Object),
          }),
        })
      )
    })

    it('performs case-insensitive search', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await searchProperties({
        location: 'mumbai',
      })

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                location: expect.objectContaining({
                  city: expect.objectContaining({ mode: 'insensitive' }),
                }),
              }),
            ]),
          }),
        })
      )
    })
  })

  describe('getPropertyById', () => {
    it('fetches property by ID', async () => {
      const mockProperty = {
        id: 'prop1',
        streetAddress: '123 Main St',
        user: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
        location: { city: 'Mumbai', state: 'Maharashtra' },
        project: { id: 'proj1', type: 'APARTMENT' },
        images: [],
      }

      prisma.property.findUnique.mockResolvedValue(mockProperty)

      const result = await getPropertyById('prop1')

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'prop1' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              licenseNumber: true,
            },
          },
          location: true,
          project: true,
          images: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      })
      expect(result).toEqual(mockProperty)
    })

    it('includes user information', async () => {
      prisma.property.findUnique.mockResolvedValue({})

      await getPropertyById('prop1')

      expect(prisma.property.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.any(Object),
          }),
        })
      )
    })

    it('includes location information', async () => {
      prisma.property.findUnique.mockResolvedValue({})

      await getPropertyById('prop1')

      expect(prisma.property.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            location: true,
          }),
        })
      )
    })

    it('includes project information', async () => {
      prisma.property.findUnique.mockResolvedValue({})

      await getPropertyById('prop1')

      expect(prisma.property.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            project: true,
          }),
        })
      )
    })

    it('orders images by display order', async () => {
      prisma.property.findUnique.mockResolvedValue({})

      await getPropertyById('prop1')

      expect(prisma.property.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            images: {
              orderBy: { displayOrder: 'asc' },
            },
          }),
        })
      )
    })

    it('returns null for non-existent property', async () => {
      prisma.property.findUnique.mockResolvedValue(null)

      const result = await getPropertyById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUserListings', () => {
    it('fetches user listings by user ID', async () => {
      const mockListings = [
        {
          id: 'prop1',
          streetAddress: '123 Main St',
          imageUrls: [],
          thumbnailIndex: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          location: { city: 'Mumbai', state: 'Maharashtra', zipcode: '400001' },
        },
      ]

      prisma.property.findMany.mockResolvedValue(mockListings)

      const result = await getUserListings('user1')

      expect(prisma.property.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        select: {
          id: true,
          streetAddress: true,
          imageUrls: true,
          thumbnailIndex: true,
          createdAt: true,
          updatedAt: true,
          location: {
            select: {
              city: true,
              state: true,
              zipcode: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
      expect(result).toEqual(mockListings)
    })

    it('orders listings by updatedAt descending', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await getUserListings('user1')

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        })
      )
    })

    it('selects only required fields', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await getUserListings('user1')

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            streetAddress: true,
            imageUrls: true,
            thumbnailIndex: true,
            createdAt: true,
            updatedAt: true,
            location: expect.any(Object),
          }),
        })
      )
    })
  })

  describe('getUserSavedProperties', () => {
    it('fetches saved properties by user ID', async () => {
      const mockSaved = [
        {
          property: {
            id: 'prop1',
            streetAddress: '123 Main St',
            imageUrls: [],
            thumbnailIndex: 0,
            location: { city: 'Mumbai', state: 'Maharashtra', zipcode: '400001' },
            project: { type: 'APARTMENT', numberOfUnits: 10 },
          },
          createdAt: new Date(),
        },
      ]

      prisma.savedProperty.findMany.mockResolvedValue(mockSaved)

      const result = await getUserSavedProperties('user1')

      expect(prisma.savedProperty.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          property: {
            select: {
              id: true,
              streetAddress: true,
              imageUrls: true,
              thumbnailIndex: true,
              location: {
                select: {
                  city: true,
                  state: true,
                  zipcode: true,
                },
              },
              project: {
                select: {
                  type: true,
                  numberOfUnits: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockSaved)
    })

    it('orders by createdAt descending', async () => {
      prisma.savedProperty.findMany.mockResolvedValue([])

      await getUserSavedProperties('user1')

      expect(prisma.savedProperty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('includes property details', async () => {
      prisma.savedProperty.findMany.mockResolvedValue([])

      await getUserSavedProperties('user1')

      expect(prisma.savedProperty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            property: expect.any(Object),
          }),
        })
      )
    })
  })

  describe('batchCreatePropertyImages', () => {
    it('creates multiple property images in batch', async () => {
      const images = [
        { imageUrl: 'img1.jpg', altText: 'Image 1', displayOrder: 0 },
        { imageUrl: 'img2.jpg', altText: 'Image 2', displayOrder: 1 },
        { imageUrl: 'img3.jpg', displayOrder: 2 },
      ]

      prisma.propertyImage.createMany.mockResolvedValue({ count: 3 })

      const result = await batchCreatePropertyImages('prop1', images)

      expect(prisma.propertyImage.createMany).toHaveBeenCalledWith({
        data: [
          { propertyId: 'prop1', imageUrl: 'img1.jpg', altText: 'Image 1', displayOrder: 0 },
          { propertyId: 'prop1', imageUrl: 'img2.jpg', altText: 'Image 2', displayOrder: 1 },
          { propertyId: 'prop1', imageUrl: 'img3.jpg', displayOrder: 2 },
        ],
      })
      expect(result).toEqual({ count: 3 })
    })

    it('handles empty image array', async () => {
      prisma.propertyImage.createMany.mockResolvedValue({ count: 0 })

      const result = await batchCreatePropertyImages('prop1', [])

      expect(prisma.propertyImage.createMany).toHaveBeenCalledWith({
        data: [],
      })
      expect(result).toEqual({ count: 0 })
    })

    it('associates images with property ID', async () => {
      const images = [{ imageUrl: 'img1.jpg', displayOrder: 0 }]

      prisma.propertyImage.createMany.mockResolvedValue({ count: 1 })

      await batchCreatePropertyImages('prop123', images)

      expect(prisma.propertyImage.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            propertyId: 'prop123',
          }),
        ]),
      })
    })

    it('preserves display order', async () => {
      const images = [
        { imageUrl: 'img1.jpg', displayOrder: 5 },
        { imageUrl: 'img2.jpg', displayOrder: 10 },
      ]

      prisma.propertyImage.createMany.mockResolvedValue({ count: 2 })

      await batchCreatePropertyImages('prop1', images)

      expect(prisma.propertyImage.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ displayOrder: 5 }),
          expect.objectContaining({ displayOrder: 10 }),
        ]),
      })
    })
  })

  describe('getRecentListings', () => {
    it('fetches recent listings with default limit', async () => {
      const mockListings = [
        {
          id: 'prop1',
          streetAddress: '123 Main St',
          imageUrls: [],
          thumbnailIndex: 0,
          createdAt: new Date(),
          location: { city: 'Mumbai', state: 'Maharashtra', zipcode: '400001' },
          project: { type: 'APARTMENT', numberOfUnits: 10 },
        },
      ]

      prisma.property.findMany.mockResolvedValue(mockListings)

      const result = await getRecentListings()

      expect(prisma.property.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 12,
      })
      expect(result).toEqual(mockListings)
    })

    it('respects custom limit', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await getRecentListings(5)

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      )
    })

    it('orders by createdAt descending', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await getRecentListings()

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('selects optimized fields for homepage', async () => {
      prisma.property.findMany.mockResolvedValue([])

      await getRecentListings()

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            streetAddress: true,
            imageUrls: true,
            thumbnailIndex: true,
            createdAt: true,
            location: expect.any(Object),
            project: expect.any(Object),
          }),
        })
      )
    })
  })

  describe('countProperties', () => {
    it('counts properties with city and state filters', async () => {
      prisma.property.count.mockResolvedValue(42)

      const result = await countProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
      })

      expect(prisma.property.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          location: expect.objectContaining({
            city: 'Mumbai',
            state: 'Maharashtra',
          }),
        }),
      })
      expect(result).toBe(42)
    })

    it('counts properties with locality filter', async () => {
      prisma.property.count.mockResolvedValue(10)

      await countProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
        locality: 'Andheri',
      })

      expect(prisma.property.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              location: expect.objectContaining({
                locality: expect.objectContaining({ contains: 'Andheri' }),
              }),
            }),
          ]),
        }),
      })
    })

    it('counts properties with general location filter', async () => {
      prisma.property.count.mockResolvedValue(15)

      await countProperties({
        location: 'Mumbai',
      })

      expect(prisma.property.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              location: expect.objectContaining({
                city: expect.objectContaining({ contains: 'Mumbai' }),
              }),
            }),
          ]),
        }),
      })
    })

    it('counts properties with project type filter', async () => {
      prisma.property.count.mockResolvedValue(20)

      await countProperties({
        city: 'Mumbai',
        state: 'Maharashtra',
        projectType: 'APARTMENT' as ProjectType,
      })

      expect(prisma.property.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          project: {
            type: 'APARTMENT',
          },
        }),
      })
    })

    it('counts properties with country filter', async () => {
      prisma.property.count.mockResolvedValue(100)

      await countProperties({
        city: 'New York',
        state: 'NY',
        country: 'USA',
      })

      expect(prisma.property.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          location: expect.objectContaining({
            country: 'USA',
          }),
        }),
      })
    })

    it('handles empty filters', async () => {
      prisma.property.count.mockResolvedValue(1000)

      const result = await countProperties({})

      expect(prisma.property.count).toHaveBeenCalled()
      expect(result).toBe(1000)
    })

    it('performs case-insensitive count', async () => {
      prisma.property.count.mockResolvedValue(5)

      await countProperties({
        location: 'mumbai',
      })

      expect(prisma.property.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              location: expect.objectContaining({
                city: expect.objectContaining({ mode: 'insensitive' }),
              }),
            }),
          ]),
        }),
      })
    })
  })

  describe('Error Handling', () => {
    it('handles database errors in searchProperties', async () => {
      prisma.property.findMany.mockRejectedValue(new Error('Database error'))

      await expect(searchProperties({ city: 'Mumbai', state: 'Maharashtra' })).rejects.toThrow(
        'Database error'
      )
    })

    it('handles database errors in getPropertyById', async () => {
      prisma.property.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(getPropertyById('prop1')).rejects.toThrow('Database error')
    })

    it('handles database errors in getUserListings', async () => {
      prisma.property.findMany.mockRejectedValue(new Error('Database error'))

      await expect(getUserListings('user1')).rejects.toThrow('Database error')
    })

    it('handles database errors in getUserSavedProperties', async () => {
      prisma.savedProperty.findMany.mockRejectedValue(new Error('Database error'))

      await expect(getUserSavedProperties('user1')).rejects.toThrow('Database error')
    })

    it('handles database errors in batchCreatePropertyImages', async () => {
      prisma.propertyImage.createMany.mockRejectedValue(new Error('Database error'))

      await expect(batchCreatePropertyImages('prop1', [])).rejects.toThrow('Database error')
    })

    it('handles database errors in getRecentListings', async () => {
      prisma.property.findMany.mockRejectedValue(new Error('Database error'))

      await expect(getRecentListings()).rejects.toThrow('Database error')
    })

    it('handles database errors in countProperties', async () => {
      prisma.property.count.mockRejectedValue(new Error('Database error'))

      await expect(countProperties({})).rejects.toThrow('Database error')
    })
  })
})
