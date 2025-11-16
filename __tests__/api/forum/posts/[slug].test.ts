import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/posts/[slug]'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    forumPost: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

describe('/api/forum/posts/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/forum/posts/[slug]', () => {
    it('should return post with details', async () => {
      const createdAtDate = new Date()
      const mockPost = {
        id: 'post1',
        title: 'Test Post',
        content: 'Test content',
        slug: 'test-post',
        viewCount: 100,
        author: { id: 'user1', username: 'testuser', image: null, createdAt: createdAtDate },
        category: { id: 'cat1', name: 'Category', slug: 'category' },
        replies: [],
        reactions: [],
      }

      ;(prisma.forumPost.update as jest.Mock).mockResolvedValue({})
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(mockPost)

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'test-post' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // JSON serialization converts Date objects to ISO strings
      const expected = {
        ...mockPost,
        author: { ...mockPost.author, createdAt: createdAtDate.toISOString() },
      }
      expect(JSON.parse(res._getData())).toEqual(expected)
    })

    it('should increment view count', async () => {
      const mockPost = {
        id: 'post1',
        slug: 'test-post',
        author: { id: 'user1', username: 'testuser', image: null, createdAt: new Date() },
        category: { id: 'cat1', name: 'Category', slug: 'category' },
        replies: [],
        reactions: [],
      }

      ;(prisma.forumPost.update as jest.Mock).mockResolvedValue({})
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(mockPost)

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'test-post' },
      })

      await handler(req, res)

      expect(prisma.forumPost.update).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
        data: { viewCount: { increment: 1 } },
      })
    })

    it('should return 404 when post not found', async () => {
      ;(prisma.forumPost.update as jest.Mock).mockResolvedValue({})
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'nonexistent' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ error: 'Post not found' })
    })

    it('should include nested replies', async () => {
      const mockPost = {
        id: 'post1',
        author: { id: 'user1', username: 'testuser', image: null, createdAt: new Date() },
        category: { id: 'cat1', name: 'Category', slug: 'category' },
        replies: [
          {
            id: 'reply1',
            content: 'Top level reply',
            author: { id: 'user2', username: 'user2', image: null, createdAt: new Date() },
            children: [
              {
                id: 'reply2',
                content: 'Nested reply',
                author: { id: 'user3', username: 'user3', image: null, createdAt: new Date() },
                reactions: [],
              },
            ],
            reactions: [],
          },
        ],
        reactions: [],
      }

      ;(prisma.forumPost.update as jest.Mock).mockResolvedValue({})
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(mockPost)

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'test-post' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.replies[0].children).toBeDefined()
      expect(data.replies[0].children.length).toBeGreaterThan(0)
    })

    it('should include reactions on post', async () => {
      const mockPost = {
        id: 'post1',
        author: { id: 'user1', username: 'testuser', image: null, createdAt: new Date() },
        category: { id: 'cat1', name: 'Category', slug: 'category' },
        replies: [],
        reactions: [{ id: 'reaction1', type: 'THANKS', user: { id: 'user2', username: 'user2' } }],
      }

      ;(prisma.forumPost.update as jest.Mock).mockResolvedValue({})
      ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(mockPost)

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'test-post' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.reactions).toBeDefined()
      expect(data.reactions.length).toBeGreaterThan(0)
    })

    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { slug: 'test-post' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should handle database errors', async () => {
      ;(prisma.forumPost.update as jest.Mock).mockRejectedValue(new Error('DB error'))

      const { req, res } = createMocks({
        method: 'GET',
        query: { slug: 'test-post' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })
})
