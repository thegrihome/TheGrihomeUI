import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/user/[userId]/stats'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    forumPost: { count: jest.fn() },
    forumReply: { count: jest.fn() },
    postReaction: { groupBy: jest.fn() },
    replyReaction: { groupBy: jest.fn() },
  },
}))

describe('/api/forum/user/[userId]/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  it('should return user forum statistics', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', username: 'testuser' })
    ;(prisma.forumPost.count as jest.Mock).mockResolvedValue(10)
    ;(prisma.forumReply.count as jest.Mock).mockResolvedValue(20)
    ;(prisma.postReaction.groupBy as jest.Mock).mockResolvedValue([
      { type: 'THANKS', _count: { type: 5 } },
    ])
    ;(prisma.replyReaction.groupBy as jest.Mock).mockResolvedValue([])
    const { req, res } = createMocks({ method: 'GET', query: { userId: 'u1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.postCount).toBe(10)
    expect(data.replyCount).toBe(20)
    expect(data.totalPosts).toBe(30)
  })

  it('should return 405 for POST method', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
