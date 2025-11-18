import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/projects/archive'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('/api/projects/archive', () => {
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

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    postedByUserId: 'user-123',
    isArchived: false,
  }

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'POST',
      body: { projectId: 'project-123' },
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    ;(prisma.project.update as jest.Mock).mockResolvedValue({
      ...mockProject,
      isArchived: true,
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

  describe('Project ID Validation', () => {
    it('should return 400 when projectId is missing', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Project ID is required' })
    })

    it('should return 400 when projectId is null', async () => {
      req.body = { projectId: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Project ID is required' })
    })

    it('should return 400 when projectId is empty string', async () => {
      req.body = { projectId: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Project ID is required' })
    })

    it('should accept valid projectId', async () => {
      req.body = { projectId: 'project-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Project Existence Validation', () => {
    it('should return 404 when project not found', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Project not found' })
    })

    it('should fetch project with correct query', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
      })
    })
  })

  describe('Ownership Validation', () => {
    it('should return 403 when user does not own project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        postedByUserId: 'different-user-id',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'You do not have permission to archive this project',
      })
    })

    it('should allow owner to archive', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        postedByUserId: mockSession.user.id,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Archive Functionality', () => {
    it('should archive project when isArchived is not provided', async () => {
      req.body = { projectId: 'project-123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: true },
      })
    })

    it('should archive project when isArchived is true', async () => {
      req.body = { projectId: 'project-123', isArchived: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: true },
      })
    })

    it('should restore project when isArchived is false', async () => {
      req.body = { projectId: 'project-123', isArchived: false }
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: false,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: false },
      })
    })

    it('should return success message when archiving', async () => {
      req.body = { projectId: 'project-123', isArchived: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Project archived successfully',
        project: expect.objectContaining({
          id: 'project-123',
          isArchived: true,
        }),
      })
    })

    it('should return success message when restoring', async () => {
      req.body = { projectId: 'project-123', isArchived: false }
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: false,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Project restored successfully',
        project: expect.objectContaining({
          id: 'project-123',
          isArchived: false,
        }),
      })
    })

    it('should return updated project in response', async () => {
      const updatedProject = {
        ...mockProject,
        isArchived: true,
      }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Project archived successfully',
        project: updatedProject,
      })
    })
  })

  describe('Request Body Variations', () => {
    it('should handle undefined isArchived as archive', async () => {
      req.body = { projectId: 'project-123', isArchived: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: true },
      })
    })

    it('should handle null isArchived', async () => {
      req.body = { projectId: 'project-123', isArchived: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalled()
    })

    it('should handle boolean true for isArchived', async () => {
      req.body = { projectId: 'project-123', isArchived: true }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: true },
      })
    })

    it('should handle boolean false for isArchived', async () => {
      req.body = { projectId: 'project-123', isArchived: false }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: false },
      })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when project fetch fails', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: undefined,
      })
    })

    it('should return 500 when project update fails', async () => {
      ;(prisma.project.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const testError = new Error('Test error')
      ;(prisma.project.findUnique as jest.Mock).mockRejectedValue(testError)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: testError,
      })
      process.env.NODE_ENV = originalEnv
    })

    it('should handle session retrieval error', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long project IDs', async () => {
      const longId = 'a'.repeat(500)
      req.body = { projectId: longId }
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        id: longId,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: longId },
      })
    })

    it('should handle UUID format project IDs', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      req.body = { projectId: uuid }
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        id: uuid,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: uuid },
      })
    })

    it('should handle archiving already archived project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: true,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle restoring already active project', async () => {
      req.body = { projectId: 'project-123', isArchived: false }
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: false,
      })
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: false,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })
})
