import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/properties/toggle-favorite'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
    },
    savedProperty: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe('/api/properties/toggle-favorite', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  }

  const mockProperty = {
    id: 'property-123',
    userId: 'owner-456',
  }

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'POST',
      body: { propertyId: 'property-123' },
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty)
    ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.savedProperty.create as jest.Mock).mockResolvedValue({
      id: 'saved-123',
      userId: 'user-123',
      propertyId: 'property-123',
      createdAt: new Date(),
    })
  })

  describe('HTTP Method Validation', () => {
    it('should return 405 for GET requests', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT requests', async () => {
      req.method = 'PUT'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE requests', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept POST requests', async () => {
      req.method = 'POST'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: null })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user has no id', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should proceed when valid session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Property ID Validation', () => {
    it('should return 400 when propertyId is missing', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should return 400 when propertyId is null', async () => {
      req.body = { propertyId: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should return 400 when propertyId is empty string', async () => {
      req.body = { propertyId: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should accept valid propertyId', async () => {
      req.body = { propertyId: 'property-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Property Existence Validation', () => {
    it('should return 404 when property not found', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property not found' })
    })

    it('should fetch property with correct fields', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        select: { userId: true },
      })
    })
  })

  describe('Owner Protection', () => {
    it('should return 403 when user tries to favorite their own property', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: mockSession.user.id,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You cannot favorite your own property' })
    })

    it('should allow favoriting when user is not the owner', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: 'different-user-id',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Add to Favorites Functionality', () => {
    it('should add property to favorites when not already favorited', async () => {
      ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.savedProperty.create).toHaveBeenCalledWith({
        data: {
          userId: mockSession.user.id,
          propertyId: 'property-123',
        },
      })
    })

    it('should return success message when adding to favorites', async () => {
      ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property added to favorites',
        isFavorited: true,
      })
    })

    it('should check for existing favorite with correct query', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.savedProperty.findUnique).toHaveBeenCalledWith({
        where: {
          userId_propertyId: {
            userId: mockSession.user.id,
            propertyId: 'property-123',
          },
        },
      })
    })
  })

  describe('Remove from Favorites Functionality', () => {
    it('should remove property from favorites when already favorited', async () => {
      const existingFavorite = {
        id: 'saved-123',
        userId: 'user-123',
        propertyId: 'property-123',
        createdAt: new Date(),
      }
      ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue(existingFavorite)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.savedProperty.delete).toHaveBeenCalledWith({
        where: {
          id: existingFavorite.id,
        },
      })
    })

    it('should return success message when removing from favorites', async () => {
      ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue({
        id: 'saved-123',
        userId: 'user-123',
        propertyId: 'property-123',
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property removed from favorites',
        isFavorited: false,
      })
    })

    it('should not create new favorite when removing', async () => {
      ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue({
        id: 'saved-123',
        userId: 'user-123',
        propertyId: 'property-123',
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.savedProperty.create).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when property fetch fails', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: undefined,
      })
    })

    it('should return 500 when favorite check fails', async () => {
      ;(prisma.savedProperty.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })

    it('should return 500 when favorite creation fails', async () => {
      ;(prisma.savedProperty.create as jest.Mock).mockRejectedValue(new Error('Create failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })

    it('should return 500 when favorite deletion fails', async () => {
      ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue({
        id: 'saved-123',
        userId: 'user-123',
        propertyId: 'property-123',
        createdAt: new Date(),
      })
      ;(prisma.savedProperty.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const testError = new Error('Test error')
      ;(prisma.property.findUnique as jest.Mock).mockRejectedValue(testError)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: testError,
      })
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long property IDs', async () => {
      const longId = 'a'.repeat(500)
      req.body = { propertyId: longId }
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        userId: 'different-user-id',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: longId },
        select: { userId: true },
      })
    })

    it('should handle UUID format property IDs', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      req.body = { propertyId: uuid }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: uuid },
        select: { userId: true },
      })
    })

    it('should handle concurrent favorite toggle requests', async () => {
      ;(prisma.savedProperty.findUnique as jest.Mock).mockResolvedValue(null)

      await Promise.all([
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
      ])

      expect(prisma.savedProperty.create).toHaveBeenCalledTimes(2)
    })
  })
})
