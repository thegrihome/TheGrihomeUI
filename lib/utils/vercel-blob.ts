import { put, del } from '@vercel/blob'

export interface BlobUploadOptions {
  projectName: string
  folder: 'banner' | 'logo' | 'layout' | 'clubhouse' | 'floorplans' | 'gallery' | 'sitelayout'
  base64Image: string
  index?: number
}

/**
 * Upload an image to Vercel Blob storage with proper directory structure
 * @param options Upload options
 * @returns Public URL of the uploaded image
 */
export async function uploadProjectImage(options: BlobUploadOptions): Promise<string> {
  const { projectName, folder, base64Image, index } = options

  if (!base64Image || !base64Image.startsWith('data:image')) {
    throw new Error('Invalid image data')
  }

  // Extract base64 data
  const base64Data = base64Image.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')

  // Get file extension from mime type
  const mimeType = base64Image.split(';')[0].split(':')[1]
  const extension = mimeType.split('/')[1]

  // Normalize project name for directory
  const normalizedProjectName = projectName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  // Build file path based on folder type
  let filename: string
  if (folder === 'banner' || folder === 'logo' || folder === 'layout') {
    // Root level images
    filename = `projects/${normalizedProjectName}/${folder}.${extension}`
  } else {
    // Subfolder images (clubhouse, floorplans, gallery)
    const imageIndex = index !== undefined ? index : Date.now()
    filename = `projects/${normalizedProjectName}/${folder}/${folder}-${imageIndex}.${extension}`
  }

  // Upload to Vercel Blob
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: mimeType,
  })

  return blob.url
}

/**
 * Upload multiple images to Vercel Blob
 * @param projectName Project name
 * @param folder Folder type
 * @param base64Images Array of base64 images
 * @returns Array of public URLs
 */
export async function uploadMultipleProjectImages(
  projectName: string,
  folder: 'clubhouse' | 'floorplans' | 'gallery' | 'sitelayout',
  base64Images: string[]
): Promise<string[]> {
  const uploadPromises = base64Images.map((base64Image, index) =>
    uploadProjectImage({
      projectName,
      folder,
      base64Image,
      index,
    })
  )

  return Promise.all(uploadPromises)
}

/**
 * Upload a property image to Vercel Blob
 * @param propertyId Property ID
 * @param base64Image Base64 image string
 * @param index Image index
 * @returns Public URL
 */
export async function uploadPropertyImage(
  propertyId: string,
  base64Image: string,
  index?: number
): Promise<string> {
  if (!base64Image || !base64Image.startsWith('data:image')) {
    throw new Error('Invalid image data')
  }

  // Extract base64 data
  const base64Data = base64Image.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')

  // Get file extension from mime type
  const mimeType = base64Image.split(';')[0].split(':')[1]
  const extension = mimeType.split('/')[1]

  const imageIndex = index !== undefined ? index : Date.now()
  const filename = `properties/${propertyId}/image-${imageIndex}.${extension}`

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: mimeType,
  })

  return blob.url
}

/**
 * Delete multiple blobs from Vercel Blob storage
 * Used for cleanup when project creation fails after upload
 * @param urls Array of blob URLs to delete
 */
export async function deleteBlobs(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return

  const validUrls = urls.filter(url => url && url.includes('blob.vercel-storage.com'))
  if (validUrls.length === 0) return

  try {
    await Promise.all(validUrls.map(url => del(url)))
  } catch (error) {
    // Log but don't throw - cleanup is best effort
    // eslint-disable-next-line no-console
    console.error('Failed to cleanup blobs:', error)
  }
}
