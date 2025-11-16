import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/reactions/posts'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    postReaction: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))

describe('/api/forum/reactions/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'POST', body: { postId: 'p1', type: 'THANKS' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when missing fields', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should remove existing reaction', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.postReaction.findUnique as jest.Mock).mockResolvedValue({ id: 'r1' })
    ;(prisma.postReaction.delete as jest.Mock).mockResolvedValue({})
    const { req, res } = createMocks({ method: 'POST', body: { postId: 'p1', type: 'THANKS' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData()).action).toBe('removed')
  })

  it('should add new reaction', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.postReaction.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.postReaction.create as jest.Mock).mockResolvedValue({ id: 'r1', type: 'THANKS' })
    const { req, res } = createMocks({ method: 'POST', body: { postId: 'p1', type: 'THANKS' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
    expect(JSON.parse(res._getData()).action).toBe('added')
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
