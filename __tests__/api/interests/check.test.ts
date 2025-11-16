import { createMocks } from 'node-mocks-http'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

// Create mock Prisma instance
const mockPrisma = {
  interest: { findFirst: jest.fn() },
  $disconnect: jest.fn().mockResolvedValue(undefined),
}

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))

// Import handler after mocking
import handler from '@/pages/api/interests/check'

describe('/api/interests/check', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'GET', query: { projectId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when both projectId and propertyId missing', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    const { req, res } = createMocks({ method: 'GET', query: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return false when interest not expressed', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    mockPrisma.interest.findFirst.mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'GET', query: { projectId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.hasExpressed).toBe(false)
  })

  it('should return true when interest expressed', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    mockPrisma.interest.findFirst.mockResolvedValue({ id: 'i1', createdAt: new Date() })
    const { req, res } = createMocks({ method: 'GET', query: { projectId: 'p1' } })
    await handler(req, res)
    const data = JSON.parse(res._getData())
    expect(data.hasExpressed).toBe(true)
  })

  it('should return 405 for POST method', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
