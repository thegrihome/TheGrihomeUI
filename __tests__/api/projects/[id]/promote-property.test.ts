import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/promote-property'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
    },
    projectProperty: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/projects/[id]/promote-property', () => {
  const mockSession = {
    user: { email: 'test@example.com' },
  }

  const mockUser = {
    id: 'user-123',
  }

  const mockProperty = {
    id: 'property-123',
    projectId: 'project-123',
    userId: 'user-123',
    listingStatus: 'ACTIVE',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({ method: 'GET' })
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

    it('should accept POST method', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(405)
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' })
    })

    it('should return 401 when no user email', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: {} })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('Project ID Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when id is missing', async () => {
      const { req, res } = createMocks({ method: 'POST', query: {}, body: { propertyId: 'prop-1' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Invalid project ID' })
    })

    it('should return 400 when id is not a string', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: ['array'] },
        body: { propertyId: 'prop-1' },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('Property ID Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when propertyId is missing', async () => {
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' }, body: {} })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Property ID is required' })
    })

    it('should accept valid propertyId', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(null)
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123' },
      })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('Duration Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
      ;(prisma.projectProperty.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectProperty.create as jest.Mock).mockResolvedValue({ id: 'pp-1' })
    })

    it('should use default duration of 30 days', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123' },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
    })

    it('should return 400 when duration less than 1', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123', duration: 0 },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Duration must be between 1 and 365 days',
      })
    })

    it('should return 400 when duration greater than 365', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123', duration: 366 },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('Property Ownership Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    })

    it('should return 403 when property not found', async () => {
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(null)
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123' },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Property not found or you do not have permission to promote it',
      })
    })

    it('should verify property ownership', async () => {
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
      ;(prisma.projectProperty.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectProperty.create as jest.Mock).mockResolvedValue({ id: 'pp-1' })
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123' },
      })
      await handler(req, res)

      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'property-123',
          projectId: 'project-123',
          userId: 'user-123',
          listingStatus: 'ACTIVE',
        },
      })
    })
  })

  describe('Create ProjectProperty', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
      ;(prisma.projectProperty.findUnique as jest.Mock).mockResolvedValue(null)
    })

    it('should create new projectProperty record', async () => {
      ;(prisma.projectProperty.create as jest.Mock).mockResolvedValue({ id: 'pp-1' })
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123', duration: 30 },
      })
      await handler(req, res)

      expect(prisma.projectProperty.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-123',
          propertyId: 'property-123',
          isPromoted: true,
          promotionPaymentAmount: 0,
        }),
      })
    })
  })

  describe('Update ProjectProperty', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
    })

    it('should update existing projectProperty', async () => {
      const existingProjectProperty = { id: 'pp-1', isPromoted: false }
      ;(prisma.projectProperty.findUnique as jest.Mock).mockResolvedValue(existingProjectProperty)
      ;(prisma.projectProperty.update as jest.Mock).mockResolvedValue({
        ...existingProjectProperty,
        isPromoted: true,
      })
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123', duration: 30 },
      })
      await handler(req, res)

      expect(prisma.projectProperty.update).toHaveBeenCalledWith({
        where: { id: 'pp-1' },
        data: expect.objectContaining({
          isPromoted: true,
          promotionPaymentAmount: 0,
        }),
      })
    })
  })

  describe('Success Response', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
      ;(prisma.projectProperty.findUnique as jest.Mock).mockResolvedValue(null)
    })

    it('should return 200 on success', async () => {
      ;(prisma.projectProperty.create as jest.Mock).mockResolvedValue({ id: 'pp-1' })
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should return success message and promotion details', async () => {
      const now = new Date()
      const mockProjectProperty = {
        id: 'pp-1',
        promotionStartDate: now,
        promotionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        promotionPaymentAmount: 0,
      }
      ;(prisma.projectProperty.create as jest.Mock).mockResolvedValue(mockProjectProperty)
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123' },
      })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Property promoted successfully')
      expect(data.promotion).toHaveProperty('id')
      expect(data.promotion).toHaveProperty('startDate')
      expect(data.promotion).toHaveProperty('endDate')
      expect(data.promotion).toHaveProperty('totalAmount')
      expect(data.promotion).toHaveProperty('totalDays')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { propertyId: 'property-123' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' })
    })
  })
})
