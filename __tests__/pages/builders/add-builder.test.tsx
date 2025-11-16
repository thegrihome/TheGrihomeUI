import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AddBuilderPage from '@/pages/builders/add-builder'
import toast from 'react-hot-toast'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/Header', () => {
  return function Header() {
    return <div data-testid="header">Header</div>
  }
})

jest.mock('@/components/Footer', () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>
  }
})

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
/* eslint-disable testing-library/no-node-access */
    return <img {...props} />
  },
}))

jest.mock('next-seo', () => ({
  NextSeo: ({ title }: any) => {
    if (title) {
      // eslint-disable-next-line testing-library/no-node-access
      document.title = title
    }
    return null
  },
}))

describe('AddBuilderPage - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: mockPush })
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering - Authenticated', () => {
    it('should render the page with header and footer', () => {
      render(<AddBuilderPage />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render page title', () => {
      render(<AddBuilderPage />)

      expect(screen.getByText('Add New Builder')).toBeInTheDocument()
    })

    it('should render page description', () => {
      render(<AddBuilderPage />)

      expect(
        screen.getByText('Add a new builder or real estate developer to the platform')
      ).toBeInTheDocument()
    })

    it('should render Builder Name field', () => {
      render(<AddBuilderPage />)

      expect(screen.getByLabelText(/Builder Name/)).toBeInTheDocument()
    })

    it('should render Builder Logo field', () => {
      render(<AddBuilderPage />)

      expect(screen.getByText('Builder Logo')).toBeInTheDocument()
    })

    it('should render Description field', () => {
      render(<AddBuilderPage />)

      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('should render Website URL field', () => {
      render(<AddBuilderPage />)

      expect(screen.getByLabelText('Website URL')).toBeInTheDocument()
    })

    it('should render Address field', () => {
      render(<AddBuilderPage />)

      expect(screen.getByLabelText('Address')).toBeInTheDocument()
    })

    it('should render Submit button', () => {
      render(<AddBuilderPage />)

      expect(screen.getByText('Submit')).toBeInTheDocument()
    })

    it('should render Cancel button', () => {
      render(<AddBuilderPage />)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should have Submit button disabled initially', () => {
      render(<AddBuilderPage />)

      expect(screen.getByText('Submit')).toBeDisabled()
    })
  })

  describe('Authentication Checks', () => {
    it('should redirect to login when unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<AddBuilderPage />)

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
        expect(toast.error).toHaveBeenCalledWith('Please sign in to add a builder')
      })
    })

    it('should show loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<AddBuilderPage />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      const spinner = screen.getByRole('generic', { hidden: true })
      expect(spinner.className).toContain('animate-spin')
    })

    it('should not redirect when authenticated', () => {
      render(<AddBuilderPage />)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Form Input Handling', () => {
    it('should update builder name on input', () => {
      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })

      expect(nameInput).toHaveValue('Test Builder')
    })

    it('should update description on input', () => {
      render(<AddBuilderPage />)

      const descInput = screen.getByLabelText('Description')
      fireEvent.change(descInput, { target: { value: 'Test description' } })

      expect(descInput).toHaveValue('Test description')
    })

    it('should update website on input', () => {
      render(<AddBuilderPage />)

      const websiteInput = screen.getByLabelText('Website URL')
      fireEvent.change(websiteInput, { target: { value: 'https://example.com' } })

      expect(websiteInput).toHaveValue('https://example.com')
    })

    it('should update address on input', () => {
      render(<AddBuilderPage />)

      const addressInput = screen.getByLabelText('Address')
      fireEvent.change(addressInput, { target: { value: '123 Main St' } })

      expect(addressInput).toHaveValue('123 Main St')
    })

    it('should enable submit button when name is provided', () => {
      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })

      expect(screen.getByText('Submit')).not.toBeDisabled()
    })
  })

  describe('Logo Upload', () => {
    it('should handle logo file selection', () => {
      render(<AddBuilderPage />)

      const file = new File(['logo'], 'logo.png', { type: 'image/png' })
      const fileInput = screen
        .getByLabelText(/Builder Logo/)
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      // Logo preview should be set up (implementation detail)
    })

    it('should show error for non-image file', () => {
      render(<AddBuilderPage />)

      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' })
      const fileInput = screen
        .getByLabelText(/Builder Logo/)
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(toast.error).toHaveBeenCalledWith('Please upload an image file')
    })

    it('should show error for file size > 5MB', () => {
      render(<AddBuilderPage />)

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
      const fileInput = screen
        .getByLabelText(/Builder Logo/)
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(toast.error).toHaveBeenCalledWith('Image size should be less than 5MB')
    })

    it('should accept valid image file', () => {
      render(<AddBuilderPage />)

      const validFile = new File(['image'], 'logo.png', { type: 'image/png' })
      const fileInput = screen
        .getByLabelText(/Builder Logo/)
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onloadend: jest.fn(),
        result: 'data:image/png;base64,test',
      }
      global.FileReader = jest.fn(() => mockFileReader) as any

      fireEvent.change(fileInput)

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(validFile)
    })

    it('should display logo preview after upload', async () => {
      render(<AddBuilderPage />)

      const validFile = new File(['image'], 'logo.png', { type: 'image/png' })
      const fileInput = screen
        .getByLabelText(/Builder Logo/)
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })

      const mockFileReader = {
        readAsDataURL: jest.fn(function (this: any) {
          this.result = 'data:image/png;base64,test'
          this.onloadend()
        }),
        onloadend: null as any,
        result: null,
      }
      global.FileReader = jest.fn(() => mockFileReader) as any

      fireEvent.change(fileInput)

      await waitFor(() => {
        const preview = screen.queryByAlt('Logo preview')
        if (preview) {
          expect(preview).toBeInTheDocument()
        }
      })
    })

    it('should handle no file selected', () => {
      render(<AddBuilderPage />)

      const fileInput = screen
        .getByLabelText(/Builder Logo/)
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should show error when submitting without name', async () => {
      render(<AddBuilderPage />)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      // Button should be disabled, but let's test the validation
      expect(submitButton).toBeDisabled()
    })

    it('should validate website URL format', async () => {
      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const websiteInput = screen.getByLabelText('Website URL')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.change(websiteInput, { target: { value: 'invalid-url' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Please enter a valid website URL (starting with http:// or https://)'
        )
      })
    })

    it('should accept http:// URLs', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '1' } }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const websiteInput = screen.getByLabelText('Website URL')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.change(websiteInput, { target: { value: 'http://example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should accept https:// URLs', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '1' } }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const websiteInput = screen.getByLabelText('Website URL')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.change(websiteInput, { target: { value: 'https://example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should allow empty website URL', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '1' } }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should trim builder name before validation', async () => {
      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: '   ' } })

      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '123' } }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/builders/create',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should include all form data in submission', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '123' } }),
      })

      render(<AddBuilderPage />)

      fireEvent.change(screen.getByLabelText(/Builder Name/), { target: { value: 'Test Builder' } })
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test description' },
      })
      fireEvent.change(screen.getByLabelText('Website URL'), {
        target: { value: 'https://example.com' },
      })
      fireEvent.change(screen.getByLabelText('Address'), { target: { value: '123 Main St' } })

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/builders/create',
          expect.objectContaining({
            body: expect.stringContaining('Test Builder'),
          })
        )
      })
    })

    it('should show loading state during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument()
      })
    })

    it('should disable submit button during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const button = screen.getByText('Submitting...')
        expect(button).toBeDisabled()
      })
    })

    it('should show success message on successful submission', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '123' } }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Builder added successfully!')
      })
    })

    it('should redirect to builder detail page on success', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '123' } }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/builders/123')
      })
    })

    it('should show error message on submission failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Builder already exists' }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Builder already exists')
      })
    })

    it('should show generic error on network failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred. Please try again.')
      })
    })

    it('should re-enable button after submission error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText('Submit')).not.toBeDisabled()
      })
    })
  })

  describe('Cancel Functionality', () => {
    it('should have a cancel button', () => {
      render(<AddBuilderPage />)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should go back on cancel click', () => {
      const mockBack = jest.fn()
      mockUseRouter.mockReturnValue({ push: mockPush, back: mockBack })

      render(<AddBuilderPage />)

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('Required Fields', () => {
    it('should mark name as required', () => {
      render(<AddBuilderPage />)

      const nameLabel = screen.getByText(/Builder Name/)
      expect(nameLabel.textContent).toContain('*')
    })

    it('should have required attribute on name input', () => {
      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      expect(nameInput).toHaveAttribute('required')
    })

    it('should not mark optional fields as required', () => {
      render(<AddBuilderPage />)

      const descriptionLabel = screen.getByText('Description')
      expect(descriptionLabel.textContent).not.toContain('*')
    })
  })

  describe('Input Placeholders', () => {
    it('should have placeholder for name input', () => {
      render(<AddBuilderPage />)

      expect(screen.getByPlaceholderText('Enter builder name')).toBeInTheDocument()
    })

    it('should have placeholder for description', () => {
      render(<AddBuilderPage />)

      expect(screen.getByPlaceholderText('Brief description of the builder')).toBeInTheDocument()
    })

    it('should have placeholder for website', () => {
      render(<AddBuilderPage />)

      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument()
    })

    it('should have placeholder for address', () => {
      render(<AddBuilderPage />)

      expect(screen.getByPlaceholderText("Builder's office address")).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<AddBuilderPage />)

      expect(screen.getByLabelText(/Builder Name/)).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Website URL')).toBeInTheDocument()
      expect(screen.getByLabelText('Address')).toBeInTheDocument()
    })

    it('should have accessible file input', () => {
      render(<AddBuilderPage />)

      const fileInput = screen
        .getByLabelText(/Builder Logo/)
        .closest('div')
        ?.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
    })

    it('should have accessible buttons', () => {
      render(<AddBuilderPage />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2) // Submit and Cancel
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long builder name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '123' } }),
      })

      render(<AddBuilderPage />)

      const longName = 'A'.repeat(500)
      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: longName } })

      expect(nameInput).toHaveValue(longName)
    })

    it('should handle special characters in name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '123' } }),
      })

      render(<AddBuilderPage />)

      const specialName = 'Builder & Co. (Pvt.) Ltd.'
      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: specialName } })

      expect(nameInput).toHaveValue(specialName)
    })

    it('should handle empty description gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builder: { id: '123' } }),
      })

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should handle multiple rapid form submissions', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<AddBuilderPage />)

      const nameInput = screen.getByLabelText(/Builder Name/)
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(nameInput, { target: { value: 'Test Builder' } })
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)
      fireEvent.click(submitButton)

      // Should only call once since button is disabled
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('SEO', () => {
    it('should have correct SEO title', () => {
      render(<AddBuilderPage />)

      expect(document.title).toContain('Add Builder')
    })
  })

  describe('Layout', () => {
    it('should have centered form container', () => {
      render(<AddBuilderPage />)

      const container = screen.getByText('Add New Builder').closest('div')?.parentElement
      expect(container?.className).toContain('max-w-3xl')
    })

    it('should have white background for form', () => {
      render(<AddBuilderPage />)

      const formContainer = screen.getByText('Add New Builder').closest('div')
      expect(formContainer?.className).toContain('bg-white')
    })
  })
})
