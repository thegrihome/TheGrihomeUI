import { useState, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import { upload } from '@vercel/blob/client'

interface UploadedPDF {
  url: string
  uploading?: boolean
  error?: boolean
  fileName?: string
}

interface PDFUploaderDirectProps {
  pdf: UploadedPDF | null
  onChange: (pdf: UploadedPDF | null) => void
  projectName: string
  disabled?: boolean
  className?: string
}

export default function PDFUploaderDirect({
  pdf,
  onChange,
  projectName,
  disabled = false,
  className = '',
}: PDFUploaderDirectProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Normalize project name for path
  const normalizedProjectName = useMemo(() => {
    return (
      projectName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'project'
    )
  }, [projectName])

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('PDF file size must not exceed 100MB')
      return
    }

    // Show uploading state
    onChange({
      url: '',
      uploading: true,
      fileName: file.name,
    })

    try {
      const timestamp = Date.now()
      const pathname = `projects/${normalizedProjectName}/brochure-${timestamp}.pdf`

      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/projects/upload-image',
      })

      onChange({
        url: blob.url,
        uploading: false,
        fileName: file.name,
      })

      toast.success('Brochure uploaded successfully')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to upload PDF:', error)
      onChange(null)
      toast.error('Failed to upload brochure')
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !pdf?.uploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled && !pdf?.uploading) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const isUploading = pdf?.uploading

  return (
    <div className={className}>
      {/* Upload Area */}
      {!pdf?.url && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : isUploading
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
              <p className="mt-2 text-sm text-gray-600">Uploading brochure...</p>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm text-gray-600 mt-2">
                <span className="text-blue-600 hover:text-blue-700 font-medium">Upload PDF</span> or
                drag and drop
              </div>
              <p className="text-xs text-gray-500 mt-1">PDF up to 100MB</p>
            </>
          )}
        </div>
      )}

      {/* Uploaded PDF Display */}
      {pdf?.url && !pdf.uploading && (
        <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Brochure Uploaded</p>
                <a
                  href={pdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline"
                >
                  View PDF
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={isUploading || disabled}
      />
    </div>
  )
}
