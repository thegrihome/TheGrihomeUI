import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/posts/index'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    forumPost: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/forum/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/forum/posts', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: 'Test Post',
          slug: 'test-post',
          author: { id: 'user1', username: 'testuser', image: null, createdAt: new Date() },
          category: { id: 'cat1', name: 'Category', slug: 'category' },
          _count: { replies: 5, reactions: 10 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.posts).toEqual(mockPosts)
      expect(data.totalCount).toBe(1)
      expect(data.currentPage).toBe(1)
      expect(data.totalPages).toBe(1)
    })

    it('should filter by categoryId when provided', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { categoryId: 'cat123' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 'cat123' },
        })
      )
    })

    it('should use default pagination values', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      )
    })

    it('should handle custom pagination', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2', limit: '10' },
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })

    it('should order by sticky first, then last reply, then created date', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isSticky: 'desc' }, { lastReplyAt: 'desc' }, { createdAt: 'desc' }],
        })
      )
    })

    it('should include author information', async () => {
      const mockPosts = [
        {
          id: 'post1',
          author: {
            id: 'user1',
            username: 'testuser',
            image: 'avatar.jpg',
            createdAt: new Date(),
          },
          category: { id: 'cat1', name: 'Category', slug: 'category' },
          _count: { replies: 0, reactions: 0 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.posts[0].author.username).toBe('testuser')
    })

    it('should include category information', async () => {
      const mockPosts = [
        {
          id: 'post1',
          author: { id: 'user1', username: 'testuser', image: null, createdAt: new Date() },
          category: {
            id: 'cat1',
            name: 'Test Category',
            slug: 'test-category',
          },
          _count: { replies: 0, reactions: 0 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.posts[0].category.name).toBe('Test Category')
    })

    it('should include reply and reaction counts', async () => {
      const mockPosts = [
        {
          id: 'post1',
          author: { id: 'user1', username: 'testuser', image: null, createdAt: new Date() },
          category: { id: 'cat1', name: 'Category', slug: 'category' },
          _count: { replies: 42, reactions: 123 },
        },
      ]

      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(1)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.posts[0]._count.replies).toBe(42)
      expect(data.posts[0]._count.reactions).toBe(123)
    })

    it('should calculate total pages correctly', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(45)

      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '20' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.totalPages).toBe(3)
    })

    it('should handle database errors', async () => {
      ;(prisma.forumPost.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
      })
    })
  })

  describe('POST /api/forum/posts', () => {
    it('should return 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Post',
          content: 'Test content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Authentication required',
      })
    })

    it('should return 403 when user is not verified', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: false,
        mobileVerified: false,
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Post',
          content: 'Test content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Email or mobile verification required to post',
      })
    })

    it('should allow verified users to post', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumPost.create as jest.Mock).mockResolvedValue({
        id: 'post1',
        title: 'Test Post',
        slug: 'test-post',
        author: { id: 'user1', username: 'testuser', image: null, createdAt: new Date() },
        category: { id: 'cat1', name: 'Category', slug: 'category' },
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Post',
          content: 'Test content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
    })

    it('should return 400 when missing required fields', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missing required fields',
      })
    })

    it('should generate slug from title', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumPost.create as jest.Mock).mockResolvedValue({
        id: 'post1',
        slug: 'test-post-title',
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Post Title',
          content: 'Content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      expect(prisma.forumPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'test-post-title',
          }),
        })
      )
    })

    it('should ensure unique slugs', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })
      ;(prisma.forumPost.findUnique as jest.Mock)
        .mockResolvedValueOnce({ slug: 'test' })
        .mockResolvedValueOnce(null)
      ;(prisma.forumPost.create as jest.Mock).mockResolvedValue({
        id: 'post1',
        slug: 'test-1',
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test',
          content: 'Content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      expect(prisma.forumPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'test-1',
          }),
        })
      )
    })

    it('should sanitize slug from special characters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumPost.create as jest.Mock).mockResolvedValue({
        id: 'post1',
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test@#$% Post!!!',
          content: 'Content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      const createCall = (prisma.forumPost.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.slug).toMatch(/^[a-z0-9-]+$/)
    })

    it('should include author in response', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumPost.create as jest.Mock).mockResolvedValue({
        id: 'post1',
        author: {
          id: 'user1',
          username: 'testuser',
          image: null,
          createdAt: new Date(),
        },
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test',
          content: 'Content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.author).toBeDefined()
    })

    it('should include category in response', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumPost.create as jest.Mock).mockResolvedValue({
        id: 'post1',
        category: {
          id: 'cat1',
          name: 'Category',
          slug: 'category',
        },
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test',
          content: 'Content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.category).toBeDefined()
    })

    it('should allow mobile verified users to post', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: false,
        mobileVerified: true,
      })
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumPost.create as jest.Mock).mockResolvedValue({
        id: 'post1',
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test',
          content: 'Content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
    })

    it('should handle database errors on post creation', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        emailVerified: true,
        mobileVerified: false,
      })
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumPost.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test',
          content: 'Content',
          categoryId: 'cat1',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Method validation', () => {
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

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
