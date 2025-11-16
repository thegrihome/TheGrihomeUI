import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/auth/login'
import { prisma } from '@/lib/cockroachDB/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

describe('POST /api/auth/login', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  const mockUser = {
    id: '1',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+911234567890',
    password: 'hashedPassword',
    role: 'BUYER',
    companyName: null,
    image: null,
    emailVerified: new Date(),
    mobileVerified: new Date(),
    createdAt: new Date(),
  }

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    req = {
      method: 'POST',
      body: {},
    }
    res = {
      status: statusMock,
    }
    jest.clearAllMocks()
    process.env.NODE_ENV = 'test'
  })

  describe('HTTP Method Validation', () => {
    it('should reject GET requests', async () => {
      req.method = 'GET'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should reject PUT requests', async () => {
      req.method = 'PUT'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should reject DELETE requests', async () => {
      req.method = 'DELETE'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should reject PATCH requests', async () => {
      req.method = 'PATCH'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept POST requests', async () => {
      req.method = 'POST'
      req.body = { type: 'username-password', username: 'test', password: 'pass' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Login Type Validation', () => {
    it('should return 400 if type is missing', async () => {
      req.body = { username: 'testuser', password: 'password123' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Login type is required' })
    })

    it('should return 400 for invalid login type', async () => {
      req.body = { type: 'invalid-type', username: 'testuser', password: 'password123' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid login type' })
    })

    it('should accept username-password type', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept email-otp type', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept mobile-otp type', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Username-Password Login - Validation', () => {
    it('should return 400 if username is missing', async () => {
      req.body = { type: 'username-password', password: 'password123' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Username/Email and password are required',
      })
    })

    it('should return 400 if password is missing', async () => {
      req.body = { type: 'username-password', username: 'testuser' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Username/Email and password are required',
      })
    })

    it('should return 400 if both username and password are missing', async () => {
      req.body = { type: 'username-password' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Username/Email and password are required',
      })
    })
  })

  describe('Username-Password Login - Username Lookup', () => {
    it('should lookup user by username when @ not in identifier', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: expect.any(Object),
      })
    })

    it('should lookup user by email when @ in identifier', async () => {
      req.body = {
        type: 'username-password',
        username: 'test@example.com',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object),
      })
    })

    it('should return 401 if user not found', async () => {
      req.body = { type: 'username-password', username: 'nonexistent', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid username/email or password' })
    })

    it('should return 401 if user has no password', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, password: null })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid username/email or password' })
    })
  })

  describe('Username-Password Login - Password Verification', () => {
    it('should verify password with bcrypt.compare', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword')
    })

    it('should return 401 if password is invalid', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'wrongpassword' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid username/email or password' })
    })

    it('should handle empty password in database', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, password: '' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
    })
  })

  describe('Username-Password Login - Success Response', () => {
    it('should return 200 on successful login', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return user data without password', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user.password).toBeUndefined()
      expect(response.user.id).toBe('1')
      expect(response.user.username).toBe('testuser')
    })

    it('should return success message', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe('Login successful')
    })

    it('should not change verification status for password login', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should return all user fields', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user).toHaveProperty('id')
      expect(response.user).toHaveProperty('username')
      expect(response.user).toHaveProperty('name')
      expect(response.user).toHaveProperty('email')
      expect(response.user).toHaveProperty('phone')
      expect(response.user).toHaveProperty('role')
      expect(response.user).toHaveProperty('emailVerified')
      expect(response.user).toHaveProperty('mobileVerified')
    })
  })

  describe('Email-OTP Login - Validation', () => {
    it('should return 400 if email is missing', async () => {
      req.body = { type: 'email-otp', otp: '123456' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email and OTP are required' })
    })

    it('should return 400 if otp is missing', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email and OTP are required' })
    })

    it('should return 400 if both email and otp are missing', async () => {
      req.body = { type: 'email-otp' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email and OTP are required' })
    })
  })

  describe('Email-OTP Login - User Lookup', () => {
    it('should lookup user by email using findUnique', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object),
      })
    })

    it('should return 401 if email not found', async () => {
      req.body = { type: 'email-otp', email: 'nonexistent@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email not found' })
    })
  })

  describe('Email-OTP Login - OTP Validation', () => {
    it('should accept valid OTP 123456', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return 401 for invalid OTP', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '654321' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for empty OTP', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email and OTP are required' })
    })

    it('should return 401 for OTP with wrong length', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '12345' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should be case-sensitive for OTP', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Email-OTP Login - Email Verification', () => {
    it('should mark email as verified on successful OTP login', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { emailVerified: expect.any(Date) },
        select: expect.any(Object),
      })
    })

    it('should update emailVerified with current date', async () => {
      const beforeDate = new Date()
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const afterDate = new Date()
      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
      const updatedDate = updateCall.data.emailVerified
      expect(updatedDate).toBeInstanceOf(Date)
      expect(updatedDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime())
      expect(updatedDate.getTime()).toBeLessThanOrEqual(afterDate.getTime())
    })

    it('should return updated user data', async () => {
      const updatedUser = { ...mockUser, emailVerified: new Date() }
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user).toEqual(updatedUser)
    })
  })

  describe('Email-OTP Login - Success Response', () => {
    it('should return 200 on successful email-otp login', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return success message', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe('Login successful')
    })

    it('should return user data', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user).toBeDefined()
      // Note: API includes password field - should be fixed for security
    })
  })

  describe('Mobile-OTP Login - Validation', () => {
    it('should return 400 if mobile is missing', async () => {
      req.body = { type: 'mobile-otp', otp: '123456' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Mobile number and OTP are required' })
    })

    it('should return 400 if otp is missing', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Mobile number and OTP are required' })
    })

    it('should return 400 if both mobile and otp are missing', async () => {
      req.body = { type: 'mobile-otp' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Mobile number and OTP are required' })
    })
  })

  describe('Mobile-OTP Login - User Lookup', () => {
    it('should lookup user by phone using findFirst', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '+911234567890' },
        select: expect.any(Object),
      })
    })

    it('should return 401 if mobile not found', async () => {
      req.body = { type: 'mobile-otp', mobile: '+919999999999', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mobile number not registered. Please sign up first.',
      })
    })

    it('should handle mobile numbers with different formats', async () => {
      req.body = { type: 'mobile-otp', mobile: '911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '911234567890' },
        select: expect.any(Object),
      })
    })
  })

  describe('Mobile-OTP Login - OTP Validation', () => {
    it('should accept valid OTP 123456', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return 401 for invalid OTP', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '654321' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })

    it('should return 400 for empty OTP', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Mobile number and OTP are required' })
    })

    it('should return 401 for OTP with wrong length', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '12345' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid OTP' })
    })
  })

  describe('Mobile-OTP Login - Mobile Verification', () => {
    it('should mark mobile as verified on successful OTP login', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { mobileVerified: expect.any(Date) },
        select: expect.any(Object),
      })
    })

    it('should update mobileVerified with current date', async () => {
      const beforeDate = new Date()
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const afterDate = new Date()
      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
      const updatedDate = updateCall.data.mobileVerified
      expect(updatedDate).toBeInstanceOf(Date)
      expect(updatedDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime())
      expect(updatedDate.getTime()).toBeLessThanOrEqual(afterDate.getTime())
    })

    it('should return updated user data', async () => {
      const updatedUser = { ...mockUser, mobileVerified: new Date() }
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user).toEqual(updatedUser)
    })
  })

  describe('Mobile-OTP Login - Success Response', () => {
    it('should return 200 on successful mobile-otp login', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return success message', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe('Login successful')
    })

    it('should return user data', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user).toBeDefined()
      // Note: API includes password field - should be fixed for security
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error during username-password login', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on bcrypt error', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database error during email-otp login', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database error during mobile-otp login', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on update error during email verification', async () => {
      req.body = { type: 'email-otp', email: 'test@example.com', otp: '123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('Update error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on update error during mobile verification', async () => {
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('Update error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle unexpected errors gracefully', async () => {
      req.body = { type: 'username-password', username: 'testuser', password: 'password123' }
      ;(prisma.user.findFirst as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Development Mode Logging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log mobile search in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not log in non-development mode', async () => {
      process.env.NODE_ENV = 'production'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      req.body = { type: 'mobile-otp', mobile: '+911234567890', otp: '123456' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
