import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/properties/[id]/reactivate'
import { prisma } from '@/lib/cockroachDB/prisma'
import { LISTING_STATUS } from '@/lib/constants'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('/api/properties/[id]/reactivate', () => {
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
    userId: 'user-123',
    listingStatus: LISTING_STATUS.ARCHIVED,
  }

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'POST',
      query: { id: 'property-123' },
      body: {},
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty)
    ;(prisma.property.update as jest.Mock).mockResolvedValue({
      ...mockProperty,
      listingStatus: LISTING_STATUS.ACTIVE,
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

    it('should return 405 for PATCH requests', async () => {
      req.method = 'PATCH'

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
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Authentication required' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: null })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Authentication required' })
    })

    it('should return 401 when session user has no id', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Authentication required' })
    })

    it('should proceed when valid session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should call getServerSession with correct parameters', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(getServerSession).toHaveBeenCalledWith(req, res, expect.anything())
    })

    it('should use session user id for ownership verification', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        select: {
          id: true,
          userId: true,
          listingStatus: true,
        },
      })
    })
  })

  describe('Property ID Validation', () => {
    it('should return 400 when id is missing', async () => {
      req.query = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should return 400 when id is not a string', async () => {
      req.query = { id: ['array-value'] }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should return 400 when id is empty string', async () => {
      req.query = { id: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Property ID is required' })
    })

    it('should accept valid string id', async () => {
      req.query = { id: 'property-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should use id from query to find property', async () => {
      req.query = { id: 'test-property-id' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-property-id' },
        select: {
          id: true,
          userId: true,
          listingStatus: true,
        },
      })
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
        select: {
          id: true,
          userId: true,
          listingStatus: true,
        },
      })
    })

    it('should verify property exists before reactivation', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledBefore(
        prisma.property.update as jest.Mock
      )
    })
  })

  describe('Ownership Validation', () => {
    it('should return 403 when user does not own property', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: 'different-user-id',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'You can only reactivate your own properties',
      })
    })

    it('should allow owner to reactivate', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: mockSession.user.id,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should match user ID from session', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: 'user-123',
      })
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should compare exact user IDs', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: 'user-123-different',
      })
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(403)
    })
  })

  describe('Status Validation', () => {
    it('should return 400 when property is not archived', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.ACTIVE,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Only archived properties can be reactivated',
      })
    })

    it('should return 400 when property is sold', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.SOLD,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Only archived properties can be reactivated',
      })
    })

    it('should return 400 when property is pending', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.PENDING,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Only archived properties can be reactivated',
      })
    })

    it('should return 400 when property is in draft', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.DRAFT,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Only archived properties can be reactivated',
      })
    })

    it('should return 400 when property is off market', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.OFF_MARKET,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Only archived properties can be reactivated',
      })
    })

    it('should allow reactivation of archived properties', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.ARCHIVED,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should check status using LISTING_STATUS constant', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.ARCHIVED,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Reactivation Functionality', () => {
    it('should update property status to ACTIVE', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: {
          listingStatus: LISTING_STATUS.ACTIVE,
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should update property timestamp', async () => {
      const beforeTime = new Date()

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
      })

      const updateData = (prisma.property.update as jest.Mock).mock.calls[0][0].data
      expect(updateData.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(updateData.updatedAt.getTime()).toBeLessThanOrEqual(new Date().getTime())
    })

    it('should use correct property id in update', async () => {
      req.query = { id: 'unique-property-id' }
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        id: 'unique-property-id',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'unique-property-id' },
        data: expect.any(Object),
      })
    })

    it('should only update status and timestamp', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const updateData = (prisma.property.update as jest.Mock).mock.calls[0][0].data
      expect(Object.keys(updateData)).toEqual(['listingStatus', 'updatedAt'])
    })

    it('should use ACTIVE constant from LISTING_STATUS', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          listingStatus: LISTING_STATUS.ACTIVE,
        }),
      })
    })
  })

  describe('Success Response', () => {
    it('should return 200 status on success', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return success message', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property reactivated successfully',
      })
    })

    it('should return exact success message', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property reactivated successfully',
      })
      expect(jsonMock).not.toHaveBeenCalledWith({
        message: 'Property activated successfully',
      })
    })

    it('should not return property data in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const response = jsonMock.mock.calls[0][0]
      expect(response.property).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when property fetch fails', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 when property update fails', async () => {
      ;(prisma.property.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 when session retrieval fails', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle unexpected errors gracefully', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should log errors in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(prisma.property.update as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reactivating property:',
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should not log errors in production mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(prisma.property.update as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should not expose error details to client', async () => {
      ;(prisma.property.update as jest.Mock).mockRejectedValue(
        new Error('Detailed database error')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
      expect(jsonMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Detailed database error'),
        })
      )
    })

    it('should handle database timeout errors', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockRejectedValue(new Error('Connection timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle concurrent update conflicts', async () => {
      ;(prisma.property.update as jest.Mock).mockRejectedValue(
        new Error('Concurrent update conflict')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle property with null userId', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(403)
    })

    it('should handle property with undefined listingStatus', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: undefined,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should handle very long property IDs', async () => {
      const longId = 'property-' + 'a'.repeat(1000)
      req.query = { id: longId }
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        id: longId,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle UUID format property IDs', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000'
      req.query = { id: uuidId }
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        id: uuidId,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: uuidId },
        select: expect.any(Object),
      })
    })

    it('should handle special characters in property ID', async () => {
      const specialId = 'property-123_test@special'
      req.query = { id: specialId }
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        id: specialId,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Database Transaction Integrity', () => {
    it('should call findUnique before update', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const findUniqueCall = (prisma.property.findUnique as jest.Mock).mock
        .invocationCallOrder[0]
      const updateCall = (prisma.property.update as jest.Mock).mock.invocationCallOrder[0]

      expect(findUniqueCall).toBeLessThan(updateCall)
    })

    it('should not call update when property not found', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).not.toHaveBeenCalled()
    })

    it('should not call update when ownership check fails', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        userId: 'different-user',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).not.toHaveBeenCalled()
    })

    it('should not call update when status check fails', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.ACTIVE,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).not.toHaveBeenCalled()
    })

    it('should not call update when session invalid', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).not.toHaveBeenCalled()
    })

    it('should not call update when property ID invalid', async () => {
      req.query = { id: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).not.toHaveBeenCalled()
    })

    it('should call all validation steps in correct order', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const sessionCall = (getServerSession as jest.Mock).mock.invocationCallOrder[0]
      const findUniqueCall = (prisma.property.findUnique as jest.Mock).mock
        .invocationCallOrder[0]
      const updateCall = (prisma.property.update as jest.Mock).mock.invocationCallOrder[0]

      expect(sessionCall).toBeLessThan(findUniqueCall)
      expect(findUniqueCall).toBeLessThan(updateCall)
    })
  })

  describe('Request Body Handling', () => {
    it('should ignore request body content', async () => {
      req.body = { randomField: 'random value', anotherField: 123 }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should work with empty request body', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should work with null request body', async () => {
      req.body = null

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should work with undefined request body', async () => {
      req.body = undefined

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should not be affected by malicious request body', async () => {
      req.body = {
        listingStatus: LISTING_STATUS.SOLD,
        userId: 'attacker-id',
        id: 'different-property',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: {
          listingStatus: LISTING_STATUS.ACTIVE,
          updatedAt: expect.any(Date),
        },
      })
    })
  })
})
