import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/auth/signup'
import { prisma } from '@/lib/cockroachDB/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

describe('POST /api/auth/signup', () => {
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
    }
    res = {
      status: statusMock,
    }
    jest.clearAllMocks()
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
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })
  })

  describe('Request Body Validation - Missing Fields', () => {
    it('should return 400 if firstName is missing', async () => {
      req.body = {
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All required fields must be provided' })
    })

    it('should return 400 if lastName is missing', async () => {
      req.body = {
        firstName: 'John',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All required fields must be provided' })
    })

    it('should return 400 if username is missing', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All required fields must be provided' })
    })

    it('should return 400 if email is missing', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All required fields must be provided' })
    })

    it('should return 400 if mobileNumber is missing', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All required fields must be provided' })
    })

    it('should return 400 if password is missing', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All required fields must be provided' })
    })

    it('should return 400 if all fields are missing', async () => {
      req.body = {}
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All required fields must be provided' })
    })
  })

  describe('Agent-Specific Validation', () => {
    it('should return 400 if companyName is missing for agents', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        isAgent: true,
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Company name is required for agents' })
    })

    it('should return 400 if companyName is empty string for agents', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        isAgent: true,
        companyName: '',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Company name is required for agents' })
    })

    it('should return 400 if companyName is only whitespace for agents', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        isAgent: true,
        companyName: '   ',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Company name is required for agents' })
    })

    it('should accept valid companyName for agents', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        isAgent: true,
        companyName: 'ABC Realty',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'AGENT',
        companyName: 'ABC Realty',
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should allow non-agents without companyName', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        isAgent: false,
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })
  })

  describe('Username Validation', () => {
    it('should return 400 if username is empty string', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: '',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Username must be at least 3 characters long',
      })
    })

    it('should return 400 if username is only whitespace', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: '   ',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Username must be at least 3 characters long',
      })
    })

    it('should return 400 if username is less than 3 characters', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'ab',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Username must be at least 3 characters long',
      })
    })

    it('should accept username with exactly 3 characters', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'abc',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'abc',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should accept long usernames', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'verylongusername12345',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'verylongusername12345',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })
  })

  describe('Email Validation', () => {
    it('should return 400 if email is invalid format', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'invalid-email',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format' })
    })

    it('should return 400 if email is missing @ symbol', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john.example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format' })
    })

    it('should return 400 if email has no domain', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format' })
    })

    it('should return 400 if email has no local part', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: '@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format' })
    })

    it('should trim whitespace from email', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: '  john@example.com  ',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example.org',
      ]

      for (const email of validEmails) {
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe' + Math.random(),
          email,
          mobileNumber: '+911234567890',
          password: 'password123',
        }
        ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
        ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
        ;(prisma.user.create as jest.Mock).mockResolvedValue({
          id: '1',
          username: req.body.username,
          name: 'John Doe',
          email,
          phone: '+911234567890',
          role: 'BUYER',
          companyName: null,
          image: null,
          emailVerified: null,
          createdAt: new Date(),
        })

        await handler(req as NextApiRequest, res as NextApiResponse)
        expect(statusMock).toHaveBeenCalledWith(201)
        jest.clearAllMocks()
      }
    })
  })

  describe('Mobile Number Validation', () => {
    it('should return 400 if mobile number is too short', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '123456',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Please enter a valid mobile number' })
    })

    it('should return 400 if mobile number is too long', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '1234567890123456',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Please enter a valid mobile number' })
    })

    it('should return 400 if mobile number is all zeros', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '0000000000',
        password: 'password123',
      }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Please enter a valid mobile number' })
    })

    it('should accept valid mobile numbers with country code', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should accept mobile numbers with dashes', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+91-123-456-7890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91-123-456-7890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should accept mobile numbers with spaces', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+91 123 456 7890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91 123 456 7890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should accept mobile numbers with parentheses', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+91(123)4567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91(123)4567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })
  })

  describe('Username Uniqueness Check', () => {
    it('should return 409 if username already exists', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'existinguser',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({ id: '123' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(409)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Username is already taken' })
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'existinguser' },
        select: { id: true },
      })
    })

    it('should proceed if username is unique', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'uniqueuser',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'uniqueuser',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })
  })

  describe('Email Uniqueness Check', () => {
    it('should return 409 if verified email already exists', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'existing@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce({ id: '123' }) // email check

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(409)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Email is already registered and verified',
      })
    })

    it('should allow signup if email exists but is not verified', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'unverified@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'unverified@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should check for emailVerified not null', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'test@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce({ id: '123' }) // email check with verified

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          email: 'test@example.com',
          emailVerified: { not: null },
        },
        select: { id: true },
      })
    })
  })

  describe('Mobile Number Uniqueness Check', () => {
    it('should return 409 if verified mobile already exists', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: '123' }) // mobile check

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(409)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mobile number is already registered and verified',
      })
    })

    it('should allow signup if mobile exists but is not verified', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should check for mobileVerified not null', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: '123' }) // mobile check

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenNthCalledWith(3, {
        where: {
          phone: '+911234567890',
          mobileVerified: { not: null },
        },
        select: { id: true },
      })
    })
  })

  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'plainpassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 12)
    })

    it('should use bcrypt with salt rounds of 12', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const callArgs = (bcrypt.hash as jest.Mock).mock.calls[0]
      expect(callArgs[1]).toBe(12)
    })
  })

  describe('User Creation', () => {
    it('should create BUYER user when isAgent is false', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        isAgent: false,
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'johndoe',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+911234567890',
          password: 'hashedPassword',
          role: 'BUYER',
          companyName: null,
          image: null,
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          companyName: true,
          image: true,
          emailVerified: true,
          createdAt: true,
        },
      })
    })

    it('should create AGENT user when isAgent is true', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        isAgent: true,
        companyName: 'ABC Realty',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'AGENT',
        companyName: 'ABC Realty',
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'johndoe',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+911234567890',
          password: 'hashedPassword',
          role: 'AGENT',
          companyName: 'ABC Realty',
          image: null,
        },
        select: expect.any(Object),
      })
    })

    it('should combine firstName and lastName into name', async () => {
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'janesmith',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.name).toBe('Jane Smith')
    })

    it('should save imageLink if provided', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
        imageLink: 'https://example.com/avatar.jpg',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: 'https://example.com/avatar.jpg',
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.image).toBe('https://example.com/avatar.jpg')
    })

    it('should set image to null if imageLink not provided', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.image).toBeNull()
    })
  })

  describe('Successful Response', () => {
    it('should return 201 status on successful signup', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(201)
    })

    it('should return success message', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User created successfully',
        user: expect.any(Object),
      })
    })

    it('should return created user data', async () => {
      const createdUser = {
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      }
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue(createdUser)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User created successfully',
        user: createdUser,
      })
    })

    it('should not return password in response', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+911234567890',
        role: 'BUYER',
        companyName: null,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user.password).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error during username check', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on bcrypt error', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database error during user creation', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle unexpected errors gracefully', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        mobileNumber: '+911234567890',
        password: 'password123',
      }
      ;(prisma.user.findFirst as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })
})
