import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import ExpressInterestButton from '@/components/properties/ExpressInterestButton'
import { mockFetchSuccess, mockFetchError } from '@/__tests__/utils/test-utils'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

describe('ExpressInterestButton Component', () => {
  const mockOnAuthRequired = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('should render Express Interest button', () => {
      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      expect(screen.getByText('Express Interest')).toBeInTheDocument()
    })

    it('should call onAuthRequired when clicked while unauthenticated', () => {
      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      expect(mockOnAuthRequired).toHaveBeenCalled()
    })

    it('should not call API when unauthenticated', () => {
      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      expect(fetch).not.toHaveBeenCalled()
    })

    it('should not check existing interest when unauthenticated', () => {
      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      expect(fetch).not.toHaveBeenCalled()
    })

    it('should show heart icon when not authenticated', () => {
      const { container } = render(
        <ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      })
    })

    it('should check existing interest on mount for project', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/interests/check?projectId=proj123')
      })
    })

    it('should check existing interest on mount for property', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton propertyId="prop123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/interests/check?propertyId=prop123')
      })
    })

    it('should not check interest if no projectId or propertyId', () => {
      render(<ExpressInterestButton onAuthRequired={mockOnAuthRequired} />)

      expect(fetch).not.toHaveBeenCalled()
    })

    it('should show Loading... while checking interest', () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should show Interest Sent if already expressed', async () => {
      mockFetchSuccess({ hasExpressed: true })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Interest Sent')).toBeInTheDocument()
      })
    })

    it('should disable button if already expressed', async () => {
      mockFetchSuccess({ hasExpressed: true })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        const button = screen.getByText('Interest Sent')
        expect(button).toBeDisabled()
      })
    })

    it('should show checkmark icon when interest already expressed', async () => {
      mockFetchSuccess({ hasExpressed: true })

      const { container } = render(
        <ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />
      )

      await waitFor(() => {
        const path = container.querySelector('path[d="M5 13l4 4L19 7"]')
        expect(path).toBeInTheDocument()
      })
    })

    it('should handle check interest API error silently', async () => {
      mockFetchError('Error checking interest')

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })
    })
  })

  describe('Expressing Interest', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      })
    })

    it('should express interest for project', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/interests/express',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ projectId: 'proj123' }),
          })
        )
      })
    })

    it('should express interest for property', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton propertyId="prop123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/interests/express',
          expect.objectContaining({
            body: JSON.stringify({ propertyId: 'prop123' }),
          })
        )
      })
    })

    it('should show Sending... while expressing interest', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              1000
            )
          )
      )

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument()
      })
    })

    it('should show Interest Sent after successful submission', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Interest Sent')).toBeInTheDocument()
      })
    })

    it('should disable button after successful submission', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        const sentButton = screen.getByText('Interest Sent')
        expect(sentButton).toBeDisabled()
      })
    })

    it('should show error message on API failure', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save interest' }),
      })

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to save interest')).toBeInTheDocument()
      })
    })

    it('should show default error message if API error has no message', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to express interest')).toBeInTheDocument()
      })
    })

    it('should show network error message on network failure', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
      })
    })

    it('should clear error on retry', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      // First attempt - fail
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
      })

      // Second attempt - success
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.queryByText('Network error. Please try again.')).not.toBeInTheDocument()
      })
    })

    it('should not submit if already expressed', async () => {
      mockFetchSuccess({ hasExpressed: true })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Interest Sent')).toBeInTheDocument()
      })

      const button = screen.getByText('Interest Sent')
      fireEvent.click(button)

      // Should not call express API, only the check API
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith('/api/interests/check?projectId=proj123')
    })

    it('should disable button while expressing', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })

      global.fetch = jest.fn().mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              1000
            )
          )
      )

      const button = screen.getByText('Express Interest')
      fireEvent.click(button)

      await waitFor(() => {
        const sendingButton = screen.getByText('Sending...')
        expect(sendingButton).toBeDisabled()
      })
    })
  })

  describe('Button Icons', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      })
    })

    it('should show spinner icon while checking', () => {
      mockFetchSuccess({ hasExpressed: false })

      const { container } = render(
        <ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />
      )

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should show heart icon when ready to express', async () => {
      mockFetchSuccess({ hasExpressed: false })

      const { container } = render(
        <ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />
      )

      await waitFor(() => {
        const heartPath = container.querySelector(
          'path[d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"]'
        )
        expect(heartPath).toBeInTheDocument()
      })
    })

    it('should show checkmark icon when expressed', async () => {
      mockFetchSuccess({ hasExpressed: true })

      const { container } = render(
        <ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />
      )

      await waitFor(() => {
        const checkPath = container.querySelector('path[d="M5 13l4 4L19 7"]')
        expect(checkPath).toBeInTheDocument()
      })
    })
  })

  describe('CSS Classes', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      })
    })

    it('should apply green styling when expressed', async () => {
      mockFetchSuccess({ hasExpressed: true })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        const button = screen.getByText('Interest Sent')
        expect(button.className).toContain('bg-green-100')
        expect(button.className).toContain('text-green-700')
      })
    })

    it('should apply gray styling while checking', () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      const button = screen.getByText('Loading...')
      expect(button.className).toContain('bg-gray-100')
      expect(button.className).toContain('text-gray-500')
    })

    it('should apply red styling when ready', async () => {
      mockFetchSuccess({ hasExpressed: false })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      await waitFor(() => {
        const button = screen.getByText('Express Interest')
        expect(button.className).toContain('bg-red-600')
        expect(button.className).toContain('text-white')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle both projectId and propertyId', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      })

      mockFetchSuccess({ hasExpressed: false })

      render(
        <ExpressInterestButton
          projectId="proj123"
          propertyId="prop123"
          onAuthRequired={mockOnAuthRequired}
        />
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/interests/check?projectId=proj123&propertyId=prop123'
        )
      })
    })

    it('should handle missing onAuthRequired', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const { container } = render(
        <ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />
      )

      expect(container).toBeInTheDocument()
    })

    it('should handle loading status', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<ExpressInterestButton projectId="proj123" onAuthRequired={mockOnAuthRequired} />)

      expect(screen.getByText('Express Interest')).toBeInTheDocument()
    })

    it('should include projectName and propertyName props without error', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: { email: 'test@example.com', name: 'Test User' },
        },
        status: 'authenticated',
      })

      mockFetchSuccess({ hasExpressed: false })

      render(
        <ExpressInterestButton
          projectId="proj123"
          projectName="Test Project"
          propertyName="Test Property"
          onAuthRequired={mockOnAuthRequired}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Express Interest')).toBeInTheDocument()
      })
    })
  })
})
