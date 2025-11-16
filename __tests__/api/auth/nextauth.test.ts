import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

// Mock PrismaAdapter
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}))

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Configuration Structure', () => {
    it('should export authOptions', () => {
      expect(authOptions).toBeDefined()
    })

    it('should have adapter configured', () => {
      expect(authOptions.adapter).toBeDefined()
    })

    it('should have providers array', () => {
      expect(authOptions.providers).toBeDefined()
      expect(Array.isArray(authOptions.providers)).toBe(true)
    })

    it('should have session configuration', () => {
      expect(authOptions.session).toBeDefined()
    })

    it('should use JWT strategy for sessions', () => {
      expect(authOptions.session.strategy).toBe('jwt')
    })

    it('should have callbacks configured', () => {
      expect(authOptions.callbacks).toBeDefined()
    })

    it('should have jwt callback', () => {
      expect(authOptions.callbacks?.jwt).toBeDefined()
      expect(typeof authOptions.callbacks?.jwt).toBe('function')
    })

    it('should have session callback', () => {
      expect(authOptions.callbacks?.session).toBeDefined()
      expect(typeof authOptions.callbacks?.session).toBe('function')
    })

    it('should have pages configuration', () => {
      expect(authOptions.pages).toBeDefined()
    })

    it('should set signIn page to /login', () => {
      expect(authOptions.pages?.signIn).toBe('/login')
    })
  })

  describe('Providers Configuration', () => {
    it('should have exactly 2 providers', () => {
      expect(authOptions.providers).toHaveLength(2)
    })

    it('should have GoogleProvider configured', () => {
      const providers = authOptions.providers as any[]
      const googleProvider = providers.find(p => p.id === 'google')
      expect(googleProvider).toBeDefined()
    })

    it('should have CredentialsProvider configured', () => {
      const providers = authOptions.providers as any[]
      const credentialsProvider = providers.find(p => p.id === 'credentials')
      expect(credentialsProvider).toBeDefined()
    })

    it('should configure GoogleProvider with client credentials', () => {
      const providers = authOptions.providers as any[]
      const googleProvider = providers.find(p => p.id === 'google')
      expect(googleProvider?.options?.clientId).toBeDefined()
      expect(googleProvider?.options?.clientSecret).toBeDefined()
    })
  })

  describe('CredentialsProvider Configuration', () => {
    let credentialsProvider: any

    beforeEach(() => {
      const providers = authOptions.providers as any[]
      credentialsProvider = providers.find(p => p.id === 'credentials')
    })

    it('should have name set to credentials', () => {
      expect(credentialsProvider?.name).toBe('credentials')
    })

    it('should have credentials fields defined', () => {
      expect(credentialsProvider?.credentials).toBeDefined()
      expect(credentialsProvider?.credentials.identifier).toBeDefined()
      expect(credentialsProvider?.credentials.password).toBeDefined()
      expect(credentialsProvider?.credentials.otp).toBeDefined()
      expect(credentialsProvider?.credentials.loginType).toBeDefined()
    })

    it('should have authorize function', () => {
      expect(credentialsProvider?.authorize).toBeDefined()
      expect(typeof credentialsProvider?.authorize).toBe('function')
    })

    it('should have correct credential labels', () => {
      expect(credentialsProvider?.credentials.identifier.label).toBe('Email/Username/Mobile')
      expect(credentialsProvider?.credentials.password.label).toBe('Password')
      expect(credentialsProvider?.credentials.otp.label).toBe('OTP')
      expect(credentialsProvider?.credentials.loginType.label).toBe('Login Type')
    })

    it('should have correct credential types', () => {
      expect(credentialsProvider?.credentials.identifier.type).toBe('text')
      expect(credentialsProvider?.credentials.password.type).toBe('password')
      expect(credentialsProvider?.credentials.otp.type).toBe('text')
      expect(credentialsProvider?.credentials.loginType.type).toBe('text')
    })
  })

  describe('Credentials Authorize - Input Validation', () => {
    let authorize: any

    beforeEach(() => {
      const providers = authOptions.providers as any[]
      const credentialsProvider = providers.find(p => p.id === 'credentials')
      authorize = credentialsProvider?.authorize
    })

    it('should return null if identifier is missing', async () => {
      const result = await authorize({})
      expect(result).toBeNull()
    })

    it('should return null if identifier is empty string', async () => {
      const result = await authorize({ identifier: '' })
      expect(result).toBeNull()
    })

    it('should return null if identifier is undefined', async () => {
      const result = await authorize({ identifier: undefined })
      expect(result).toBeNull()
    })

    it('should handle missing credentials object', async () => {
      const result = await authorize(undefined)
      expect(result).toBeNull()
    })
  })

  describe('Credentials Authorize - OTP Login', () => {
    let authorize: any

    beforeEach(() => {
      const providers = authOptions.providers as any[]
      const credentialsProvider = providers.find(p => p.id === 'credentials')
      authorize = credentialsProvider?.authorize
    })

    it('should return null for invalid OTP', async () => {
      const result = await authorize({
        identifier: 'test@example.com',
        otp: '111111',
        loginType: 'otp',
      })
      expect(result).toBeNull()
    })

    it('should accept OTP 123456', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const result = await authorize({
        identifier: 'test@example.com',
        otp: '123456',
        loginType: 'otp',
      })
      expect(result).not.toBeNull()
    })

    it('should lookup user by email when identifier contains @', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await authorize({
        identifier: 'test@example.com',
        otp: '123456',
        loginType: 'otp',
      })
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should lookup user by phone when identifier does not contain @', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await authorize({
        identifier: '+911234567890',
        otp: '123456',
        loginType: 'otp',
      })
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '+911234567890' },
      })
    })

    it('should return null if user not found for OTP login', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await authorize({
        identifier: 'test@example.com',
        otp: '123456',
        loginType: 'otp',
      })
      expect(result).toBeNull()
    })

    it('should update emailVerified on successful email OTP login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await authorize({
        identifier: 'test@example.com',
        otp: '123456',
        loginType: 'otp',
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { emailVerified: expect.any(Date) },
      })
    })

    it('should update mobileVerified on successful mobile OTP login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      await authorize({
        identifier: '+911234567890',
        otp: '123456',
        loginType: 'otp',
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { mobileVerified: expect.any(Date) },
      })
    })

    it('should return user object on successful OTP login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const result = await authorize({
        identifier: 'test@example.com',
        otp: '123456',
        loginType: 'otp',
      })
      expect(result).toMatchObject({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        mobileNumber: '+911234567890',
      })
    })

    it('should handle user with no phone number', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const result = await authorize({
        identifier: 'test@example.com',
        otp: '123456',
        loginType: 'otp',
      })
      expect(result?.mobileNumber).toBe('')
    })
  })

  describe('Credentials Authorize - Password Login', () => {
    let authorize: any

    beforeEach(() => {
      const providers = authOptions.providers as any[]
      const credentialsProvider = providers.find(p => p.id === 'credentials')
      authorize = credentialsProvider?.authorize
    })

    it('should return null if password is missing', async () => {
      const result = await authorize({
        identifier: 'testuser',
      })
      expect(result).toBeNull()
    })

    it('should lookup user by username when @ not in identifier', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      })
    })

    it('should lookup user by email when @ in identifier', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await authorize({
        identifier: 'test@example.com',
        password: 'password123',
      })
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should return null if user not found', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(result).toBeNull()
    })

    it('should return null if user has no password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: null,
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      const result = await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(result).toBeNull()
    })

    it('should verify password with bcrypt', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword')
    })

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await authorize({
        identifier: 'testuser',
        password: 'wrongpassword',
      })
      expect(result).toBeNull()
    })

    it('should return user object on successful password login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(result).toMatchObject({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        mobileNumber: '+911234567890',
      })
    })

    it('should default loginType to password if not provided', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(result).not.toBeNull()
    })

    it('should handle user with no email', async () => {
      const mockUser = {
        id: '1',
        email: null,
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(result?.email).toBe(null)
    })

    it('should handle user with no name', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: null,
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await authorize({
        identifier: 'testuser',
        password: 'password123',
      })
      expect(result?.name).toBe(null)
    })
  })

  describe('JWT Callback', () => {
    let jwtCallback: any

    beforeEach(() => {
      jwtCallback = authOptions.callbacks?.jwt
    })

    it('should populate token on initial sign in', async () => {
      const token = {}
      const user = {
        role: 'BUYER',
        username: 'testuser',
        mobileNumber: '+911234567890',
      }

      const result = await jwtCallback({ token, user })
      expect(result.role).toBe('BUYER')
      expect(result.username).toBe('testuser')
      expect(result.mobileNumber).toBe('+911234567890')
    })

    it('should not populate token if user is not provided', async () => {
      const token = {}

      const result = await jwtCallback({ token })
      expect(result.role).toBeUndefined()
      expect(result.username).toBeUndefined()
      expect(result.mobileNumber).toBeUndefined()
    })

    it('should refresh token data on update trigger', async () => {
      const token = { sub: '1' }
      const dbUser = {
        role: 'AGENT',
        username: 'updateduser',
        phone: '+919999999999',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await jwtCallback({ token, trigger: 'update' })
      expect(result.role).toBe('AGENT')
      expect(result.username).toBe('updateduser')
      expect(result.mobileNumber).toBe('+919999999999')
    })

    it('should not refresh token if trigger is not update', async () => {
      const token = { sub: '1', role: 'BUYER' }

      const result = await jwtCallback({ token, trigger: 'signIn' })
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should not refresh token if sub is not present', async () => {
      const token = {}

      const result = await jwtCallback({ token, trigger: 'update' })
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should query correct user fields on update', async () => {
      const token = { sub: '1' }
      const dbUser = {
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      await jwtCallback({ token, trigger: 'update' })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          role: true,
          username: true,
          phone: true,
        },
      })
    })

    it('should handle missing user on update', async () => {
      const token = { sub: '1', role: 'BUYER' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await jwtCallback({ token, trigger: 'update' })
      expect(result.role).toBe('BUYER') // should keep existing token data
    })

    it('should return token unchanged if no updates needed', async () => {
      const token = { sub: '1', role: 'BUYER', username: 'testuser' }

      const result = await jwtCallback({ token })
      expect(result).toBe(token)
    })
  })

  describe('Session Callback', () => {
    let sessionCallback: any

    beforeEach(() => {
      sessionCallback = authOptions.callbacks?.session
    })

    it('should populate session user from database', async () => {
      const session = { user: {} }
      const token = { sub: '1' }
      const dbUser = {
        image: 'https://example.com/avatar.jpg',
        emailVerified: new Date(),
        mobileVerified: new Date(),
        companyName: 'ABC Corp',
        role: 'AGENT',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(result.user.id).toBe('1')
      expect(result.user.role).toBe('AGENT')
      expect(result.user.username).toBe('testuser')
      expect(result.user.mobileNumber).toBe('+911234567890')
      expect(result.user.image).toBe('https://example.com/avatar.jpg')
      expect(result.user.imageLink).toBe('https://example.com/avatar.jpg')
      expect(result.user.isEmailVerified).toBe(true)
      expect(result.user.isMobileVerified).toBe(true)
      expect(result.user.isAgent).toBe(true)
      expect(result.user.companyName).toBe('ABC Corp')
    })

    it('should query correct user fields', async () => {
      const session = { user: {} }
      const token = { sub: '1' }
      const dbUser = {
        image: null,
        emailVerified: null,
        mobileVerified: null,
        companyName: null,
        role: 'BUYER',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      await sessionCallback({ session, token })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          image: true,
          emailVerified: true,
          mobileVerified: true,
          companyName: true,
          role: true,
          username: true,
          phone: true,
        },
      })
    })

    it('should prefer token data over database data', async () => {
      const session = { user: {} }
      const token = {
        sub: '1',
        role: 'ADMIN',
        username: 'adminuser',
        mobileNumber: '+911111111111',
      }
      const dbUser = {
        image: null,
        emailVerified: null,
        mobileVerified: null,
        companyName: null,
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(result.user.role).toBe('ADMIN')
      expect(result.user.username).toBe('adminuser')
      expect(result.user.mobileNumber).toBe('+911111111111')
    })

    it('should use database data if token data is missing', async () => {
      const session = { user: {} }
      const token = { sub: '1' }
      const dbUser = {
        image: null,
        emailVerified: null,
        mobileVerified: null,
        companyName: null,
        role: 'BUYER',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(result.user.role).toBe('BUYER')
      expect(result.user.username).toBe('testuser')
      expect(result.user.mobileNumber).toBe('+911234567890')
    })

    it('should set isEmailVerified to false if emailVerified is null', async () => {
      const session = { user: {} }
      const token = { sub: '1' }
      const dbUser = {
        image: null,
        emailVerified: null,
        mobileVerified: null,
        companyName: null,
        role: 'BUYER',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(result.user.isEmailVerified).toBe(false)
    })

    it('should set isMobileVerified to false if mobileVerified is null', async () => {
      const session = { user: {} }
      const token = { sub: '1' }
      const dbUser = {
        image: null,
        emailVerified: null,
        mobileVerified: null,
        companyName: null,
        role: 'BUYER',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(result.user.isMobileVerified).toBe(false)
    })

    it('should set isAgent to true if role is AGENT', async () => {
      const session = { user: {} }
      const token = { sub: '1', role: 'AGENT' }
      const dbUser = {
        image: null,
        emailVerified: null,
        mobileVerified: null,
        companyName: null,
        role: 'AGENT',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(result.user.isAgent).toBe(true)
    })

    it('should set isAgent to false if role is not AGENT', async () => {
      const session = { user: {} }
      const token = { sub: '1', role: 'BUYER' }
      const dbUser = {
        image: null,
        emailVerified: null,
        mobileVerified: null,
        companyName: null,
        role: 'BUYER',
        username: 'testuser',
        phone: null,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(result.user.isAgent).toBe(false)
    })

    it('should handle missing database user', async () => {
      const session = { user: {} }
      const token = { sub: '1', role: 'BUYER', username: 'testuser', mobileNumber: '+911234567890' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await sessionCallback({ session, token })
      expect(result.user.id).toBe('1')
      expect(result.user.role).toBe('BUYER')
    })

    it('should return session unchanged if token.sub is missing', async () => {
      const session = { user: {} }
      const token = {}

      const result = await sessionCallback({ session, token })
      expect(result).toBe(session)
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should cast types correctly', async () => {
      const session = { user: {} }
      const token = { sub: '1' }
      const dbUser = {
        image: 'https://example.com/avatar.jpg',
        emailVerified: new Date(),
        mobileVerified: new Date(),
        companyName: 'ABC Corp',
        role: 'AGENT',
        username: 'testuser',
        phone: '+911234567890',
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

      const result = await sessionCallback({ session, token })
      expect(typeof result.user.role).toBe('string')
      expect(typeof result.user.username).toBe('string')
      expect(typeof result.user.mobileNumber).toBe('string')
      expect(typeof result.user.image).toBe('string')
      expect(typeof result.user.imageLink).toBe('string')
      expect(typeof result.user.isEmailVerified).toBe('boolean')
      expect(typeof result.user.isMobileVerified).toBe('boolean')
      expect(typeof result.user.isAgent).toBe('boolean')
      expect(typeof result.user.companyName).toBe('string')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    let authorize: any

    beforeEach(() => {
      const providers = authOptions.providers as any[]
      const credentialsProvider = providers.find(p => p.id === 'credentials')
      authorize = credentialsProvider?.authorize
    })

    it('should handle database errors gracefully in authorize', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await expect(
        authorize({
          identifier: 'testuser',
          password: 'password123',
        })
      ).rejects.toThrow('Database error')
    })

    it('should handle bcrypt errors gracefully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'BUYER',
        username: 'testuser',
        phone: null,
        password: 'hashedPassword',
      }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'))

      await expect(
        authorize({
          identifier: 'testuser',
          password: 'password123',
        })
      ).rejects.toThrow('Bcrypt error')
    })

    it('should handle database errors in jwt callback', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await expect(jwtCallback({ token: { sub: '1' }, trigger: 'update' })).rejects.toThrow(
        'Database error'
      )
    })

    it('should handle database errors in session callback', async () => {
      const sessionCallback = authOptions.callbacks?.session
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await expect(sessionCallback({ session: { user: {} }, token: { sub: '1' } })).rejects.toThrow(
        'Database error'
      )
    })
  })
})
