import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import ContactPage from '@/pages/contactUs/contact'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
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

jest.mock('@/components/auth/CountryCodeDropdown', () => {
  return function CountryCodeDropdown({ value, onChange }: any) {
    return (
      <select
        data-testid="country-code-dropdown"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="+1">+1</option>
        <option value="+91">+91</option>
      </select>
    )
  }
})

describe('ContactPage - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: mockPush })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render page with header and footer', () => {
      render(<ContactPage />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render page title', () => {
      render(<ContactPage />)

      expect(screen.getByText('Contact Us')).toBeInTheDocument()
    })

    it('should render page description', () => {
      render(<ContactPage />)

      expect(screen.getByText(/Have a question or need help/)).toBeInTheDocument()
    })

    it('should render name field', () => {
      render(<ContactPage />)

      expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
    })

    it('should render email field', () => {
      render(<ContactPage />)

      expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    })

    it('should render phone field', () => {
      render(<ContactPage />)

      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
    })

    it('should render message field', () => {
      render(<ContactPage />)

      expect(screen.getByLabelText(/Message/)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<ContactPage />)

      expect(screen.getByText('Send Message')).toBeInTheDocument()
    })

    it('should have submit button disabled initially', () => {
      render(<ContactPage />)

      expect(screen.getByText('Send Message')).toBeDisabled()
    })
  })

  describe('Form Input Handling', () => {
    it('should update name field on input', () => {
      render(<ContactPage />)

      const nameInput = screen.getByLabelText(/Name/)
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })

      expect(nameInput).toHaveValue('John Doe')
    })

    it('should update email field on input', () => {
      render(<ContactPage />)

      const emailInput = screen.getByLabelText(/Email/)
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

      expect(emailInput).toHaveValue('john@example.com')
    })

    it('should update phone field on input', () => {
      render(<ContactPage />)

      const phoneInput = screen.getByLabelText('Phone Number')
      fireEvent.change(phoneInput, { target: { value: '1234567890' } })

      expect(phoneInput).toHaveValue('1234567890')
    })

    it('should remove non-numeric characters from phone', () => {
      render(<ContactPage />)

      const phoneInput = screen.getByLabelText('Phone Number')
      fireEvent.change(phoneInput, { target: { value: '123-456-7890' } })

      expect(phoneInput).toHaveValue('1234567890')
    })

    it('should update message field on input', () => {
      render(<ContactPage />)

      const messageInput = screen.getByLabelText(/Message/)
      fireEvent.change(messageInput, { target: { value: 'Hello, I need help' } })

      expect(messageInput).toHaveValue('Hello, I need help')
    })

    it('should enable submit button when required fields are filled', () => {
      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })

      expect(screen.getByText('Send Message')).not.toBeDisabled()
    })
  })

  describe('Country Code Dropdown', () => {
    it('should render country code dropdown', () => {
      render(<ContactPage />)

      expect(screen.getByTestId('country-code-dropdown')).toBeInTheDocument()
    })

    it('should have default country code +91', () => {
      render(<ContactPage />)

      expect(screen.getByTestId('country-code-dropdown')).toHaveValue('+91')
    })

    it('should allow changing country code', () => {
      render(<ContactPage />)

      const dropdown = screen.getByTestId('country-code-dropdown')
      fireEvent.change(dropdown, { target: { value: '+1' } })

      expect(dropdown).toHaveValue('+1')
    })
  })

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText(/Name is required/)).toBeInTheDocument()
      })
    })

    it('should show error when email is empty', async () => {
      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('should show error when email is invalid', async () => {
      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'invalid-email' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument()
      })
    })

    it('should show error when message is empty', async () => {
      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText(/Message is required/)).toBeInTheDocument()
      })
    })

    it('should validate phone number format when provided', async () => {
      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '123' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid mobile number/)).toBeInTheDocument()
      })
    })

    it('should not require phone number', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should clear field error when user starts typing', () => {
      render(<ContactPage />)

      const nameInput = screen.getByLabelText(/Name/)

      // First trigger validation
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      // Then start typing in name field
      fireEvent.change(nameInput, { target: { value: 'J' } })

      // Error should be cleared
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should include country code with phone number', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.phone).toBe('+911234567890')
      })
    })

    it('should show loading state during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument()
      })
    })

    it('should disable button during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        const button = screen.getByText('Sending...')
        expect(button).toBeDisabled()
      })
    })

    it('should show success toast on successful submission', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText(/Thank you for your message/)).toBeInTheDocument()
      })
    })

    it('should clear form after successful submission', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByLabelText(/Name/)).toHaveValue('')
        expect(screen.getByLabelText(/Email/)).toHaveValue('')
        expect(screen.getByLabelText(/Message/)).toHaveValue('')
      })
    })

    it('should show error toast on submission failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Submission failed' }),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument()
      })
    })

    it('should show generic error on network failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
      })
    })

    it('should auto-dismiss success toast after 5 seconds', async () => {
      jest.useFakeTimers()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test message' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(screen.getByText(/Thank you for your message/)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.queryByText(/Thank you for your message/)).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  describe('Input Placeholders', () => {
    it('should have placeholder for name input', () => {
      render(<ContactPage />)

      expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument()
    })

    it('should have placeholder for email input', () => {
      render(<ContactPage />)

      expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument()
    })

    it('should have placeholder for phone input', () => {
      render(<ContactPage />)

      expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument()
    })

    it('should have placeholder for message textarea', () => {
      render(<ContactPage />)

      expect(screen.getByPlaceholderText('Tell us how we can help you...')).toBeInTheDocument()
    })
  })

  describe('Required Fields', () => {
    it('should mark name as required', () => {
      render(<ContactPage />)

      const label = screen.getByText(/Name/)
      expect(label.textContent).toContain('*')
    })

    it('should mark email as required', () => {
      render(<ContactPage />)

      const label = screen.getByText(/Email/)
      expect(label.textContent).toContain('*')
    })

    it('should mark message as required', () => {
      render(<ContactPage />)

      const label = screen.getByText(/Message/)
      expect(label.textContent).toContain('*')
    })

    it('should not mark phone as required', () => {
      render(<ContactPage />)

      const label = screen.getByText('Phone Number')
      expect(label.textContent).not.toContain('*')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<ContactPage />)

      expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
      expect(screen.getByLabelText(/Message/)).toBeInTheDocument()
    })

    it('should have accessible form structure', () => {
      render(<ContactPage />)

      const form = screen.getByRole('form', { hidden: true })
      expect(form).toBeInTheDocument()
    })

    it('should have accessible submit button', () => {
      render(<ContactPage />)

      const button = screen.getByRole('button', { name: /Send Message/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      const longName = 'A'.repeat(200)
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: longName } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should handle very long message', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      const longMessage = 'A'.repeat(5000)
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: longMessage } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should handle special characters in inputs', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "O'Brien-Smith" } })
      fireEvent.change(screen.getByLabelText(/Email/), {
        target: { value: 'john+test@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test @#$%' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should validate email with + sign', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/Email/), {
        target: { value: 'john+test@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Test' } })
      fireEvent.click(screen.getByText('Send Message'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should handle whitespace-only inputs', async () => {
      render(<ContactPage />)

      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: '   ' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/Message/), { target: { value: '   ' } })

      const button = screen.getByText('Send Message')
      expect(button).toBeDisabled()
    })
  })

  describe('Layout', () => {
    it('should have centered form container', () => {
      render(<ContactPage />)

      const container = screen.getByText('Contact Us').closest('div')
      expect(container?.className).toContain('contact-card')
    })

    it('should render form elements in order', () => {
      render(<ContactPage />)

      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveAttribute('name', 'name')
      expect(inputs[1]).toHaveAttribute('name', 'email')
      expect(inputs[2]).toHaveAttribute('name', 'phone')
    })
  })
})
