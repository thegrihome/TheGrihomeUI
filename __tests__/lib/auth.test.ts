import { getServerAuthSession } from '@/lib/auth'
import { getServerSession } from 'next-auth/next'
import { NextApiRequest, NextApiResponse } from 'next'

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('lib/auth', () => {
  describe('getServerAuthSession', () => {
    it('should call getServerSession with correct parameters', async () => {
      const mockReq = {} as NextApiRequest
      const mockRes = {} as NextApiResponse
      const mockSession = { user: { email: 'test@example.com' } }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await getServerAuthSession(mockReq, mockRes)

      expect(getServerSession).toHaveBeenCalled()
      expect(result).toEqual(mockSession)
    })

    it('should return null when no session exists', async () => {
      const mockReq = {} as NextApiRequest
      const mockRes = {} as NextApiResponse

      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const result = await getServerAuthSession(mockReq, mockRes)

      expect(result).toBeNull()
    })

    it('should handle session with all user properties', async () => {
      const mockReq = {} as NextApiRequest
      const mockRes = {} as NextApiResponse
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
          mobileNumber: '+911234567890',
          isEmailVerified: true,
          isMobileVerified: true,
          isAgent: false,
        },
        expires: '2099-12-31',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const result = await getServerAuthSession(mockReq, mockRes)

      expect(result).toEqual(mockSession)
    })
  })
})
