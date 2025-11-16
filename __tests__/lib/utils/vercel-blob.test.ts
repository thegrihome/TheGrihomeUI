import {
  uploadProjectImage,
  uploadMultipleProjectImages,
  uploadPropertyImage,
} from '@/lib/utils/vercel-blob'
import { put } from '@vercel/blob'

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}))

describe('lib/utils/vercel-blob', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('uploadProjectImage', () => {
    const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

    it('should upload a banner image successfully', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test-banner.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadProjectImage({
        projectName: 'Luxury Apartments',
        folder: 'banner',
        base64Image: validBase64,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/luxury-apartments/banner.jpeg',
        expect.any(Buffer),
        expect.objectContaining({
          access: 'public',
          contentType: 'image/jpeg',
        })
      )
      expect(result).toBe(mockUrl)
    })

    it('should upload a logo image successfully', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test-logo.png'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadProjectImage({
        projectName: 'Premium Villas',
        folder: 'logo',
        base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA==',
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/premium-villas/logo.png',
        expect.any(Buffer),
        expect.objectContaining({
          access: 'public',
          contentType: 'image/png',
        })
      )
      expect(result).toBe(mockUrl)
    })

    it('should upload a layout image successfully', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test-layout.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadProjectImage({
        projectName: 'Test Project',
        folder: 'layout',
        base64Image: validBase64,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/test-project/layout.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(result).toBe(mockUrl)
    })

    it('should upload clubhouse images with index', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test-clubhouse.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadProjectImage({
        projectName: 'Test Project',
        folder: 'clubhouse',
        base64Image: validBase64,
        index: 0,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/test-project/clubhouse/clubhouse-0.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(result).toBe(mockUrl)
    })

    it('should upload floorplans images with index', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test-floorplan.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadProjectImage({
        projectName: 'Test Project',
        folder: 'floorplans',
        base64Image: validBase64,
        index: 2,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/test-project/floorplans/floorplans-2.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(result).toBe(mockUrl)
    })

    it('should upload gallery images with index', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test-gallery.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadProjectImage({
        projectName: 'Test Project',
        folder: 'gallery',
        base64Image: validBase64,
        index: 5,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/test-project/gallery/gallery-5.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(result).toBe(mockUrl)
    })

    it('should use timestamp as index if not provided for subfolder images', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test-clubhouse.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const beforeTime = Date.now()
      await uploadProjectImage({
        projectName: 'Test Project',
        folder: 'clubhouse',
        base64Image: validBase64,
      })
      const afterTime = Date.now()

      const callArgs = (put as jest.Mock).mock.calls[0]
      const filename = callArgs[0]
      const timestamp = parseInt(filename.split('clubhouse-')[1].split('.')[0])

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(afterTime)
    })

    it('should normalize project name with spaces', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadProjectImage({
        projectName: 'Luxury Beach Apartments',
        folder: 'banner',
        base64Image: validBase64,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/luxury-beach-apartments/banner.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should normalize project name with special characters', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadProjectImage({
        projectName: 'Premium@Villas & Apartments!',
        folder: 'banner',
        base64Image: validBase64,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/premiumvillas--apartments/banner.jpeg', // Double dash from normalization
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should convert project name to lowercase', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadProjectImage({
        projectName: 'LUXURY APARTMENTS',
        folder: 'banner',
        base64Image: validBase64,
      })

      expect(put).toHaveBeenCalledWith(
        'hyderabad-projects/luxury-apartments/banner.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should throw error for invalid base64 image', async () => {
      await expect(
        uploadProjectImage({
          projectName: 'Test Project',
          folder: 'banner',
          base64Image: 'not-a-valid-base64',
        })
      ).rejects.toThrow('Invalid image data')
    })

    it('should throw error for empty base64 string', async () => {
      await expect(
        uploadProjectImage({
          projectName: 'Test Project',
          folder: 'banner',
          base64Image: '',
        })
      ).rejects.toThrow('Invalid image data')
    })

    it('should handle PNG images', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test.png'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadProjectImage({
        projectName: 'Test',
        folder: 'banner',
        base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA==',
      })

      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('.png'),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/png',
        })
      )
    })

    it('should handle WebP images', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test.webp'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadProjectImage({
        projectName: 'Test',
        folder: 'banner',
        base64Image: 'data:image/webp;base64,UklGRiQAAABXRUJQ',
      })

      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('.webp'),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/webp',
        })
      )
    })

    it('should create proper buffer from base64 data', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/test.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadProjectImage({
        projectName: 'Test',
        folder: 'banner',
        base64Image: validBase64,
      })

      const callArgs = (put as jest.Mock).mock.calls[0]
      const buffer = callArgs[1]

      expect(buffer).toBeInstanceOf(Buffer)
    })
  })

  describe('uploadMultipleProjectImages', () => {
    const validBase64_1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    const validBase64_2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA=='
    const validBase64_3 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==ABCD'

    it('should upload multiple clubhouse images', async () => {
      const mockUrls = [
        'https://blob.vercel-storage.com/clubhouse-0.jpeg',
        'https://blob.vercel-storage.com/clubhouse-1.png',
        'https://blob.vercel-storage.com/clubhouse-2.jpeg',
      ]

      ;(put as jest.Mock)
        .mockResolvedValueOnce({ url: mockUrls[0] })
        .mockResolvedValueOnce({ url: mockUrls[1] })
        .mockResolvedValueOnce({ url: mockUrls[2] })

      const result = await uploadMultipleProjectImages('Test Project', 'clubhouse', [
        validBase64_1,
        validBase64_2,
        validBase64_3,
      ])

      expect(result).toEqual(mockUrls)
      expect(put).toHaveBeenCalledTimes(3)
    })

    it('should upload multiple floorplan images with correct indices', async () => {
      ;(put as jest.Mock).mockResolvedValue({ url: 'https://test.com/image.jpeg' })

      await uploadMultipleProjectImages('Test Project', 'floorplans', [
        validBase64_1,
        validBase64_2,
      ])

      expect(put).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('floorplans-0'),
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(put).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('floorplans-1'),
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should upload multiple gallery images', async () => {
      const mockUrls = ['url1', 'url2', 'url3', 'url4']

      ;(put as jest.Mock)
        .mockResolvedValueOnce({ url: mockUrls[0] })
        .mockResolvedValueOnce({ url: mockUrls[1] })
        .mockResolvedValueOnce({ url: mockUrls[2] })
        .mockResolvedValueOnce({ url: mockUrls[3] })

      const result = await uploadMultipleProjectImages('Test Project', 'gallery', [
        validBase64_1,
        validBase64_2,
        validBase64_3,
        validBase64_1,
      ])

      expect(result).toEqual(mockUrls)
      expect(put).toHaveBeenCalledTimes(4)
    })

    it('should handle empty array', async () => {
      const result = await uploadMultipleProjectImages('Test Project', 'clubhouse', [])

      expect(result).toEqual([])
      expect(put).not.toHaveBeenCalled()
    })

    it('should handle single image', async () => {
      const mockUrl = 'https://test.com/image.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadMultipleProjectImages('Test Project', 'gallery', [validBase64_1])

      expect(result).toEqual([mockUrl])
      expect(put).toHaveBeenCalledTimes(1)
    })

    it('should reject if any upload fails', async () => {
      ;(put as jest.Mock)
        .mockResolvedValueOnce({ url: 'url1' })
        .mockRejectedValueOnce(new Error('Upload failed'))

      await expect(
        uploadMultipleProjectImages('Test Project', 'clubhouse', [validBase64_1, validBase64_2])
      ).rejects.toThrow('Upload failed')
    })
  })

  describe('uploadPropertyImage', () => {
    const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

    it('should upload property image with index', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/property-image.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const result = await uploadPropertyImage('property-123', validBase64, 0)

      expect(put).toHaveBeenCalledWith(
        'properties/property-123/image-0.jpeg',
        expect.any(Buffer),
        expect.objectContaining({
          access: 'public',
          contentType: 'image/jpeg',
        })
      )
      expect(result).toBe(mockUrl)
    })

    it('should upload property image without index', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/property-image.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      const beforeTime = Date.now()
      await uploadPropertyImage('property-456', validBase64)
      const afterTime = Date.now()

      const callArgs = (put as jest.Mock).mock.calls[0]
      const filename = callArgs[0]
      const timestamp = parseInt(filename.split('image-')[1].split('.')[0])

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(afterTime)
    })

    it('should throw error for invalid base64 image', async () => {
      await expect(uploadPropertyImage('property-123', 'not-valid-base64', 0)).rejects.toThrow(
        'Invalid image data'
      )
    })

    it('should throw error for empty base64 string', async () => {
      await expect(uploadPropertyImage('property-123', '', 0)).rejects.toThrow('Invalid image data')
    })

    it('should handle PNG images', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/image.png'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadPropertyImage(
        'property-123',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA==',
        0
      )

      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('.png'),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/png',
        })
      )
    })

    it('should use property ID in filename', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/image.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadPropertyImage('my-special-property-id', validBase64, 3)

      expect(put).toHaveBeenCalledWith(
        'properties/my-special-property-id/image-3.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('should create proper buffer from base64', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/image.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadPropertyImage('property-123', validBase64, 0)

      const callArgs = (put as jest.Mock).mock.calls[0]
      const buffer = callArgs[1]

      expect(buffer).toBeInstanceOf(Buffer)
    })

    it('should handle index 0 correctly', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/image.jpeg'
      ;(put as jest.Mock).mockResolvedValue({ url: mockUrl })

      await uploadPropertyImage('property-123', validBase64, 0)

      expect(put).toHaveBeenCalledWith(
        'properties/property-123/image-0.jpeg',
        expect.any(Buffer),
        expect.any(Object)
      )
    })
  })
})
