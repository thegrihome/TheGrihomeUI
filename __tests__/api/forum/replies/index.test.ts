import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/replies/index'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    forumPost: { findUnique: jest.fn() },
    forumReply: { findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))

describe('/api/forum/replies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'POST', body: { content: 'Test', postId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 403 when user not verified', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      emailVerified: false,
      mobileVerified: false,
    })
    const { req, res } = createMocks({ method: 'POST', body: { content: 'Test', postId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(403)
  })

  it('should return 400 when missing required fields', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: true })
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 404 when post not found', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: true })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'POST', body: { content: 'Test', postId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(404)
  })

  it('should return 403 when post is locked', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: true })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ isLocked: true })
    const { req, res } = createMocks({ method: 'POST', body: { content: 'Test', postId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(403)
  })

  it('should create reply successfully', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: true })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ isLocked: false })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => callback(prisma))
    ;(prisma.forumReply.create as jest.Mock).mockResolvedValue({ id: 'r1', content: 'Test' })
    const { req, res } = createMocks({ method: 'POST', body: { content: 'Test', postId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
  })

  it('should handle parent reply validation', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: true })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ isLocked: false })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue({ id: 'parent1' })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => callback(prisma))
    ;(prisma.forumReply.create as jest.Mock).mockResolvedValue({ id: 'r1' })
    const { req, res } = createMocks({
      method: 'POST',
      body: { content: 'Test', postId: 'p1', parentId: 'parent1' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
