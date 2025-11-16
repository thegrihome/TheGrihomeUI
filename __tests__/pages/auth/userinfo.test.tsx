import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import UserInfoPage from '@/pages/auth/userinfo'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
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

jest.mock('@/components/auth/CountryCodeDropdown', () => {
  return function CountryCodeDropdown({ value, onChange, disabled, className }: any) {
    return (
      <select
        data-testid="country-code-dropdown"
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        disabled={disabled}
        className={className}
      >
        <option value="+1">+1</option>
        <option value="+91">+91</option>
      </select>
    )
  }
})

describe('UserInfo Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUpdate = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    mobileNumber: '+919876543210',
    isEmailVerified: false,
    isMobileVerified: false,
    isAgent: false,
    companyName: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUseRouter.mockReturnValue({ push: mockPush })
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: mockUpdate,
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render userinfo page with all components', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByText('My Information')).toBeInTheDocument()
      })
    })

    it('should return null when not mounted', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: mockUpdate,
      })

      const { container } = render(<UserInfoPage />)
      expect(container.firstChild).toBeNull()
    })

    it('should redirect to login when unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: mockUpdate,
      })

      render(<UserInfoPage />)

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should not redirect when authenticated', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('User Profile Display', () => {
    it('should display user first name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('John')
        expect(firstNameInput).toBeInTheDocument()
      })
    })

    it('should display user last name', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const lastNameInput = screen.getByDisplayValue('Doe')
        expect(lastNameInput).toBeInTheDocument()
      })
    })

    it('should display username', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const usernameInput = screen.getByDisplayValue('johndoe')
        expect(usernameInput).toBeInTheDocument()
      })
    })

    it('should display email', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('john@example.com')
        expect(emailInput).toBeInTheDocument()
      })
    })

    it('should display mobile number without country code', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const mobileInput = screen.getByDisplayValue('9876543210')
        expect(mobileInput).toBeInTheDocument()
      })
    })

    it('should disable all personal info inputs', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('John')
        const lastNameInput = screen.getByDisplayValue('Doe')
        const usernameInput = screen.getByDisplayValue('johndoe')
        const emailInput = screen.getByDisplayValue('john@example.com')

        expect(firstNameInput).toBeDisabled()
        expect(lastNameInput).toBeDisabled()
        expect(usernameInput).toBeDisabled()
        expect(emailInput).toBeDisabled()
      })
    })

    it('should show company name for agents', async () => {
      const agentUser = { ...mockUser, isAgent: true, companyName: 'Test Company' }
      mockUseSession.mockReturnValue({
        data: { user: agentUser },
        status: 'authenticated',
        update: mockUpdate,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const companyInput = screen.getByDisplayValue('Test Company')
        expect(companyInput).toBeInTheDocument()
        expect(companyInput).toBeDisabled()
      })
    })
  })

  describe('Email Verification Status', () => {
    it('should show unverified icon when email is not verified', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      const { container } = render(<UserInfoPage />)

      await waitFor(() => {
        const redIcon = container.querySelector('.text-red-500')
        expect(redIcon).toBeInTheDocument()
      })
    })

    it('should show verified icon when email is verified', async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true }
      mockUseSession.mockReturnValue({
        data: { user: verifiedUser },
        status: 'authenticated',
        update: mockUpdate,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      const { container } = render(<UserInfoPage />)

      await waitFor(() => {
        const greenIcon = container.querySelector('.text-green-500')
        expect(greenIcon).toBeInTheDocument()
      })
    })

    it('should show Send OTP button when email is not verified', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        expect(sendOtpButtons.length).toBeGreaterThan(0)
      })
    })

    it('should not show Send OTP button when email is verified', async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true, isMobileVerified: true }
      mockUseSession.mockReturnValue({
        data: { user: verifiedUser },
        status: 'authenticated',
        update: mockUpdate,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const sendOtpButtons = screen.queryAllByText('Send OTP')
        expect(sendOtpButtons).toHaveLength(0)
      })
    })
  })

  describe('Email OTP Verification', () => {
    it('should send email OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        const emailOtpButton = sendOtpButtons[0]

        fireEvent.click(emailOtpButton)

        await waitFor(() => {
          expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
        })
      })
    })

    it('should show OTP input after sending email OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(() => {
          expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
          expect(screen.getByText('Verify')).toBeInTheDocument()
        })
      })
    })

    it('should verify email with correct OTP', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(async () => {
          const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
          fireEvent.change(otpInput, { target: { value: '123456' } })

          const verifyButton = screen.getByRole('button', { name: 'Verify' })
          fireEvent.click(verifyButton)

          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              '/api/user/verify-email',
              expect.objectContaining({
                method: 'POST',
              })
            )
            expect(mockUpdate).toHaveBeenCalled()
          })
        })
      })
    })

    it('should show error for invalid email OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(async () => {
          const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
          fireEvent.change(otpInput, { target: { value: '999999' } })

          const verifyButton = screen.getByRole('button', { name: 'Verify' })
          fireEvent.click(verifyButton)

          await waitFor(() => {
            const toast = document.querySelector('.bg-red-500')
            expect(toast).toBeInTheDocument()
          })
        })
      })
    })

    it('should disable verify button when OTP is incomplete', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(() => {
          const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
          fireEvent.change(otpInput, { target: { value: '123' } })

          const verifyButton = screen.getByRole('button', { name: 'Verify' })
          expect(verifyButton).toBeDisabled()
        })
      })
    })

    it('should countdown timer after sending OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(() => {
          expect(screen.getByText(/Resend in 3:00/i)).toBeInTheDocument()

          jest.advanceTimersByTime(1000)

          expect(screen.getByText(/Resend in 2:59/i)).toBeInTheDocument()
        })
      })
    })

    it('should allow resending OTP after timer expires', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(() => {
          jest.advanceTimersByTime(180000) // 3 minutes

          expect(screen.getByText('Resend OTP')).toBeInTheDocument()
        })
      })
    })
  })

  describe('Mobile OTP Verification', () => {
    it('should send mobile OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        const mobileOtpButton = sendOtpButtons[1] // Second Send OTP button

        fireEvent.click(mobileOtpButton)

        await waitFor(() => {
          const otpInputs = screen.getAllByPlaceholderText('Enter 6-digit OTP')
          expect(otpInputs.length).toBeGreaterThan(0)
        })
      })
    })

    it('should verify mobile with correct OTP', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[1]) // Mobile OTP button

        await waitFor(async () => {
          const otpInputs = screen.getAllByPlaceholderText('Enter 6-digit OTP')
          const mobileOtpInput = otpInputs[otpInputs.length - 1]
          fireEvent.change(mobileOtpInput, { target: { value: '123456' } })

          const verifyButtons = screen.getAllByText('Verify')
          const mobileVerifyButton = verifyButtons[verifyButtons.length - 1]
          fireEvent.click(mobileVerifyButton)

          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              '/api/user/verify-mobile',
              expect.objectContaining({
                method: 'POST',
              })
            )
          })
        })
      })
    })

    it('should show error for invalid mobile OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[1])

        await waitFor(async () => {
          const otpInputs = screen.getAllByPlaceholderText('Enter 6-digit OTP')
          const mobileOtpInput = otpInputs[otpInputs.length - 1]
          fireEvent.change(mobileOtpInput, { target: { value: '999999' } })

          const verifyButtons = screen.getAllByText('Verify')
          const mobileVerifyButton = verifyButtons[verifyButtons.length - 1]
          fireEvent.click(mobileVerifyButton)

          await waitFor(() => {
            const toast = document.querySelector('.bg-red-500')
            expect(toast).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('Password Update', () => {
    it('should show password change button', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        expect(screen.getByText('Change password')).toBeInTheDocument()
      })
    })

    it('should show password inputs when change password clicked', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
      })
    })

    it('should toggle new password visibility', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const newPasswordInput = screen.getByPlaceholderText('Enter new password')
        expect(newPasswordInput).toHaveAttribute('type', 'password')

        const toggleButtons = screen.getAllByRole('button')
        const showButton = toggleButtons.find(btn => btn.querySelector('svg'))
        if (showButton) {
          fireEvent.click(showButton)
          expect(newPasswordInput).toHaveAttribute('type', 'text')
        }
      })
    })

    it('should update password successfully', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const newPasswordInput = screen.getByPlaceholderText('Enter new password')
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

        const updateButton = screen.getByText('Update Password')
        fireEvent.click(updateButton)

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/user/update-password',
            expect.objectContaining({
              method: 'POST',
            })
          )
        })
      })
    })

    it('should show error when passwords do not match', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const newPasswordInput = screen.getByPlaceholderText('Enter new password')
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
        fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } })

        const updateButton = screen.getByText('Update Password')
        fireEvent.click(updateButton)

        const toast = document.querySelector('.bg-red-500')
        expect(toast).toBeInTheDocument()
      })
    })

    it('should show error when password is too short', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const newPasswordInput = screen.getByPlaceholderText('Enter new password')
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(newPasswordInput, { target: { value: '12345' } })
        fireEvent.change(confirmPasswordInput, { target: { value: '12345' } })

        const updateButton = screen.getByText('Update Password')
        fireEvent.click(updateButton)

        const toast = document.querySelector('.bg-red-500')
        expect(toast).toBeInTheDocument()
      })
    })

    it('should cancel password change', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(screen.queryByPlaceholderText('Enter new password')).not.toBeInTheDocument()
      })
    })
  })

  describe('Avatar Update', () => {
    it('should show avatar upload section', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        expect(screen.getByText(/Profile Picture/i)).toBeInTheDocument()
        expect(screen.getByText('Upload a file')).toBeInTheDocument()
      })
    })

    it('should show Company Logo for agents', async () => {
      const agentUser = { ...mockUser, isAgent: true }
      mockUseSession.mockReturnValue({
        data: { user: agentUser },
        status: 'authenticated',
        update: mockUpdate,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        expect(screen.getByText(/Company Logo/i)).toBeInTheDocument()
      })
    })

    it('should handle avatar file selection', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' })
        const fileInput = screen.getByLabelText(/upload a file/i).closest('input[type="file"]')!

        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        })

        fireEvent.change(fileInput)

        // File will be processed
        expect(fileInput.files?.[0]).toBe(file)
      })
    })

    it('should show error for non-image file', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' })
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        })

        fireEvent.change(fileInput)

        const toast = document.querySelector('.bg-red-500')
        expect(toast).toBeInTheDocument()
      })
    })

    it('should show error for oversized file', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', {
          type: 'image/png',
        })
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

        Object.defineProperty(fileInput, 'files', {
          value: [largeFile],
          writable: false,
        })

        fireEvent.change(fileInput)

        const toast = document.querySelector('.bg-red-500')
        expect(toast).toBeInTheDocument()
      })
    })

    it('should update avatar successfully', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ imageUrl: 'https://example.com/avatar.png' }),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const file = new File(['valid content'], 'avatar.png', { type: 'image/png' })
        Object.defineProperty(file, 'size', { value: 500 * 1024 })

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        })

        // Mock FileReader
        const mockFileReader = {
          readAsDataURL: jest.fn(function () {
            this.onloadend?.({ target: { result: 'data:image/png;base64,mock' } })
          }),
          result: 'data:image/png;base64,mock',
        }
        global.FileReader = jest.fn(() => mockFileReader) as any

        fireEvent.change(fileInput)

        await waitFor(() => {
          const updateButton = screen.getByText('Update Avatar')
          expect(updateButton).toBeInTheDocument()

          fireEvent.click(updateButton)
        })

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/user/update-avatar',
            expect.objectContaining({
              method: 'POST',
            })
          )
          expect(mockUpdate).toHaveBeenCalled()
        })
      })
    })
  })

  describe('Toast Notifications', () => {
    it('should show success toast', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const newPasswordInput = screen.getByPlaceholderText('Enter new password')
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

        const updateButton = screen.getByText('Update Password')
        fireEvent.click(updateButton)

        await waitFor(() => {
          const successToast = document.querySelector('.bg-green-500')
          expect(successToast).toBeInTheDocument()
        })
      })
    })

    it('should auto-hide toast after 5 seconds', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const updateButton = screen.getByText('Update Password')
        fireEvent.click(updateButton)

        const toast = document.querySelector('.bg-red-500')
        expect(toast).toBeInTheDocument()

        jest.advanceTimersByTime(5000)

        const toastAfter = document.querySelector('.bg-red-500')
        expect(toastAfter).not.toBeInTheDocument()
      })
    })
  })

  describe('Country Code', () => {
    it('should extract country code from mobile number +91', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const countryCodeDropdown = screen.getByTestId('country-code-dropdown')
        expect(countryCodeDropdown).toHaveValue('+91')
      })
    })

    it('should extract country code from mobile number +1', async () => {
      const userWithUS = { ...mockUser, mobileNumber: '+11234567890' }
      mockUseSession.mockReturnValue({
        data: { user: userWithUS },
        status: 'authenticated',
        update: mockUpdate,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const countryCodeDropdown = screen.getByTestId('country-code-dropdown')
        expect(countryCodeDropdown).toHaveValue('+1')
      })
    })

    it('should default to +91 for unknown country code', async () => {
      const userWithOther = { ...mockUser, mobileNumber: '+441234567890' }
      mockUseSession.mockReturnValue({
        data: { user: userWithOther },
        status: 'authenticated',
        update: mockUpdate,
      })
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const countryCodeDropdown = screen.getByTestId('country-code-dropdown')
        expect(countryCodeDropdown).toHaveValue('+91')
      })
    })

    it('should disable country code dropdown', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const countryCodeDropdown = screen.getByTestId('country-code-dropdown')
        expect(countryCodeDropdown).toBeDisabled()
      })
    })
  })

  describe('Profile Image Display', () => {
    it('should fetch and display user profile image', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: 'https://example.com/avatar.png' } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/info?email=john@example.com')
      })
    })

    it('should show initials when no profile image', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(() => {
        const initials = screen.getByText('JD')
        expect(initials).toBeInTheDocument()
      })
    })

    it('should handle profile image fetch error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<UserInfoPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during password update', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
            )
        )

      render(<UserInfoPage />)

      await waitFor(async () => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const newPasswordInput = screen.getByPlaceholderText('Enter new password')
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

        const updateButton = screen.getByText('Update Password')
        fireEvent.click(updateButton)

        expect(screen.getByText('Updating...')).toBeInTheDocument()

        await waitFor(() => {
          expect(screen.queryByText('Updating...')).not.toBeInTheDocument()
        })
      })
    })

    it('should show loading state during avatar update', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ ok: true, json: async () => ({ imageUrl: 'url' }) }), 100)
            )
        )

      render(<UserInfoPage />)

      await waitFor(async () => {
        const file = new File(['valid content'], 'avatar.png', { type: 'image/png' })
        Object.defineProperty(file, 'size', { value: 500 * 1024 })

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        })

        const mockFileReader = {
          readAsDataURL: jest.fn(function () {
            this.onloadend?.({ target: { result: 'data:image/png;base64,mock' } })
          }),
          result: 'data:image/png;base64,mock',
        }
        global.FileReader = jest.fn(() => mockFileReader) as any

        fireEvent.change(fileInput)

        await waitFor(() => {
          const updateButton = screen.getByText('Update Avatar')
          fireEvent.click(updateButton)

          expect(screen.getByText('Uploading...')).toBeInTheDocument()
        })

        await waitFor(() => {
          expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle password update error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Password update failed' }),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const changePasswordButton = screen.getByRole('button', { name: 'Change password' })
        fireEvent.click(changePasswordButton)

        const newPasswordInput = screen.getByPlaceholderText('Enter new password')
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

        const updateButton = screen.getByText('Update Password')
        fireEvent.click(updateButton)

        await waitFor(() => {
          const errorToast = document.querySelector('.bg-red-500')
          expect(errorToast).toBeInTheDocument()
        })
      })
    })

    it('should handle avatar update error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Avatar update failed' }),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const file = new File(['valid content'], 'avatar.png', { type: 'image/png' })
        Object.defineProperty(file, 'size', { value: 500 * 1024 })

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        })

        const mockFileReader = {
          readAsDataURL: jest.fn(function () {
            this.onloadend?.({ target: { result: 'data:image/png;base64,mock' } })
          }),
          result: 'data:image/png;base64,mock',
        }
        global.FileReader = jest.fn(() => mockFileReader) as any

        fireEvent.change(fileInput)

        await waitFor(() => {
          const updateButton = screen.getByText('Update Avatar')
          fireEvent.click(updateButton)
        })

        await waitFor(() => {
          const errorToast = document.querySelector('.bg-red-500')
          expect(errorToast).toBeInTheDocument()
        })
      })
    })

    it('should handle email verification error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { image: null } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Verification failed' }),
        })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(async () => {
          const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
          fireEvent.change(otpInput, { target: { value: '123456' } })

          const verifyButton = screen.getByRole('button', { name: 'Verify' })
          fireEvent.click(verifyButton)

          await waitFor(() => {
            const errorToast = document.querySelector('.bg-red-500')
            expect(errorToast).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('OTP Input Sanitization', () => {
    it('should only allow numeric input for email OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(() => {
          const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
          fireEvent.change(otpInput, { target: { value: 'abc123xyz' } })

          expect(otpInput).toHaveValue('123')
        })
      })
    })

    it('should limit email OTP to 6 digits', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { image: null } }),
      })

      render(<UserInfoPage />)

      await waitFor(async () => {
        const sendOtpButtons = screen.getAllByText('Send OTP')
        fireEvent.click(sendOtpButtons[0])

        await waitFor(() => {
          const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
          fireEvent.change(otpInput, { target: { value: '12345678' } })

          expect(otpInput).toHaveValue('123456')
        })
      })
    })
  })
})
