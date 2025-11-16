import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { put } from '@vercel/blob'
import handler from '@/pages/api/user/update-avatar'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}))

describe('/api/user/update-avatar', () => {
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
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Authentication', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
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

    it('should return 401 when session user has no email', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {},
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user email is empty string', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: '' },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should pass authentication with valid session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
    })

    it('should return 400 when imageData is missing', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Image data is required' })
    })

    it('should return 400 when imageData is null', async () => {
      req.body = { imageData: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Image data is required' })
    })

    it('should return 400 when imageData is empty string', async () => {
      req.body = { imageData: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Image data is required' })
    })

    it('should return 400 when imageData is undefined', async () => {
      req.body = { imageData: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Image data is required' })
    })

    it('should return 400 when imageData is not base64 format', async () => {
      req.body = { imageData: 'not-a-base64-image' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid image format' })
    })

    it('should return 400 when imageData does not start with data:image/', async () => {
      req.body = { imageData: 'base64,abcdefgh' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid image format' })
    })

    it('should accept valid JPEG base64 image', async () => {
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should accept valid PNG base64 image', async () => {
      req.body = { imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' }
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.png',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should accept valid GIF base64 image', async () => {
      req.body = { imageData: 'data:image/gif;base64,R0lGODlhAQABAIAAAP===' }
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.gif',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should accept valid WebP base64 image', async () => {
      req.body = { imageData: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAw==' }
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.webp',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(400)
    })
  })

  describe('Base64 to Buffer Conversion', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
    })

    it('should convert JPEG base64 to buffer', async () => {
      const base64Data = '/9j/4AAQSkZJRg=='
      req.body = { imageData: `data:image/jpeg;base64,${base64Data}` }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(expect.any(String), expect.any(Buffer), expect.any(Object))
    })

    it('should convert PNG base64 to buffer', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUg=='
      req.body = { imageData: `data:image/png;base64,${base64Data}` }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(expect.any(String), expect.any(Buffer), expect.any(Object))
    })

    it('should strip data:image prefix before conversion', async () => {
      const base64Data = '/9j/4AAQSkZJRg=='
      req.body = { imageData: `data:image/jpeg;base64,${base64Data}` }

      await handler(req as NextApiRequest, res as NextApiResponse)

      const buffer = (put as jest.Mock).mock.calls[0][1]
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })
  })

  describe('Vercel Blob Upload', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
    })

    it('should upload to Vercel Blob with correct filename pattern', async () => {
      const mockTimestamp = 1234567890
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp)
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(
        `user-avatars/user-1-${mockTimestamp}.jpg`,
        expect.any(Buffer),
        expect.objectContaining({
          access: 'public',
          contentType: 'image/jpeg',
        })
      )

      jest.restoreAllMocks()
    })

    it('should use user id in filename when available', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-123' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('user-123'),
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should use email in filename when id not available', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com'),
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should set access to public', async () => {
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        expect.objectContaining({
          access: 'public',
        })
      )
    })

    it('should set contentType to image/jpeg', async () => {
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      )
    })

    it('should upload to user-avatars directory', async () => {
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('user-avatars/'),
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should use .jpg extension', async () => {
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalledWith(
        expect.stringMatching(/\.jpg$/),
        expect.any(Buffer),
        expect.any(Object)
      )
    })
  })

  describe('User Update', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
    })

    it('should update user with blob URL', async () => {
      const blobUrl = 'https://blob.vercel-storage.com/avatar-xyz.jpg'
      ;(put as jest.Mock).mockResolvedValue({ url: blobUrl })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        image: blobUrl,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { image: blobUrl },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          image: true,
        },
      })
    })

    it('should query user by session email', async () => {
      const email = 'user@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email, id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
        })
      )
    })

    it('should select specific user fields', async () => {
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            image: true,
          },
        })
      )
    })

    it('should return updated user in response', async () => {
      const updatedUser = {
        id: 'user-1',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://blob.example.com/avatar.jpg',
      }

      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ user: updatedUser })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
    })

    it('should return 500 on session error', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on Vercel Blob upload error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockRejectedValue(new Error('Upload failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database update error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('Database update failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on buffer conversion error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      req.body = { imageData: 'data:image/jpeg;base64,invalid-base64!!!' }
      ;(put as jest.Mock).mockRejectedValue(new Error('Buffer conversion failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle network error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockRejectedValue(new Error('Network error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle timeout error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Large Image Handling', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
    })

    it('should handle large base64 image', async () => {
      const largeBase64 = 'A'.repeat(10000)
      req.body = { imageData: `data:image/jpeg;base64,${largeBase64}` }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalled()
    })

    it('should handle very large base64 image (near 10mb)', async () => {
      const veryLargeBase64 = 'A'.repeat(10 * 1024 * 1024)
      req.body = { imageData: `data:image/jpeg;base64,${veryLargeBase64}` }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(put).toHaveBeenCalled()
    })
  })

  describe('Different Image Formats', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
    })

    it('should handle image/jpg format', async () => {
      req.body = { imageData: 'data:image/jpg;base64,/9j/4AAQSkZJRg==' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle image/bmp format', async () => {
      req.body = { imageData: 'data:image/bmp;base64,Qk0eAAAAAAAAAD4=' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle image/svg+xml format', async () => {
      req.body = { imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0=' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
    })

    it('should handle email with special characters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test+tag@example.com', id: 'user-1' },
      })
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle user with no username', async () => {
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        username: null,
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle user with no name', async () => {
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        name: null,
        email: 'test@example.com',
        image: 'https://blob.example.com/avatar.jpg',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
    })

    it('should return 200 status on success', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return user object in response', async () => {
      const user = {
        id: 'user-1',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://blob.example.com/avatar.jpg',
      }
      ;(prisma.user.update as jest.Mock).mockResolvedValue(user)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({ user })
    })

    it('should not return password in response', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.user).not.toHaveProperty('password')
    })
  })

  describe('Concurrent Uploads', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-1' },
      })
      ;(put as jest.Mock).mockResolvedValue({
        url: 'https://blob.example.com/avatar.jpg',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })
    })

    it('should handle multiple simultaneous avatar uploads', async () => {
      const promises = [
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
      ]

      await Promise.all(promises)

      expect(put).toHaveBeenCalledTimes(3)
      expect(prisma.user.update).toHaveBeenCalledTimes(3)
    })
  })
})
