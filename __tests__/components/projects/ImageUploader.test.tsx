import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImageUploader from '@/components/projects/ImageUploader'

// Mock Next Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('ImageUploader Component', () => {
  const mockOnChange = jest.fn()
  const mockImages = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with label', () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />)
      expect(screen.getByText('Upload Photos')).toBeInTheDocument()
    })

    it('renders upload area when no images', () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />)
      expect(screen.getByText('Click to upload')).toBeInTheDocument()
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    })

    it('renders upload area when images less than maxImages', () => {
      render(
        <ImageUploader
          images={mockImages}
          onChange={mockOnChange}
          label="Upload Photos"
          maxImages={5}
        />
      )
      expect(screen.getByText('Click to upload')).toBeInTheDocument()
    })

    it('does not render upload area when max images reached', () => {
      render(
        <ImageUploader
          images={mockImages}
          onChange={mockOnChange}
          label="Upload Photos"
          maxImages={2}
        />
      )
      expect(screen.queryByText('Click to upload')).not.toBeInTheDocument()
    })

    it('displays image count', () => {
      render(
        <ImageUploader
          images={mockImages}
          onChange={mockOnChange}
          label="Upload Photos"
          maxImages={10}
        />
      )
      expect(screen.getByText('2 / 10 images')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <ImageUploader
          images={[]}
          onChange={mockOnChange}
          label="Upload Photos"
          className="custom-class"
        />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('uses default maxImages of 20', () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />)
      expect(screen.getByText('0 / 20 images')).toBeInTheDocument()
    })

    it('uses default accept of image/*', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )
      const input = container.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('accept', 'image/*')
    })

    it('uses custom accept attribute', () => {
      const { container } = render(
        <ImageUploader
          images={[]}
          onChange={mockOnChange}
          label="Upload Photos"
          accept="image/png,image/jpeg"
        />
      )
      const input = container.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('accept', 'image/png,image/jpeg')
    })

    it('renders upload icon', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('renders file size information', () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />)
      expect(screen.getByText('PNG, JPG, GIF up to 10MB')).toBeInTheDocument()
    })
  })

  describe('Image Preview', () => {
    it('renders image preview grid when images exist', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )
      const images = container.querySelectorAll('img')
      expect(images.length).toBe(2)
    })

    it('displays image index numbers', () => {
      render(<ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('renders remove buttons for each image', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )
      const removeButtons = container.querySelectorAll('button[title="Remove image"]')
      expect(removeButtons.length).toBe(2)
    })

    it('renders images with correct alt text', () => {
      render(<ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />)
      expect(screen.getByAltText('Upload 1')).toBeInTheDocument()
      expect(screen.getByAltText('Upload 2')).toBeInTheDocument()
    })

    it('uses correct grid layout classes', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4')
    })
  })

  describe('File Selection via Click', () => {
    it('opens file dialog when upload area clicked', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = jest.spyOn(input, 'click')

      const uploadArea = screen.getByText('Click to upload').closest('div')
      fireEvent.click(uploadArea!)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('file input is hidden', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )
      const input = container.querySelector('input[type="file"]')
      expect(input).toHaveClass('hidden')
    })

    it('file input allows multiple files', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )
      const input = container.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('multiple')
    })
  })

  describe('Drag and Drop', () => {
    it('changes style when dragging over', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const uploadArea = screen.getByText('Click to upload').closest('div')!

      fireEvent.dragOver(uploadArea, { preventDefault: jest.fn() })

      expect(uploadArea).toHaveClass('border-blue-500', 'bg-blue-50')
    })

    it('removes drag style when drag leaves', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const uploadArea = screen.getByText('Click to upload').closest('div')!

      fireEvent.dragOver(uploadArea, { preventDefault: jest.fn() })
      fireEvent.dragLeave(uploadArea)

      expect(uploadArea).not.toHaveClass('border-blue-500', 'bg-blue-50')
    })

    it('applies drag style on drag over', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const uploadArea = screen.getByText('Click to upload').closest('div')!

      fireEvent.dragOver(uploadArea)

      // Drag over should apply border-blue-500 class
      expect(uploadArea.className).toContain('border-blue-500')
    })

    it('removes drag style on drop', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const uploadArea = screen.getByText('Click to upload').closest('div')!

      // First apply drag style
      fireEvent.dragOver(uploadArea)
      expect(uploadArea.className).toContain('border-blue-500')

      // Then drop should remove it
      fireEvent.drop(uploadArea, {
        dataTransfer: { files: [] },
      })

      expect(uploadArea.className).not.toContain('border-blue-500')
    })

    it('removes drag style after drop', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const uploadArea = screen.getByText('Click to upload').closest('div')!

      fireEvent.dragOver(uploadArea, { preventDefault: jest.fn() })

      const file = new File(['image'], 'test.png', { type: 'image/png' })
      fireEvent.drop(uploadArea, {
        preventDefault: jest.fn(),
        dataTransfer: { files: [file] },
      })

      await waitFor(() => {
        expect(uploadArea).not.toHaveClass('border-blue-500', 'bg-blue-50')
      })
    })
  })

  describe('File Validation', () => {
    it('rejects non-image files', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled()
      })
    })

    it('rejects files larger than 10MB', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'large.png', { type: 'image/png' })

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled()
      })
    })

    it('rejects files exceeding remaining slots', async () => {
      const { container } = render(
        <ImageUploader
          images={mockImages}
          onChange={mockOnChange}
          label="Upload Photos"
          maxImages={3}
        />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const file1 = new File(['image1'], 'test1.png', { type: 'image/png' })
      const file2 = new File(['image2'], 'test2.png', { type: 'image/png' })

      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        writable: false,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled()
      })
    })

    it('accepts valid image files', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['image'], 'test.png', { type: 'image/png' })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/png;base64,test',
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(input)

      // Simulate FileReader completion
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({} as any)
        }
      }, 0)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['data:image/png;base64,test'])
      })
    })

    it('handles multiple valid files', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const file1 = new File(['image1'], 'test1.png', { type: 'image/png' })
      const file2 = new File(['image2'], 'test2.jpg', { type: 'image/jpeg' })

      // Create a fresh mock for each file
      const callCount = 0
      const mockFileReader = () => ({
        readAsDataURL: jest.fn(function (this: any) {
          // Trigger onload after a tick
          setTimeout(() => {
            this.result = 'data:image/png;base64,test'
            if (this.onload) {
              this.onload({} as any)
            }
          }, 0)
        }),
        onload: null as any,
        onerror: null as any,
        result: '',
      })

      global.FileReader = jest.fn(() => mockFileReader()) as any

      fireEvent.change(input, { target: { files: [file1, file2] } })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    })

    it('handles FileReader error', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['image'], 'test.png', { type: 'image/png' })

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: null,
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(input)

      // Simulate FileReader error
      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror(new Error('Read error') as any)
        }
      }, 0)

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled()
      })
    })

    it('skips invalid files but processes valid ones', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const validFile = new File(['image'], 'test.png', { type: 'image/png' })
      const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' })

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/png;base64,test',
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      Object.defineProperty(input, 'files', {
        value: [invalidFile, validFile],
        writable: false,
      })

      fireEvent.change(input)

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({} as any)
        }
      }, 0)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['data:image/png;base64,test'])
      })
    })
  })

  describe('Image Removal', () => {
    it('calls onChange with filtered images when remove clicked', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const removeButtons = container.querySelectorAll('button[title="Remove image"]')
      fireEvent.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith([mockImages[1]])
    })

    it('removes correct image by index', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const removeButtons = container.querySelectorAll('button[title="Remove image"]')
      fireEvent.click(removeButtons[1])

      expect(mockOnChange).toHaveBeenCalledWith([mockImages[0]])
    })

    it('remove button has correct type attribute', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const removeButtons = container.querySelectorAll('button[title="Remove image"]')
      removeButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('remove button has hover effect', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const removeButtons = container.querySelectorAll('button[title="Remove image"]')
      removeButtons.forEach(button => {
        expect(button).toHaveClass('hover:bg-red-700')
      })
    })
  })

  describe('CSS Classes and Styling', () => {
    it('applies correct classes to upload area', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const uploadArea = screen.getByText('Click to upload').closest('div')
      expect(uploadArea).toHaveClass('border-2', 'border-dashed', 'cursor-pointer')
    })

    it('applies hover styles to upload area', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const uploadArea = screen.getByText('Click to upload').closest('div')
      expect(uploadArea).toHaveClass('hover:border-blue-400', 'hover:bg-gray-50')
    })

    it('applies correct classes to image containers', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const imageContainers = container.querySelectorAll('.aspect-square')
      expect(imageContainers.length).toBeGreaterThan(0)
      imageContainers.forEach(img => {
        expect(img).toHaveClass('rounded-lg', 'overflow-hidden')
      })
    })

    it('applies group hover effect to remove button', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const removeButtons = container.querySelectorAll('button[title="Remove image"]')
      removeButtons.forEach(button => {
        expect(button).toHaveClass('opacity-0', 'group-hover:opacity-100')
      })
    })

    it('applies correct classes to label', () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />)

      const label = screen.getByText('Upload Photos')
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700')
    })

    it('renders image index badge with correct styling', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const badges = container.querySelectorAll('.bg-black.bg-opacity-60')
      expect(badges.length).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty files list', async () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(input, 'files', {
        value: null,
        writable: false,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled()
      })
    })

    it('handles maxImages of 1', () => {
      render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" maxImages={1} />
      )
      expect(screen.getByText('0 / 1 images')).toBeInTheDocument()
    })

    it('handles zero remaining slots', async () => {
      const { container } = render(
        <ImageUploader
          images={mockImages}
          onChange={mockOnChange}
          label="Upload Photos"
          maxImages={2}
        />
      )

      // Upload area should not be visible
      expect(screen.queryByText('Click to upload')).not.toBeInTheDocument()
    })

    it('appends new images to existing images', async () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['image'], 'new.png', { type: 'image/png' })

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/png;base64,new',
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(input)

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({} as any)
        }
      }, 0)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([...mockImages, 'data:image/png;base64,new'])
      })
    })

    it('removes all images when all are deleted', () => {
      const { container } = render(
        <ImageUploader images={[mockImages[0]]} onChange={mockOnChange} label="Upload Photos" />
      )

      const removeButton = container.querySelector('button[title="Remove image"]')
      fireEvent.click(removeButton!)

      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })

  describe('Accessibility', () => {
    it('renders label element', () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />)
      const label = screen.getByText('Upload Photos')
      expect(label.tagName).toBe('LABEL')
    })

    it('remove buttons have title attribute', () => {
      const { container } = render(
        <ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />
      )

      const removeButtons = container.querySelectorAll('button[title="Remove image"]')
      expect(removeButtons.length).toBe(2)
    })

    it('renders alt text for images', () => {
      render(<ImageUploader images={mockImages} onChange={mockOnChange} label="Upload Photos" />)
      mockImages.forEach((_, index) => {
        expect(screen.getByAltText(`Upload ${index + 1}`)).toBeInTheDocument()
      })
    })

    it('renders SVG icons with proper viewBox', () => {
      const { container } = render(
        <ImageUploader images={[]} onChange={mockOnChange} label="Upload Photos" />
      )
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox')
    })
  })
})
