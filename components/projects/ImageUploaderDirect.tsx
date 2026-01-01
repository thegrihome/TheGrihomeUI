import { useState, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { upload } from '@vercel/blob/client'

interface UploadedImage {
  url: string
  uploading?: boolean
  error?: boolean
  localPreview?: string
  file?: File // Keep file reference for retry
}

interface ImageUploaderDirectProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  projectName: string
  folder: string
  maxImages?: number
  label: string
  accept?: string
  className?: string
}

// Concurrency limit for parallel uploads
const UPLOAD_CONCURRENCY = 3

export default function ImageUploaderDirect({
  images,
  onChange,
  projectName,
  folder,
  maxImages = 20,
  label,
  accept = 'image/*',
  className = '',
}: ImageUploaderDirectProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Normalize project name for path (no random suffix - timestamps in filenames prevent collisions)
  const normalizedProjectName = useMemo(() => {
    return (
      projectName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-|-$/g, '') || 'project'
    ) // Remove leading/trailing dashes
  }, [projectName])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Upload a single file with the given index
  const uploadSingleFile = useCallback(
    async (
      file: File,
      batchIndex: number
    ): Promise<{ url: string; success: boolean; error?: boolean }> => {
      const extension = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const pathname = `projects/${normalizedProjectName}/${folder}/${folder}-${timestamp}-${batchIndex}.${extension}`

      try {
        const blob = await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/projects/upload-image',
        })
        return { url: blob.url, success: true }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to upload ${file.name}:`, error)
        return { url: '', success: false, error: true }
      }
    },
    [normalizedProjectName, folder]
  )

  // Upload files with concurrency limiting
  const uploadWithConcurrency = useCallback(
    async (
      filesToUpload: File[],
      startIndex: number,
      currentImages: UploadedImage[],
      updateCallback: (images: UploadedImage[]) => void
    ) => {
      const results: { index: number; url: string; success: boolean; file: File }[] = []

      // Process in batches of UPLOAD_CONCURRENCY
      for (let i = 0; i < filesToUpload.length; i += UPLOAD_CONCURRENCY) {
        const batch = filesToUpload.slice(i, i + UPLOAD_CONCURRENCY)

        const batchResults = await Promise.all(
          batch.map(async (file, batchIdx) => {
            const globalIndex = startIndex + i + batchIdx
            const result = await uploadSingleFile(file, i + batchIdx)
            return { index: globalIndex, ...result, file }
          })
        )

        // Update state after each batch completes
        batchResults.forEach(result => {
          results.push(result)
          if (result.success) {
            currentImages[result.index] = {
              url: result.url,
              uploading: false,
            }
          } else {
            currentImages[result.index] = {
              url: '',
              uploading: false,
              error: true,
              localPreview: currentImages[result.index]?.localPreview,
              file: result.file, // Keep file for retry
            }
          }
        })

        // Update UI after each batch
        updateCallback([...currentImages])
      }

      return results
    },
    [uploadSingleFile]
  )

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Count non-error images for slot calculation
    const validImages = images.filter(img => !img.error)
    const remainingSlots = maxImages - validImages.length
    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more image(s)`)
      return
    }

    const filesToUpload: File[] = []

    // Validate files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 100MB)`)
        continue
      }

      filesToUpload.push(file)
    }

    if (filesToUpload.length === 0) return

    // Create placeholder entries with local previews
    const newImages: UploadedImage[] = await Promise.all(
      filesToUpload.map(async file => {
        const localPreview = await fileToBase64(file)
        return {
          url: '',
          uploading: true,
          localPreview,
          file, // Keep file reference for potential retry
        }
      })
    )

    // Add placeholders to show upload progress
    const startIndex = images.length
    const currentImages = [...images, ...newImages]
    onChange(currentImages)

    // Upload with concurrency limiting
    const results = await uploadWithConcurrency(filesToUpload, startIndex, currentImages, onChange)

    // Count results
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    if (successCount > 0) {
      toast.success(`${successCount} image(s) uploaded`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} image(s) failed - click retry to try again`)
    }
  }

  // Handle retry for a failed image
  const handleRetry = async (index: number) => {
    const image = images[index]
    if (!image.file || !image.error) return

    // Mark as uploading
    const updatedImages = [...images]
    updatedImages[index] = {
      ...image,
      uploading: true,
      error: false,
    }
    onChange(updatedImages)

    // Try to upload
    const result = await uploadSingleFile(image.file, index)

    // Update based on result
    const finalImages = [...updatedImages]
    if (result.success) {
      finalImages[index] = {
        url: result.url,
        uploading: false,
      }
      toast.success('Image uploaded successfully')
    } else {
      finalImages[index] = {
        url: '',
        uploading: false,
        error: true,
        localPreview: image.localPreview,
        file: image.file,
      }
      toast.error('Upload failed - please try again')
    }
    onChange(finalImages)
  }

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const isUploading = images.some(img => img.uploading)
  const uploadingCount = images.filter(img => img.uploading).length
  const successCount = images.filter(img => img.url && !img.uploading && !img.error).length
  const errorCount = images.filter(img => img.error).length

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Upload Area */}
      {images.filter(img => !img.error).length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading
              ? 'border-gray-300 bg-gray-50 cursor-wait'
              : isDragging
                ? 'border-blue-500 bg-blue-50 cursor-pointer'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          {isUploading ? (
            <>
              <svg
                className="mx-auto h-12 w-12 text-blue-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">Uploading {uploadingCount} image(s)...</p>
              <p className="text-xs text-gray-500 mt-1">
                {successCount} uploaded, {uploadingCount} in progress
              </p>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 100MB</p>
            </>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {successCount} / {maxImages} images
            {errorCount > 0 && <span className="text-red-500 ml-1">({errorCount} failed)</span>}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={isUploading}
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div
                className={`aspect-square rounded-lg overflow-hidden border-2 ${
                  image.error
                    ? 'border-red-400'
                    : image.uploading
                      ? 'border-blue-300'
                      : 'border-gray-300'
                }`}
              >
                <Image
                  src={image.localPreview || image.url}
                  alt={`Upload ${index + 1}`}
                  width={200}
                  height={200}
                  className={`w-full h-full object-cover ${
                    image.uploading || image.error ? 'opacity-50' : ''
                  }`}
                />
                {/* Uploading overlay */}
                {image.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <svg
                      className="h-8 w-8 text-white animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
                {/* Error overlay with retry button */}
                {image.error && !image.uploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-40">
                    <svg
                      className="h-8 w-8 text-white mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <button
                      type="button"
                      onClick={() => handleRetry(index)}
                      className="bg-white text-red-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
              {/* Remove button - show for successful and failed images, not uploading */}
              {!image.uploading && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={`absolute top-2 right-2 text-white p-2 rounded-full transition-opacity shadow-lg ${
                    image.error
                      ? 'bg-gray-600 opacity-100 hover:bg-gray-700'
                      : 'bg-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-700'
                  }`}
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {/* Index badge */}
              <div
                className={`absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded ${
                  image.error ? 'bg-red-600' : 'bg-black bg-opacity-60'
                }`}
              >
                {image.error ? 'Failed' : index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
