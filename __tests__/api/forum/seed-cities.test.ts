import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/seed-cities'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    forumCategory: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/forum/seed-cities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/forum/seed-cities', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Unauthorized',
      })
    })

    it('should return 401 when session has no user email', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: {} })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return 403 when user is not admin', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: false,
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Forbidden - Admin access required',
      })
    })

    it('should allow admin users to seed cities', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should create General Discussions if not exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(prisma.forumCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'general-discussions',
          }),
        })
      )
    })

    it('should skip cities that already exist', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-city-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should create property types for new cities', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const propertyTypeCalls = createCalls.filter(call => call[0].data.propertyType !== undefined)
      expect(propertyTypeCalls.length).toBeGreaterThan(0)
    })

    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should handle database errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should create Gurgaon city', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockImplementation(args => {
        if (args.where.slug === 'gurgaon') {
          return Promise.resolve(null)
        }
        return Promise.resolve({ id: 'existing-id' })
      })
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const gurgaonCall = createCalls.find(call => call[0].data.slug === 'gurgaon')
      expect(gurgaonCall).toBeDefined()
    })

    it('should create Noida city', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const noidaCall = createCalls.find(call => call[0].data.slug === 'noida')
      expect(noidaCall).toBeDefined()
    })

    it('should create Pune city', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const puneCall = createCalls.find(call => call[0].data.slug === 'pune')
      expect(puneCall).toBeDefined()
    })

    it('should create Other Cities category', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const otherCitiesCall = createCalls.find(call => call[0].data.slug === 'other-cities')
      expect(otherCitiesCall).toBeDefined()
    })

    it('should return cities in response', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: true,
      })
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
        name: 'Gurgaon',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.cities).toBeDefined()
      expect(Array.isArray(data.cities)).toBe(true)
    })

    it('should verify user admin status', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isAdmin: false,
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        select: { isAdmin: true },
      })
    })
  })
})
