import { createMocks } from 'node-mocks-http'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { Resend } from 'resend'

// Create mock Prisma instance
const mockPrisma = {
  interest: { findFirst: jest.fn(), create: jest.fn() },
  user: { findUnique: jest.fn() },
  project: { findUnique: jest.fn() },
  property: { findUnique: jest.fn() },
  $disconnect: jest.fn().mockResolvedValue(undefined),
}

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('resend')

// Import handler after mocking
import handler from '@/pages/api/interests/express'

describe('/api/interests/express', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'POST', body: { projectId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when both projectId and propertyId missing', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 400 when both projectId and propertyId provided', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    const { req, res } = createMocks({
      method: 'POST',
      body: { projectId: 'p1', propertyId: 'pr1' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 400 when interest already expressed', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    mockPrisma.interest.findFirst.mockResolvedValue({ id: 'i1' })
    const { req, res } = createMocks({ method: 'POST', body: { projectId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 403 when user not verified', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    mockPrisma.interest.findFirst.mockResolvedValue(null)
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: false, mobileVerified: false })
    const { req, res } = createMocks({ method: 'POST', body: { projectId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(403)
  })

  it('should create interest successfully for project', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'u1', email: 'user@test.com' },
    })
    mockPrisma.interest.findFirst.mockResolvedValue(null)
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: true, username: 'testuser' })
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Project 1',
      builder: { contactInfo: {} },
    })
    mockPrisma.interest.create.mockResolvedValue({ id: 'i1', createdAt: new Date() })
    const { req, res } = createMocks({ method: 'POST', body: { projectId: 'p1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
