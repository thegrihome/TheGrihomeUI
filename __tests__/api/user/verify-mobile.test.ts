import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/user/verify-mobile'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}))

describe('/api/user/verify-mobile', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    req = {
      method: 'POST',
      body: {},
      headers: {},
    }
    res = {
      status: statusMock,
    }
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      req.method = 'PUT'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept POST method', async () => {
      req.method = 'POST'
      req.body = { otp: '123456' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Authentication', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { otp: '123456' }
    })

    it('should return 401 when no session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({})

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user has no id', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {},
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user id is empty string', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '' },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should pass authentication with valid session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })
  })

  describe('OTP Validation', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
    })

    it('should return 400 when otp is missing', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'OTP is required' })
    })

    it('should return 400 when otp is null', async () => {
      req.body = { otp: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'OTP is required' })
    })

    it('should return 400 when otp is empty string', async () => {
      req.body = { otp: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'OTP is required' })
    })

    it('should return 400 when otp is undefined', async () => {
      req.body = { otp: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'OTP is required' })
    })

    it('should return 400 for invalid OTP (not 123456)', async () => {
      req.body = { otp: '111111' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for incorrect OTP', async () => {
      req.body = { otp: '654321' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for OTP with wrong length', async () => {
      req.body = { otp: '12345' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for OTP with extra digits', async () => {
      req.body = { otp: '1234567' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should accept valid OTP 123456', async () => {
      req.body = { otp: '123456' }
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(400)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return 400 for alphabetic OTP', async () => {
      req.body = { otp: 'abcdef' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for alphanumeric OTP', async () => {
      req.body = { otp: '12ab56' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for OTP with special characters', async () => {
      req.body = { otp: '123@56' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for OTP with spaces', async () => {
      req.body = { otp: '123 456' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })
  })

  describe('Mobile Verification Update', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { otp: '123456' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
    })

    it('should update user with mobileVerified date', async () => {
      const beforeUpdate = Date.now()
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { mobileVerified: expect.any(Date) },
      })

      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
      const mobileVerifiedDate = updateCall.data.mobileVerified as Date
      const afterUpdate = Date.now()

      expect(mobileVerifiedDate.getTime()).toBeGreaterThanOrEqual(beforeUpdate)
      expect(mobileVerifiedDate.getTime()).toBeLessThanOrEqual(afterUpdate)
    })

    it('should update correct user by id', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { mobileVerified: expect.any(Date) },
      })
    })

    it('should set mobileVerified to current date', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
      const mobileVerifiedDate = updateCall.data.mobileVerified as Date

      expect(mobileVerifiedDate).toBeInstanceOf(Date)
    })

    it('should return 200 on successful verification', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Mobile verified successfully' })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { otp: '123456' }
    })

    it('should return 500 on session error', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database update error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Database update failed')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on Prisma connection error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockRejectedValue({
        code: 'P1001',
        message: 'Cannot connect to database',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on timeout error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on network error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on Prisma record not found error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { otp: '123456' }
    })

    it('should handle user id with special characters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-id-with-dashes-123' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-id-with-dashes-123',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle UUID format user id', async () => {
      const uuidUserId = '550e8400-e29b-41d4-a716-446655440000'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: uuidUserId },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: uuidUserId })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle very long user id', async () => {
      const longUserId = 'u'.repeat(100)
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: longUserId },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: longUserId })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle session with additional user properties', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
        },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('OTP String Variations', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
    })

    it('should handle OTP as string type', async () => {
      req.body = { otp: '123456' }
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should reject OTP as number type', async () => {
      req.body = { otp: 123456 }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should reject whitespace-padded valid OTP', async () => {
      req.body = { otp: ' 123456 ' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should reject OTP with leading zeros that are different', async () => {
      req.body = { otp: '012345' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should reject OTP in different format', async () => {
      req.body = { otp: '1-2-3-4-5-6' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
    })
  })

  describe('Request Body Variations', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should ignore extra fields in request body', async () => {
      req.body = {
        otp: '123456',
        extraField: 'should be ignored',
        anotherField: 123,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle request body with only otp field', async () => {
      req.body = { otp: '123456' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { otp: '123456' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should return success message', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mobile verified successfully',
      })
    })

    it('should not return user data in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('user')
    })

    it('should not return mobileVerified date in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('mobileVerified')
    })

    it('should return only message property', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(Object.keys(callArg)).toEqual(['message'])
    })
  })

  describe('Concurrent Requests', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { otp: '123456' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should handle multiple simultaneous verification requests', async () => {
      const promises = [
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
      ]

      await Promise.all(promises)

      expect(prisma.user.update).toHaveBeenCalledTimes(3)
    })
  })

  describe('Session Validation Order', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { otp: '123456' }
    })

    it('should check session before OTP validation', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should check OTP before database update', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      req.body = { otp: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })

  describe('Development OTP', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should accept development OTP 123456', async () => {
      req.body = { otp: '123456' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should only accept 123456 as valid OTP', async () => {
      const invalidOTPs = [
        '000000',
        '111111',
        '222222',
        '333333',
        '444444',
        '555555',
        '666666',
        '777777',
        '888888',
        '999999',
      ]

      for (const invalidOTP of invalidOTPs) {
        jest.clearAllMocks()
        req.body = { otp: invalidOTP }

        await handler(req as NextApiRequest, res as NextApiResponse)

        expect(statusMock).toHaveBeenCalledWith(400)
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
      }
    })
  })
})
