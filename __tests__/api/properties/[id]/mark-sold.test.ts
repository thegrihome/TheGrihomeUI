import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/properties/[id]/mark-sold'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    property: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('/api/properties/[id]/mark-sold', () => {
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
    streetAddress: '123 Main St',
    userId: 'user-123',
    listingStatus: 'ACTIVE',
  }

  const mockUpdatedProperty = {
    ...mockProperty,
    listingStatus: 'SOLD',
    soldTo: 'External Buyer',
    soldToUserId: null,
    soldDate: new Date(),
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
    ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
    ;(prisma.property.update as jest.Mock).mockResolvedValue(mockUpdatedProperty)
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
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: null })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user has no email', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-123' } })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
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

    it('should use session email to verify ownership', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'property-123',
          user: {
            email: mockSession.user.email,
          },
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

      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'test-property-id',
          user: {
            email: mockSession.user.email,
          },
        },
      })
    })
  })

  describe('Property Existence and Ownership', () => {
    it('should return 404 when property not found', async () => {
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property not found or you do not have permission to modify it',
      })
    })

    it('should return 404 when user does not own property', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'different@example.com' },
      })
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property not found or you do not have permission to modify it',
      })
    })

    it('should verify ownership using session email', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user: {
            email: mockSession.user.email,
          },
        }),
      })
    })

    it('should allow owner to mark as sold', async () => {
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Mark as Sold Functionality', () => {
    it('should update property status to SOLD', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          listingStatus: 'SOLD',
        }),
      })
    })

    it('should set soldTo to "External Buyer" by default', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'External Buyer',
        }),
      })
    })

    it('should use provided soldTo value', async () => {
      req.body = { soldTo: 'John Doe' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'John Doe',
        }),
      })
    })

    it('should default to "External Buyer" when soldTo is empty string', async () => {
      req.body = { soldTo: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'External Buyer',
        }),
      })
    })

    it('should default to "External Buyer" when soldTo is null', async () => {
      req.body = { soldTo: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'External Buyer',
        }),
      })
    })

    it('should set soldToUserId to null by default', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: null,
        }),
      })
    })

    it('should use provided soldToUserId value', async () => {
      req.body = { soldToUserId: 'buyer-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: 'buyer-123',
        }),
      })
    })

    it('should set soldToUserId to null when empty string', async () => {
      req.body = { soldToUserId: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: null,
        }),
      })
    })

    it('should set soldDate to current date', async () => {
      const beforeTime = new Date()

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldDate: expect.any(Date),
        }),
      })

      const updateData = (prisma.property.update as jest.Mock).mock.calls[0][0].data
      expect(updateData.soldDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(updateData.soldDate.getTime()).toBeLessThanOrEqual(new Date().getTime())
    })

    it('should include both soldTo and soldToUserId when provided', async () => {
      req.body = { soldTo: 'Jane Smith', soldToUserId: 'buyer-456' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'Jane Smith',
          soldToUserId: 'buyer-456',
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
        message: 'Property marked as sold successfully',
        property: mockUpdatedProperty,
      })
    })

    it('should return updated property in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          property: expect.any(Object),
        })
      )
    })

    it('should include all updated fields in response', async () => {
      const customUpdatedProperty = {
        ...mockProperty,
        listingStatus: 'SOLD',
        soldTo: 'Custom Buyer',
        soldToUserId: 'custom-user-id',
        soldDate: new Date(),
      }
      ;(prisma.property.update as jest.Mock).mockResolvedValue(customUpdatedProperty)
      req.body = { soldTo: 'Custom Buyer', soldToUserId: 'custom-user-id' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Property marked as sold successfully',
        property: customUpdatedProperty,
      })
    })
  })

  describe('Request Body Variations', () => {
    it('should handle empty request body', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle request body with only soldTo', async () => {
      req.body = { soldTo: 'Buyer Name' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'Buyer Name',
          soldToUserId: null,
        }),
      })
    })

    it('should handle request body with only soldToUserId', async () => {
      req.body = { soldToUserId: 'user-id-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'External Buyer',
          soldToUserId: 'user-id-123',
        }),
      })
    })

    it('should handle soldTo with special characters', async () => {
      req.body = { soldTo: "O'Brien & Associates LLC" }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: "O'Brien & Associates LLC",
        }),
      })
    })

    it('should handle soldTo with unicode characters', async () => {
      req.body = { soldTo: 'José García-Martínez' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'José García-Martínez',
        }),
      })
    })

    it('should handle very long soldTo names', async () => {
      const longName = 'A'.repeat(500)
      req.body = { soldTo: longName }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: longName,
        }),
      })
    })

    it('should handle soldTo with only whitespace', async () => {
      req.body = { soldTo: '   ' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: '   ',
        }),
      })
    })

    it('should handle soldToUserId with UUID format', async () => {
      req.body = { soldToUserId: '550e8400-e29b-41d4-a716-446655440000' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      })
    })

    it('should handle soldToUserId with different ID formats', async () => {
      req.body = { soldToUserId: 'user_2abc123def456' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldToUserId: 'user_2abc123def456',
        }),
      })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when property fetch fails', async () => {
      ;(prisma.property.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

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
      ;(prisma.property.findFirst as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should not expose error details to client', async () => {
      ;(prisma.property.update as jest.Mock).mockRejectedValue(new Error('Detailed database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
      expect(jsonMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Detailed database error'),
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle property already marked as sold', async () => {
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue({
        ...mockProperty,
        listingStatus: 'SOLD',
        soldTo: 'Previous Buyer',
        soldDate: new Date('2024-01-01'),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle property in different statuses', async () => {
      const statuses = ['ACTIVE', 'PENDING', 'ARCHIVED', 'DRAFT', 'OFF_MARKET']

      for (const status of statuses) {
        jest.clearAllMocks()
        ;(prisma.property.findFirst as jest.Mock).mockResolvedValue({
          ...mockProperty,
          listingStatus: status,
        })

        await handler(req as NextApiRequest, res as NextApiResponse)

        expect(statusMock).toHaveBeenCalledWith(200)
      }
    })

    it('should handle numeric soldTo value', async () => {
      req.body = { soldTo: 12345 }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 12345,
        }),
      })
    })

    it('should handle boolean soldTo value', async () => {
      req.body = { soldTo: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: true,
        }),
      })
    })

    it('should handle object soldTo value', async () => {
      req.body = { soldTo: { name: 'Buyer Name' } }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: { name: 'Buyer Name' },
        }),
      })
    })

    it('should handle undefined soldTo and soldToUserId', async () => {
      req.body = { soldTo: undefined, soldToUserId: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'property-123' },
        data: expect.objectContaining({
          soldTo: 'External Buyer',
          soldToUserId: null,
        }),
      })
    })

    it('should preserve property id in update', async () => {
      req.query = { id: 'unique-property-id' }
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue({
        ...mockProperty,
        id: 'unique-property-id',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'unique-property-id' },
        data: expect.any(Object),
      })
    })
  })

  describe('Database Transaction Integrity', () => {
    it('should call findFirst before update', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const findFirstCall = (prisma.property.findFirst as jest.Mock).mock.invocationCallOrder[0]
      const updateCall = (prisma.property.update as jest.Mock).mock.invocationCallOrder[0]

      expect(findFirstCall).toBeLessThan(updateCall)
    })

    it('should not call update when property not found', async () => {
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(null)

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
  })
})
