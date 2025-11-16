import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/user/[userId]/posts'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    forumPost: { findMany: jest.fn(), count: jest.fn() },
    forumReply: { findMany: jest.fn(), count: jest.fn() },
  },
}))

describe('/api/forum/user/[userId]/posts', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('should return 400 when userId is missing', async () => {
    const { req, res } = createMocks({ method: 'GET', query: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 404 when user not found', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'GET', query: { userId: 'u1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(404)
  })

  it('should return user posts and replies', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', username: 'testuser' })
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.forumReply.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumReply.count as jest.Mock).mockResolvedValue(0)
    const { req, res } = createMocks({ method: 'GET', query: { userId: 'u1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.user).toBeDefined()
    expect(data.posts).toBeDefined()
    expect(data.replies).toBeDefined()
  })

  it('should handle pagination', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' })
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(50)
    ;(prisma.forumReply.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumReply.count as jest.Mock).mockResolvedValue(0)
    const { req, res } = createMocks({ method: 'GET', query: { userId: 'u1', page: '2', limit: '10' } })
    await handler(req, res)
    expect(prisma.forumPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }))
  })

  it('should return 405 for POST method', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
