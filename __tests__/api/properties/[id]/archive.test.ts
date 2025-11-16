import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/properties/[id]/archive'
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
    ad: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

describe('/api/properties/[id]/archive', () => {
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
    listingStatus: LISTING_STATUS.ACTIVE,
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
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (operations: any) => {
      return await Promise.all(operations)
    })
    ;(prisma.property.update as jest.Mock).mockResolvedValue(mockProperty)
    ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
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
        message: 'You can only archive your own properties',
      })
    })

    it('should allow owner to archive', async () => {
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
  })

  describe('Status Validation', () => {
    it('should return 400 when property is not active', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.ARCHIVED,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Only active properties can be archived',
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
        message: 'Only active properties can be archived',
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
        message: 'Only active properties can be archived',
      })
    })

    it('should allow archiving active properties', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: LISTING_STATUS.ACTIVE,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Archive Functionality', () => {
    it('should archive property without markAsSold flag', async () => {
      req.body = { markAsSold: false }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.$transaction).toHaveBeenCalled()
      const transactionOps = (prisma.$transaction as jest.Mock).mock.calls[0][0]
      expect(transactionOps).toHaveLength(2)
    })

    it('should set status to ARCHIVED when not marking as sold', async () => {
      req.body = { markAsSold: false }
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (operations: any) => {
        // Execute the operations
        for (const op of operations) {
          await op
        }
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          listingStatus: LISTING_STATUS.ARCHIVED,
          updatedAt: expect.any(Date),
        }),
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
    })

    it('should expire active ads for the property', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.ad.updateMany).toHaveBeenCalledWith({
        where: {
          propertyId: 'property-123',
          status: 'ACTIVE',
        },
        data: {
          status: 'EXPIRED',
        },
      })
    })

    it('should execute property update and ad expiry in transaction', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array))
      const operations = (prisma.$transaction as jest.Mock).mock.calls[0][0]
      expect(operations).toHaveLength(2)
    })

    it('should return success message for archive', async () => {
      req.body = { markAsSold: false }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property archived successfully',
      })
    })
  })

  describe('Mark as Sold Functionality', () => {
    it('should mark property as sold when markAsSold is true', async () => {
      req.body = { markAsSold: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          listingStatus: LISTING_STATUS.SOLD,
        }),
      })
    })

    it('should include soldTo when provided', async () => {
      req.body = { markAsSold: true, soldTo: 'John Doe' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'John Doe',
        }),
      })
    })

    it('should default soldTo to "External Buyer" when not provided', async () => {
      req.body = { markAsSold: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'External Buyer',
        }),
      })
    })

    it('should include soldToUserId when provided', async () => {
      req.body = { markAsSold: true, soldToUserId: 'buyer-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: 'buyer-123',
        }),
      })
    })

    it('should set soldToUserId to null when not provided', async () => {
      req.body = { markAsSold: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: null,
        }),
      })
    })

    it('should set soldDate when marking as sold', async () => {
      const beforeTime = new Date()
      req.body = { markAsSold: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldDate: expect.any(Date),
        }),
      })

      const updateData = (prisma.property.update as jest.Mock).mock.calls[0][0].data
      expect(updateData.soldDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    })

    it('should not include soldTo when archiving without markAsSold', async () => {
      req.body = { markAsSold: false }

      await handler(req as NextApiRequest, res as NextApiResponse)

      const updateData = (prisma.property.update as jest.Mock).mock.calls[0][0].data
      expect(updateData.soldTo).toBeUndefined()
    })

    it('should not include soldDate when archiving without markAsSold', async () => {
      req.body = { markAsSold: false }

      await handler(req as NextApiRequest, res as NextApiResponse)

      const updateData = (prisma.property.update as jest.Mock).mock.calls[0][0].data
      expect(updateData.soldDate).toBeUndefined()
    })

    it('should return success message for sold property', async () => {
      req.body = { markAsSold: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property marked as sold successfully',
      })
    })

    it('should expire ads when marking as sold', async () => {
      req.body = { markAsSold: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.ad.updateMany).toHaveBeenCalledWith({
        where: {
          propertyId: 'property-123',
          status: 'ACTIVE',
        },
        data: {
          status: 'EXPIRED',
        },
      })
    })
  })

  describe('Request Body Variations', () => {
    it('should handle empty request body', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should treat undefined markAsSold as false', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          listingStatus: LISTING_STATUS.ARCHIVED,
        }),
      })
    })

    it('should handle null markAsSold', async () => {
      req.body = { markAsSold: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          listingStatus: LISTING_STATUS.ARCHIVED,
        }),
      })
    })

    it('should handle soldTo with empty string', async () => {
      req.body = { markAsSold: true, soldTo: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'External Buyer',
        }),
      })
    })

    it('should handle soldToUserId with empty string', async () => {
      req.body = { markAsSold: true, soldToUserId: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: null,
        }),
      })
    })

    it('should handle both soldTo and soldToUserId', async () => {
      req.body = { markAsSold: true, soldTo: 'Jane Doe', soldToUserId: 'buyer-456' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'Jane Doe',
          soldToUserId: 'buyer-456',
        }),
      })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when property fetch fails', async () => {
      ;(prisma.property.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 when transaction fails', async () => {
      ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'))

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

    it('should return 500 when ad update fails', async () => {
      ;(prisma.ad.updateMany as jest.Mock).mockRejectedValue(new Error('Ad update failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should log errors in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error archiving property:',
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should not log errors in production mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should handle session retrieval error', async () => {
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
    })
  })

  describe('Edge Cases', () => {
    it('should handle property with no active ads', async () => {
      ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property with multiple active ads', async () => {
      ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({ count: 3 })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle very long soldTo names', async () => {
      const longName = 'A'.repeat(500)
      req.body = { markAsSold: true, soldTo: longName }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: longName,
        }),
      })
    })

    it('should handle special characters in soldTo', async () => {
      req.body = { markAsSold: true, soldTo: 'José García-Martínez' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'José García-Martínez',
        }),
      })
    })

    it('should handle UUID format soldToUserId', async () => {
      req.body = {
        markAsSold: true,
        soldToUserId: '550e8400-e29b-41d4-a716-446655440000',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      })
    })
  })
})
