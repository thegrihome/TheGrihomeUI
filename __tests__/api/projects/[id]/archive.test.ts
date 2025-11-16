import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/archive'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/projects/[id]/archive', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  }

  const mockProject = {
    id: 'project-123',
    postedByUserId: 'user-123',
    isArchived: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should accept PATCH method', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(405)
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return 401 when session has no user ID', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: {} })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('Project ID Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when id is missing', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: {},
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project ID is required' })
    })

    it('should return 400 when id is not a string', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: ['array'] },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should accept valid string id', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('isArchived Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when isArchived is missing', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'isArchived must be a boolean' })
    })

    it('should return 400 when isArchived is not a boolean', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: 'true' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'isArchived must be a boolean' })
    })

    it('should return 400 when isArchived is null', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: null },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should return 400 when isArchived is number', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: 1 },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should accept true boolean value', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.project.update as jest.Mock).mockResolvedValue({ ...mockProject, isArchived: true })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should accept false boolean value', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({ ...mockProject, isArchived: true })
      ;(prisma.project.update as jest.Mock).mockResolvedValue({ ...mockProject, isArchived: false })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: false },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Project Existence Check', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 404 when project does not exist', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'nonexistent' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project not found' })
    })

    it('should call findUnique with correct parameters', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        select: {
          postedByUserId: true,
          isArchived: true,
        },
      })
    })
  })

  describe('Ownership Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 403 when user does not own project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        postedByUserId: 'different-user',
      })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'You do not have permission to modify this project',
      })
    })

    it('should continue when user owns project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.project.update as jest.Mock).mockResolvedValue({ ...mockProject, isArchived: true })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Archive Project', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should archive project when isArchived is true', async () => {
      const archivedProject = { ...mockProject, isArchived: true, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(archivedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: true },
        include: {
          location: true,
          builder: true,
        },
      })
    })

    it('should return correct message when archiving', async () => {
      const archivedProject = { ...mockProject, isArchived: true, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(archivedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Project archived successfully')
    })

    it('should return archived project in response', async () => {
      const archivedProject = { ...mockProject, isArchived: true, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(archivedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.project).toEqual(archivedProject)
    })
  })

  describe('Unarchive Project', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({ ...mockProject, isArchived: true })
    })

    it('should unarchive project when isArchived is false', async () => {
      const unarchivedProject = { ...mockProject, isArchived: false, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(unarchivedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: false },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: { isArchived: false },
        include: {
          location: true,
          builder: true,
        },
      })
    })

    it('should return correct message when unarchiving', async () => {
      const unarchivedProject = { ...mockProject, isArchived: false, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(unarchivedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: false },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Project unarchived successfully')
    })

    it('should return unarchived project in response', async () => {
      const unarchivedProject = { ...mockProject, isArchived: false, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(unarchivedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: false },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.project).toEqual(unarchivedProject)
    })
  })

  describe('Response Structure', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should return 200 status on success', async () => {
      const updatedProject = { ...mockProject, isArchived: true, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should include message and project in response', async () => {
      const updatedProject = { ...mockProject, isArchived: true, location: {}, builder: {} }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('project')
    })

    it('should include location in response', async () => {
      const updatedProject = {
        ...mockProject,
        isArchived: true,
        location: { id: 'loc-1', city: 'Mumbai' },
        builder: {},
      }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.project).toHaveProperty('location')
    })

    it('should include builder in response', async () => {
      const updatedProject = {
        ...mockProject,
        isArchived: true,
        location: {},
        builder: { id: 'b-1', name: 'Builder' },
      }
      ;(prisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.project).toHaveProperty('builder')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 500 on database error during findUnique', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' })
    })

    it('should return 500 on database error during update', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.project.update as jest.Mock).mockRejectedValue(new Error('Update error'))

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should handle unexpected errors', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should handle archiving already archived project', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({ ...mockProject, isArchived: true })
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: true,
        location: {},
        builder: {},
      })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle unarchiving already unarchived project', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: false,
        location: {},
        builder: {},
      })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: false },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle extra fields in request body', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: true,
        location: {},
        builder: {},
      })

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: {
          isArchived: true,
          extraField: 'should be ignored',
        },
      })

      await handler(req, res)

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isArchived: true },
        })
      )
    })
  })

  describe('Multiple Operations', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should allow archiving then unarchiving', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: true,
        location: {},
        builder: {},
      })

      const { req: req1, res: res1 } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: true },
      })

      await handler(req1, res1)

      expect(res1._getStatusCode()).toBe(200)

      // Now unarchive
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({ ...mockProject, isArchived: true })
      ;(prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        isArchived: false,
        location: {},
        builder: {},
      })

      const { req: req2, res: res2 } = createMocks({
        method: 'PATCH',
        query: { id: 'project-123' },
        body: { isArchived: false },
      })

      await handler(req2, res2)

      expect(res2._getStatusCode()).toBe(200)
    })
  })
})
