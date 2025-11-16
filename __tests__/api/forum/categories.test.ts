import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/categories'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    forumCategory: {
      findMany: jest.fn(),
    },
  },
}))

describe('/api/forum/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/forum/categories', () => {
    it('should return active root categories with children', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Category 1',
          slug: 'category-1',
          description: 'Description 1',
          displayOrder: 1,
          isActive: true,
          parentId: null,
          children: [
            {
              id: 'cat1-child1',
              name: 'Child 1',
              slug: 'child-1',
              displayOrder: 1,
              isActive: true,
              children: [],
              _count: { posts: 5 },
            },
          ],
          _count: { posts: 10 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual(mockCategories)
      expect(prisma.forumCategory.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          parentId: null,
        },
        include: {
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
              },
              _count: {
                select: { posts: true },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { displayOrder: 'asc' },
      })
    })

    it('should return empty array when no categories exist', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual([])
    })

    it('should return only active categories', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Active Category',
          slug: 'active-category',
          isActive: true,
          parentId: null,
          children: [],
          _count: { posts: 5 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data).toHaveLength(1)
      expect(data[0].isActive).toBe(true)
    })

    it('should return categories sorted by displayOrder', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Category 1',
          displayOrder: 1,
          children: [],
          _count: { posts: 0 },
        },
        {
          id: 'cat2',
          name: 'Category 2',
          displayOrder: 2,
          children: [],
          _count: { posts: 0 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data[0].displayOrder).toBeLessThanOrEqual(data[1].displayOrder)
    })

    it('should include nested children up to 3 levels', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Root',
          children: [
            {
              id: 'cat2',
              name: 'Level 1',
              children: [
                {
                  id: 'cat3',
                  name: 'Level 2',
                  _count: { posts: 1 },
                },
              ],
              _count: { posts: 2 },
            },
          ],
          _count: { posts: 3 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data[0].children).toBeDefined()
      expect(data[0].children[0].children).toBeDefined()
    })

    it('should include post counts for each category', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Category with posts',
          children: [],
          _count: { posts: 42 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data[0]._count.posts).toBe(42)
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
      })
    })

    it('should return categories with no children', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Leaf Category',
          children: [],
          _count: { posts: 0 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data[0].children).toEqual([])
    })
  })

  describe('Method validation', () => {
    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method POST not allowed',
      })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method PUT not allowed',
      })
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method DELETE not allowed',
      })
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method PATCH not allowed',
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle categories with special characters in names', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: "Category & Sub's <Category>",
          slug: 'category-subs-category',
          children: [],
          _count: { posts: 0 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data[0].name).toContain('&')
      expect(data[0].name).toContain('<')
    })

    it('should handle large number of categories', async () => {
      const mockCategories = Array.from({ length: 100 }, (_, i) => ({
        id: `cat${i}`,
        name: `Category ${i}`,
        slug: `category-${i}`,
        displayOrder: i,
        children: [],
        _count: { posts: i },
      }))

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data).toHaveLength(100)
    })

    it('should handle categories with null descriptions', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Category',
          slug: 'category',
          description: null,
          children: [],
          _count: { posts: 0 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data[0].description).toBeNull()
    })

    it('should handle timeout errors', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockRejectedValue(new Error('Timeout'))

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should handle connection errors', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockRejectedValue(
        new Error('Connection refused')
      )

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Response structure', () => {
    it('should return proper JSON structure', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Category',
          slug: 'category',
          children: [],
          _count: { posts: 0 },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(() => JSON.parse(res._getData())).not.toThrow()
    })

    it('should return array response', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(Array.isArray(JSON.parse(res._getData()))).toBe(true)
    })
  })
})
