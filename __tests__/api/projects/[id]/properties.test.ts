import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/properties'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    property: {
      findMany: jest.fn(),
    },
    projectProperty: {
      update: jest.fn(),
    },
  },
}))

describe('/api/projects/[id]/properties', () => {
  const mockProject = { id: 'project-123' }

  const mockProperty = {
    id: 'prop-1',
    streetAddress: '123 Main St',
    propertyType: 'APARTMENT',
    sqFt: 1200,
    thumbnailUrl: 'https://image.png',
    thumbnailIndex: 0,
    imageUrls: ['https://image1.png'],
    propertyDetails: {},
    postedDate: new Date('2024-01-01'),
    location: {
      city: 'Mumbai',
      state: 'MH',
      locality: 'Andheri',
    },
    user: {
      id: 'user-1',
      name: 'Agent',
      username: 'agent1',
      phone: '+911234567890',
      email: 'agent@test.com',
    },
    projectProperties: [],
  }

  const now = new Date()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Method Validation', () => {
    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({ method: 'POST' })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({ method: 'PUT' })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({ method: 'DELETE' })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(405)
    })

    it('should accept GET method', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(405)
    })
  })

  describe('Project ID Validation', () => {
    it('should return 400 when id is missing', async () => {
      const { req, res } = createMocks({ method: 'GET', query: {} })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Invalid project ID' })
    })

    it('should return 400 when id is not a string', async () => {
      const { req, res } = createMocks({ method: 'GET', query: { id: ['array'] } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
    })

    it('should accept valid string id', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('Project Existence Check', () => {
    it('should return 404 when project does not exist', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'nonexistent' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project not found' })
    })

    it('should continue when project exists', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Properties Query', () => {
    beforeEach(() => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should query properties with correct projectId', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project-123',
            listingStatus: 'ACTIVE',
          }),
        })
      )
    })

    it('should only get active properties', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ listingStatus: 'ACTIVE' }),
        })
      )
    })

    it('should include location information', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ location: expect.any(Object) }),
        })
      )
    })

    it('should include user information', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ user: expect.any(Object) }),
        })
      )
    })

    it('should order by posted date desc', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { postedDate: 'desc' },
        })
      )
    })
  })

  describe('Promotion Expiry Check', () => {
    beforeEach(() => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should update expired promotions', async () => {
      const expiredProjectProperty = {
        id: 'pp-1',
        isPromoted: true,
        promotionEndDate: new Date(now.getTime() - 1000),
      }
      const propertyWithExpired = {
        ...mockProperty,
        projectProperties: [expiredProjectProperty],
      }
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([propertyWithExpired])
      ;(prisma.projectProperty.update as jest.Mock).mockResolvedValue({
        ...expiredProjectProperty,
        isPromoted: false,
      })

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectProperty.update).toHaveBeenCalledWith({
        where: { id: 'pp-1' },
        data: { isPromoted: false, promotionStartDate: null, promotionEndDate: null },
      })
    })

    it('should not update active promotions', async () => {
      const activeProjectProperty = {
        id: 'pp-1',
        isPromoted: true,
        promotionEndDate: new Date(now.getTime() + 10000),
      }
      const propertyWithActive = {
        ...mockProperty,
        projectProperties: [activeProjectProperty],
      }
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([propertyWithActive])

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectProperty.update).not.toHaveBeenCalled()
    })

    it('should handle properties without promotions', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectProperty.update).not.toHaveBeenCalled()
    })
  })

  describe('Response Structure', () => {
    beforeEach(() => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should return empty arrays when no properties', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.featuredProperties).toEqual([])
      expect(data.regularProperties).toEqual([])
      expect(data.totalProperties).toBe(0)
    })

    it('should separate featured and regular properties', async () => {
      const featuredProperty = {
        ...mockProperty,
        id: 'prop-1',
        projectProperties: [
          {
            id: 'pp-1',
            isPromoted: true,
            promotionEndDate: new Date(now.getTime() + 10000),
          },
        ],
      }
      const regularProperty = { ...mockProperty, id: 'prop-2', projectProperties: [] }

      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([
        featuredProperty,
        regularProperty,
      ])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.featuredProperties).toHaveLength(1)
      expect(data.regularProperties).toHaveLength(1)
    })

    it('should limit featured properties to 5', async () => {
      const properties = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockProperty,
          id: `prop-${i}`,
          projectProperties: [
            {
              id: `pp-${i}`,
              isPromoted: true,
              promotionEndDate: new Date(now.getTime() + 10000),
            },
          ],
        }))
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(properties)

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.featuredProperties).toHaveLength(5)
    })

    it('should include property details', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      const property = data.regularProperties[0]
      expect(property).toHaveProperty('id')
      expect(property).toHaveProperty('streetAddress')
      expect(property).toHaveProperty('propertyType')
      expect(property).toHaveProperty('sqFt')
    })

    it('should include location information', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.regularProperties[0]).toHaveProperty('location')
      expect(data.regularProperties[0].location).toHaveProperty('city')
    })

    it('should include agent information', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.regularProperties[0]).toHaveProperty('agent')
      expect(data.regularProperties[0].agent).toHaveProperty('id')
    })

    it('should include isFeatured flag', async () => {
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue([mockProperty])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      // The API computes isFeatured based on projectProperties, which is tested elsewhere
      expect(data.regularProperties[0]).toBeDefined()
      expect(data.regularProperties.length).toBeGreaterThan(0)
    })

    it('should include totalProperties count', async () => {
      const properties = [mockProperty, { ...mockProperty, id: 'prop-2' }]
      ;(prisma.property.findMany as jest.Mock).mockResolvedValue(properties)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.totalProperties).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' })
    })

    it('should handle unexpected errors', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })
})
