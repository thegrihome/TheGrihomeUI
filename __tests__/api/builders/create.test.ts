import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/builders/create'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { put } from '@vercel/blob'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    builder: { findFirst: jest.fn(), create: jest.fn() },
  },
}))

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('@vercel/blob', () => ({ put: jest.fn() }))

describe('/api/builders/create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'POST', body: { name: 'Builder 1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when name is missing', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 400 when builder already exists', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.builder.findFirst as jest.Mock).mockResolvedValue({ id: 'b1' })
    const { req, res } = createMocks({ method: 'POST', body: { name: 'Existing Builder' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should create builder successfully', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.builder.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.builder.create as jest.Mock).mockResolvedValue({ id: 'b1', name: 'New Builder' })
    const { req, res } = createMocks({ method: 'POST', body: { name: 'New Builder' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
  })

  it('should upload logo if provided', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.builder.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.builder.create as jest.Mock).mockResolvedValue({ id: 'b1' })
    ;(put as jest.Mock).mockResolvedValue({ url: 'https://example.com/logo.png' })
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Builder', logoBase64: 'data:image/png;base64,abc123' },
    })
    await handler(req, res)
    expect(put).toHaveBeenCalled()
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
