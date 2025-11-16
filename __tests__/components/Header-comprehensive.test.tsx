import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import Header from '@/components/Header'
import { mockRouter, mockFetchSuccess, mockFetchError } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

describe('Header Component - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    global.fetch = jest.fn()
  })

  describe('Rendering', () => {
    it('should render header with logo', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Header />)
      const logos = screen.getAllByAltText('Grihome Logo')
      expect(logos.length).toBeGreaterThan(0)
      expect(screen.getByText('GRIHOME')).toBeInTheDocument()
    })

    it('should render header navigation links', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const { rerender } = render(<Header />)
      rerender(<Header />)

      await waitFor(() => {
        expect(screen.getAllByText(/grihome/i).length).toBeGreaterThan(0)
      })
    })

    it('should render logo image', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Header />)

      await waitFor(() => {
        const logos = screen.getAllByAltText(/grihome logo/i)
        expect(logos.length).toBeGreaterThan(0)
      })
    })

    it('should render mobile menu button', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Header />)

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle menu/i)
        expect(toggleButton).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Links', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('should render Buy link', async () => {
      render(<Header />)

      await waitFor(() => {
        const buyLinks = screen.getAllByText(/buy/i)
        expect(buyLinks.length).toBeGreaterThan(0)
      })
    })

    it('should render Rent link', async () => {
      render(<Header />)

      await waitFor(() => {
        const rentLinks = screen.getAllByText(/rent/i)
        expect(rentLinks.length).toBeGreaterThan(0)
      })
    })

    it('should render Projects link', async () => {
      render(<Header />)

      await waitFor(() => {
        const projectsLinks = screen.getAllByText(/projects/i)
        expect(projectsLinks.length).toBeGreaterThan(0)
      })
    })

    it('should render Forum link', async () => {
      render(<Header />)

      await waitFor(() => {
        const forumLinks = screen.getAllByText(/forum/i)
        expect(forumLinks.length).toBeGreaterThan(0)
      })
    })

    it('should render Contact Us link', async () => {
      render(<Header />)

      await waitFor(() => {
        const contactLinks = screen.getAllByText(/contact us/i)
        expect(contactLinks.length).toBeGreaterThan(0)
      })
    })

    it('should have correct href for Buy link', async () => {
      render(<Header />)

      await waitFor(() => {
        const buyLinks = screen.getAllByText(/^Buy$/i)
        const buyLink = buyLinks[0].closest('a')
        expect(buyLink).toHaveAttribute('href', '/properties?type=buy')
      })
    })

    it('should have correct href for Rent link', async () => {
      render(<Header />)

      await waitFor(() => {
        const rentLinks = screen.getAllByText(/^Rent$/i)
        const rentLink = rentLinks[0].closest('a')
        expect(rentLink).toHaveAttribute('href', '/properties?type=rent')
      })
    })

    it('should have correct href for Projects link', async () => {
      render(<Header />)

      await waitFor(() => {
        const projectsLinks = screen.getAllByText(/^Projects$/i)
        const projectsLink = projectsLinks[0].closest('a')
        expect(projectsLink).toHaveAttribute('href', '/projects')
      })
    })

    it('should have correct href for Forum link', async () => {
      render(<Header />)

      await waitFor(() => {
        const forumLinks = screen.getAllByText(/^Forum$/i)
        const forumLink = forumLinks[0].closest('a')
        expect(forumLink).toHaveAttribute('href', '/forum')
      })
    })
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('should show Sign in button', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText(/^sign in$/i)).toBeInTheDocument()
      })
    })

    it('should show Sign up button', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText(/sign up/i)).toBeInTheDocument()
      })
    })

    it('should show Login to post property link', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText(/login to post property/i)).toBeInTheDocument()
      })
    })

    it('should not show user menu', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
      })
    })

    it('Sign in link should point to /login', async () => {
      render(<Header />)

      await waitFor(() => {
        const signInLink = screen.getByText(/^sign in$/i).closest('a')
        expect(signInLink).toHaveAttribute('href', '/login')
      })
    })

    it('Sign up link should point to /signup', async () => {
      render(<Header />)

      await waitFor(() => {
        const signUpLink = screen.getByText(/sign up/i).closest('a')
        expect(signUpLink).toHaveAttribute('href', '/signup')
      })
    })
  })

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
      expires: '2099-12-31',
    }

    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should show welcome message with user name', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText(/welcome test user/i)).toBeInTheDocument()
      })
    })

    it('should show username from email if name is not available', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            email: 'johndoe@example.com',
          },
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText(/welcome johndoe/i)).toBeInTheDocument()
      })
    })

    it('should show Post property for free link', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText(/post property for free/i)).toBeInTheDocument()
      })
    })

    it('should not show Sign in/Sign up buttons', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.queryByText(/^sign in$/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/^sign up$/i)).not.toBeInTheDocument()
      })
    })

    it('should show user avatar with initials when no image', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument()
      })
    })

    it('should show first letter of email as avatar when no name', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            email: 'test@example.com',
          },
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument()
      })
    })

    it('should fetch user image from API if not in session', async () => {
      mockFetchSuccess({ user: { image: 'https://example.com/avatar.jpg' } })

      render(<Header />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/info?email=test@example.com')
        )
      })
    })

    it('should display user image if in session', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/profile.jpg',
          },
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<Header />)

      await waitFor(() => {
        const avatars = screen.getAllByAltText(/profile/i)
        expect(avatars.length).toBeGreaterThan(0)
      })
    })

    it('should not fetch user image if already in session', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/profile.jpg',
          },
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<Header />)

      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled()
      })
    })

    it('should handle image fetch failure gracefully', async () => {
      mockFetchError('Failed to fetch')

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument()
      })
    })
  })

  describe('User Menu', () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'BUYER',
      },
      expires: '2099-12-31',
    }

    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should toggle user menu on button click', async () => {
      render(<Header />)

      await waitFor(() => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        expect(screen.getByText(/my information/i)).toBeInTheDocument()
        expect(screen.getByText(/my properties/i)).toBeInTheDocument()
      })
    })

    it('should show user email in dropdown', async () => {
      render(<Header />)

      await waitFor(() => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should show user role in dropdown', async () => {
      render(<Header />)

      await waitFor(() => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        expect(screen.getByText('BUYER')).toBeInTheDocument()
      })
    })

    it('should show My Information link', async () => {
      render(<Header />)

      await waitFor(() => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        const myInfoLink = screen.getByText(/my information/i).closest('a')
        expect(myInfoLink).toHaveAttribute('href', '/userinfo')
      })
    })

    it('should show My Properties link', async () => {
      render(<Header />)

      await waitFor(() => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        const myPropsLink = screen.getByText(/my properties/i).closest('a')
        expect(myPropsLink).toHaveAttribute('href', '/properties/my-properties')
      })
    })

    it('should show Logout button', async () => {
      render(<Header />)

      await waitFor(() => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        expect(screen.getByText(/^logout$/i)).toBeInTheDocument()
      })
    })

    it('should close menu on outside click', async () => {
      render(<Header />)

      await waitFor(async () => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        expect(screen.getByText(/my information/i)).toBeInTheDocument()
      })

      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByText(/my information/i)).not.toBeInTheDocument()
      })
    })

    it('should call signOut on logout button click', async () => {
      render(<Header />)

      await waitFor(() => {
        const menuButton = screen.getByText(/welcome test user/i).closest('button')
        fireEvent.click(menuButton!)
      })

      await waitFor(() => {
        const logoutButton = screen.getByText(/^logout$/i)
        fireEvent.click(logoutButton)
      })

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })
  })

  describe('Mobile Menu', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('should open mobile menu on toggle button click', async () => {
      render(<Header />)

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle menu/i)
        fireEvent.click(toggleButton)
      })

      await waitFor(() => {
        const mobileMenus = screen.getAllByText(/grihome/i)
        expect(mobileMenus.length).toBeGreaterThan(2)
      })
    })

    it('should close mobile menu on close button click', async () => {
      render(<Header />)

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle menu/i)
        fireEvent.click(toggleButton)
      })

      await waitFor(() => {
        const closeButtons = screen.getByRole('button', { name: '' })
        fireEvent.click(closeButtons)
      })
    })

    it('should close mobile menu on backdrop click', async () => {
      render(<Header />)

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle menu/i)
        fireEvent.click(toggleButton)
      })

      await waitFor(() => {
        const overlay = document.querySelector('.mobile-modal-overlay')
        fireEvent.click(overlay!)
      })
    })

    it('should close mobile menu on link click', async () => {
      render(<Header />)

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle menu/i)
        fireEvent.click(toggleButton)
      })

      await waitFor(() => {
        const buyLinks = screen.getAllByText(/^Buy$/i)
        const mobileLink = buyLinks[buyLinks.length - 1]
        fireEvent.click(mobileLink)
      })
    })
  })

  describe('Loading State', () => {
    it('should show placeholder during loading', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
      })
    })

    it('should not show login link during loading', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.queryByText(/login to post property/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Logo Link', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('should link to homepage', async () => {
      render(<Header />)

      await waitFor(() => {
        const logoTexts = screen.getAllByText(/grihome/i)
        const logoLink = logoTexts[0].closest('a')
        expect(logoLink).toHaveAttribute('href', '/')
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('should have proper ARIA labels on toggle button', async () => {
      render(<Header />)

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle menu/i)
        expect(toggleButton).toHaveAttribute('aria-label', 'Toggle Menu')
      })
    })

    it('should have proper button types', async () => {
      render(<Header />)

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle menu/i)
        expect(toggleButton).toHaveAttribute('type', 'button')
      })
    })
  })
})
