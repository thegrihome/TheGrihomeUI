import { useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { upload } from '@vercel/blob/client'

// Generate a short unique ID
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 10)
}

export interface UploadedImage {
  url: string
  uploading?: boolean
  error?: boolean
  localPreview?: string
}

interface ImageUploaderDirectProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  propertyTitle: string
  maxImages?: number
  label: string
  className?: string
}

export default function ImageUploaderDirect({
  images,
  onChange,
  propertyTitle,
  maxImages = 20,
  label,
  className = '',
}: ImageUploaderDirectProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Generate a stable unique folder ID for this upload session
  const folderId = useMemo(() => generateShortId(), [])

  // Normalize property title for path and add unique ID to avoid collisions
  const normalizedPropertyTitle = useMemo(() => {
    const normalized = propertyTitle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    return `${normalized || 'property'}-${folderId}`
  }, [propertyTitle, folderId])

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (!propertyTitle.trim()) {
      toast.error('Please enter a property title before uploading images')
      return
    }

    const remainingSlots = maxImages - images.length
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

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
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
        }
      })
    )

    // Add placeholders to show upload progress
    const startIndex = images.length
    onChange([...images, ...newImages])

    // Upload files in parallel
    const uploadPromises = filesToUpload.map(async (file, index) => {
      const globalIndex = startIndex + index
      const extension = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const pathname = `properties/${normalizedPropertyTitle}/image-${timestamp}-${index}.${extension}`

      try {
        const blob = await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/properties/upload-image',
        })

        return { index: globalIndex, url: blob.url, success: true }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to upload ${file.name}:`, error)
        return { index: globalIndex, url: '', success: false, error: true }
      }
    })

    const results = await Promise.all(uploadPromises)

    // Build the updated images array
    const currentImages = [...images, ...newImages]
    let successCount = 0
    let errorCount = 0

    results.forEach(result => {
      if (result.success) {
        currentImages[result.index] = {
          url: result.url,
          uploading: false,
        }
        successCount++
      } else {
        currentImages[result.index] = {
          url: '',
          uploading: false,
          error: true,
          localPreview: currentImages[result.index]?.localPreview,
        }
        errorCount++
      }
    })

    if (successCount > 0) {
      toast.success(`${successCount} image(s) uploaded`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} image(s) failed to upload`)
    }

    // Filter out failed uploads and update
    onChange(currentImages.filter(img => !img.error))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
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

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {images.length > 0 && (
          <span className="text-sm text-gray-600">
            {images.filter(img => !img.uploading).length} / {maxImages} images
          </span>
        )}
      </div>

      {/* Upload Area */}
      {images.length < maxImages && (
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
              <p className="mt-2 text-sm text-gray-600">Uploading images...</p>
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
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={isUploading}
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div
                className={`aspect-square rounded-lg overflow-hidden border ${
                  image.uploading ? 'border-blue-300' : 'border-gray-300'
                }`}
              >
                <Image
                  src={image.localPreview || image.url}
                  alt={`Upload ${index + 1}`}
                  width={200}
                  height={200}
                  className={`w-full h-full object-cover ${image.uploading ? 'opacity-50' : ''}`}
                />
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
              </div>
              {!image.uploading && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
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
              {index === 0 && !image.uploading && (
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Thumbnail
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
