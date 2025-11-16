import { createMocks } from 'node-mocks-http'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mockPrismaInstance = {
    projectRequest: { create: jest.fn() },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  }
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
    mockPrismaInstance,
  }
})
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('resend')

import handler from '@/pages/api/project-requests/submit'

// Get the mock instance
const { mockPrismaInstance: mockPrisma } = jest.requireMock('@prisma/client') as any

describe('/api/project-requests/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when missing required fields', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 400 for invalid email', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        builderName: 'Builder',
        projectName: 'Project',
        location: 'Location',
        contactPersonName: 'John',
        contactPersonEmail: 'invalid-email',
        contactPersonPhone: '1234567890',
        projectType: 'RESIDENTIAL',
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should create project request successfully', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'u1', name: 'User', email: 'user@test.com' },
    })
    mockPrisma.projectRequest.create.mockResolvedValue({ id: 'pr1' })
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        builderName: 'Builder',
        projectName: 'Project',
        location: 'Location',
        contactPersonName: 'John',
        contactPersonEmail: 'john@test.com',
        contactPersonPhone: '1234567890',
        projectType: 'RESIDENTIAL',
      },
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
