import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/search'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    forumPost: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    forumCategory: {
      findMany: jest.fn(),
    },
  },
}))

describe('/api/forum/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/forum/search', () => {
    it('should return search results for valid query', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: 'Test Post',
          content: 'Test content',
          slug: 'test-post',
          author: { id: 'user1', username: 'testuser', image: null },
          category: {
            name: 'Category',
            slug: 'category',
            city: 'delhi',
            propertyType: 'VILLAS',
          },
          _count: { replies: 5, reactions: 10 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.query).toBe('test')
      expect(data.posts).toEqual(mockPosts)
      expect(data.categories).toEqual([])
    })

    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { q: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Method not allowed',
      })
    })

    it('should return 400 when query parameter is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Query parameter is required',
      })
    })

    it('should return 400 when query is not a string', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { q: ['array', 'value'] },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Query parameter is required',
      })
    })

    it('should return 400 when query is too short', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'a' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Query must be at least 2 characters',
      })
    })

    it('should trim whitespace from query', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: '  test  ' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.query).toBe('test')
    })

    it('should search in post titles and content', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { content: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })

    it('should support pagination with page parameter', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts', page: '2', limit: '10' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })

    it('should use default pagination values', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.currentPage).toBe(1)
    })

    it('should search posts only when type is "posts"', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalled()
      expect(prisma.forumCategory.findMany).not.toHaveBeenCalled()
    })

    it('should search categories only when type is "categories"', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'categories' },
      })

      await handler(req, res)

      expect(prisma.forumCategory.findMany).toHaveBeenCalled()
      expect(prisma.forumPost.findMany).not.toHaveBeenCalled()
    })

    it('should search both posts and categories when type is "all"', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'all' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalled()
      expect(prisma.forumCategory.findMany).toHaveBeenCalled()
    })

    it('should default to "all" when type is not specified', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalled()
      expect(prisma.forumCategory.findMany).toHaveBeenCalled()
    })

    it('should filter by categoryId when provided', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', categoryId: 'cat123' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat123',
          }),
        })
      )
    })

    it('should filter by city when provided', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', city: 'delhi' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: {
              city: 'delhi',
            },
          }),
        })
      )
    })

    it('should include author information in results', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: 'Test',
          author: {
            id: 'user1',
            username: 'testuser',
            image: 'http://example.com/avatar.jpg',
          },
          category: { name: 'Cat', slug: 'cat' },
          _count: { replies: 0, reactions: 0 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.posts[0].author).toBeDefined()
      expect(data.posts[0].author.username).toBe('testuser')
    })

    it('should include category information in post results', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: 'Test',
          author: { id: 'user1', username: 'testuser', image: null },
          category: {
            name: 'Test Category',
            slug: 'test-category',
            city: 'delhi',
            propertyType: 'APARTMENTS',
          },
          _count: { replies: 0, reactions: 0 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.posts[0].category.name).toBe('Test Category')
      expect(data.posts[0].category.city).toBe('delhi')
    })

    it('should include reply and reaction counts', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: 'Test',
          author: { id: 'user1', username: 'testuser', image: null },
          category: { name: 'Cat', slug: 'cat' },
          _count: { replies: 15, reactions: 25 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.posts[0]._count.replies).toBe(15)
      expect(data.posts[0]._count.reactions).toBe(25)
    })

    it('should calculate total pages correctly', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(45)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts', limit: '20' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.totalPages).toBe(3) // 45 / 20 = 2.25 -> 3
    })

    it('should search categories by name and description', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'categories' },
      })

      await handler(req, res)

      expect(prisma.forumCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })

    it('should only return active categories', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'categories' },
      })

      await handler(req, res)

      expect(prisma.forumCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      )
    })

    it('should limit category results when type is "all"', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'all' },
      })

      await handler(req, res)

      expect(prisma.forumCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      )
    })

    it('should limit post results when type is "all"', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'all' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('should include parent category info in category results', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Child Category',
          slug: 'child',
          _count: { posts: 5 },
          parent: {
            name: 'Parent Category',
            slug: 'parent',
          },
        },
      ]

      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'categories' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.categories[0].parent.name).toBe('Parent Category')
    })

    it('should handle case-insensitive search', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'TeSt' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'TeSt', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should order posts by creation date descending', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }],
        })
      )
    })

    it('should order categories by display order', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'categories' },
      })

      await handler(req, res)

      expect(prisma.forumCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ displayOrder: 'asc' }],
        })
      )
    })

    it('should handle database errors', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Internal server error',
      })
    })

    it('should handle empty search results', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'nonexistent' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.posts).toEqual([])
      expect(data.categories).toEqual([])
      expect(data.totalResults).toBe(0)
    })

    it('should handle special characters in search query', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test@#$%' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(500)
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: longQuery },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle Unicode characters in search', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'तेस्ट 测试' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should combine total results when type is "all"', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([{}, {}])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([{}, {}, {}])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'all' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.totalResults).toBe(5) // 2 posts + 3 categories
    })

    it('should parse page number correctly', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts', page: '3' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.currentPage).toBe(3)
    })

    it('should parse limit number correctly', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts', limit: '50' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      )
    })

    it('should filter categories by city when provided', async () => {
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'categories', city: 'mumbai' },
      })

      await handler(req, res)

      expect(prisma.forumCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: 'mumbai',
          }),
        })
      )
    })

    it('should not skip results when type is "all"', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'all' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      )
    })

    it('should handle invalid page numbers gracefully', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts', page: 'invalid' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.currentPage).toBe(1) // Should default to 1
    })

    it('should handle invalid limit numbers gracefully', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test', type: 'posts', limit: 'invalid' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20, // Should default to 20
        })
      )
    })

    it('should return proper response structure', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('query')
      expect(data).toHaveProperty('posts')
      expect(data).toHaveProperty('categories')
      expect(data).toHaveProperty('totalResults')
      expect(data).toHaveProperty('currentPage')
      expect(data).toHaveProperty('totalPages')
    })
  })
})
