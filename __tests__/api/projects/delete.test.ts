import { createMocks } from 'node-mocks-http'
import { PrismaClient } from '@prisma/client'

// Create mock Prisma instance
const mockPrisma = {
  project: {
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn().mockResolvedValue(undefined),
}

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import handler after mocking
import handler from '@/pages/api/projects/delete'

describe('/api/projects/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should accept DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(405)
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when projectId is missing', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project ID is required' })
    })

    it('should return 400 when projectId is null', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: null },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project ID is required' })
    })

    it('should return 400 when projectId is undefined', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: undefined },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project ID is required' })
    })

    it('should return 400 when projectId is empty string', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: '' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project ID is required' })
    })

    it('should pass validation with valid projectId', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('Project Existence Check', () => {
    it('should return 404 when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'nonexistent-id' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project not found' })
    })

    it('should call findUnique with correct projectId', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        select: { name: true },
      })
    })

    it('should continue when project exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue({ id: 'project-123', name: 'Test Project' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Project Deletion', () => {
    it('should delete project successfully', async () => {
      const mockProject = { id: 'project-123', name: 'Test Project' }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-123' },
      })
    })

    it('should return 200 on successful deletion', async () => {
      const mockProject = { id: 'project-123', name: 'Test Project' }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should return success message', async () => {
      const mockProject = { id: 'project-123', name: 'Test Project' }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Project deleted successfully')
    })

    it('should return deleted project data', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test Description',
      }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.project).toEqual(mockProject)
    })
  })

  describe('Prisma Disconnect', () => {
    it('should disconnect from database after successful deletion', async () => {
      const mockProject = { id: 'project-123', name: 'Test Project' }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })

    it('should disconnect from database after error', async () => {
      mockPrisma.project.findUnique.mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })

    it('should disconnect when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })

    it('should disconnect when validation fails', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        body: {},
      })

      await handler(req, res)

      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error during findUnique', async () => {
      mockPrisma.project.findUnique.mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toHaveProperty('message', 'Internal server error')
    })

    it('should return 500 on database error during delete', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockRejectedValue(new Error('Delete error'))

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toHaveProperty('message', 'Internal server error')
    })

    it('should include error details in development environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      mockPrisma.project.findUnique.mockRejectedValue(error)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('error')

      process.env.NODE_ENV = originalEnv
    })

    it('should not include error details in production environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      mockPrisma.project.findUnique.mockRejectedValue(new Error('Test error'))

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.error).toBeUndefined()

      process.env.NODE_ENV = originalEnv
    })

    it('should handle unexpected errors gracefully', async () => {
      mockPrisma.project.findUnique.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Different Project IDs', () => {
    it('should handle UUID format project IDs', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue({ id: uuid, name: 'Test Project' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: uuid },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: uuid },
        select: { name: true },
      })
    })

    it('should handle short alphanumeric IDs', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue({ id: 'abc123', name: 'Test Project' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'abc123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle long project IDs', async () => {
      const longId = 'a'.repeat(100)
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue({ id: longId, name: 'Test Project' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: longId },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Response Structure', () => {
    it('should have message and project in response', async () => {
      const mockProject = { id: 'project-123', name: 'Test Project' }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('project')
    })

    it('should return full deleted project object', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test Description',
        builderId: 'builder-123',
        locationId: 'location-123',
        isArchived: false,
      }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.project).toEqual(mockProject)
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in projectId', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-@#$%' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })

    it('should handle numeric projectId', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue({ id: 123, name: 'Test Project' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 123 },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle whitespace in projectId', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: '   ' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle extra fields in request body', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue({ id: 'project-123', name: 'Test Project' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: {
          projectId: 'project-123',
          extraField: 'should be ignored',
          anotherField: 'also ignored',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Cascade Deletion Scenarios', () => {
    it('should delete project even with related data (cascade)', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        agents: [],
        properties: [],
      }
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle foreign key constraint errors', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockRejectedValue(new Error('Foreign key constraint failed'))

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Multiple Deletion Attempts', () => {
    it('should fail to delete already deleted project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'deleted-project' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(mockPrisma.project.delete).not.toHaveBeenCalled()
    })

    it('should not call delete when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'nonexistent-id' },
      })

      await handler(req, res)

      expect(mockPrisma.project.delete).not.toHaveBeenCalled()
    })
  })

  describe('Request Body Variations', () => {
    it('should handle projectId in different casing', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { ProjectId: 'project-123' },
      })

      await handler(req, res)

      // Should fail because it expects projectId not ProjectId
      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle only projectId field correctly', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ name: 'Test Project' })
      mockPrisma.project.delete.mockResolvedValue({ id: 'project-123', name: 'Test Project' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: { projectId: 'project-123' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })
})
