import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import Header from '@/components/Header'
import { mockRouter, mockSession, mockAgentSession } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('renders header correctly', () => {
      render(<Header />)
      expect(screen.getByText(/grihome/i)).toBeInTheDocument()
    })

    it('shows login button', () => {
      render(<Header />)
      expect(screen.getByText(/login/i)).toBeInTheDocument()
    })

    it('shows signup button', () => {
      render(<Header />)
      expect(screen.getByText(/signup/i)).toBeInTheDocument()
    })

    it('has navigation links', () => {
      render(<Header />)

      expect(screen.getByText(/properties/i)).toBeInTheDocument()
      expect(screen.getByText(/projects/i)).toBeInTheDocument()
      expect(screen.getByText(/forum/i)).toBeInTheDocument()
    })

    it('login button navigates to login page', () => {
      render(<Header />)

      const loginButton = screen.getByText(/login/i)
      const loginLink = loginButton.closest('a')

      expect(loginLink).toHaveAttribute('href', '/auth/login')
    })

    it('signup button navigates to signup page', () => {
      render(<Header />)

      const signupButton = screen.getByText(/signup/i)
      const signupLink = signupButton.closest('a')

      expect(signupLink).toHaveAttribute('href', '/auth/signup')
    })
  })

  describe('Authenticated User', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('shows user name', () => {
      render(<Header />)
      expect(screen.getByText(/test user/i)).toBeInTheDocument()
    })

    it('does not show login/signup buttons', () => {
      render(<Header />)
      expect(screen.queryByText(/login/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/signup/i)).not.toBeInTheDocument()
    })

    it('shows profile dropdown menu', () => {
      render(<Header />)

      const profileButton = screen.getByText(/test user/i)
      fireEvent.click(profileButton)

      expect(screen.getByText(/my profile/i)).toBeInTheDocument()
      expect(screen.getByText(/my listings/i)).toBeInTheDocument()
      expect(screen.getByText(/logout/i)).toBeInTheDocument()
    })

    it('logout button calls signOut', () => {
      render(<Header />)

      const profileButton = screen.getByText(/test user/i)
      fireEvent.click(profileButton)

      const logoutButton = screen.getByText(/logout/i)
      fireEvent.click(logoutButton)

      expect(signOut).toHaveBeenCalled()
    })

    it('profile link navigates to userinfo page', () => {
      render(<Header />)

      const profileButton = screen.getByText(/test user/i)
      fireEvent.click(profileButton)

      const profileLink = screen.getByText(/my profile/i).closest('a')
      expect(profileLink).toHaveAttribute('href', '/auth/userinfo')
    })

    it('my listings link navigates to active listings page', () => {
      render(<Header />)

      const profileButton = screen.getByText(/test user/i)
      fireEvent.click(profileButton)

      const listingsLink = screen.getByText(/my listings/i).closest('a')
      expect(listingsLink).toHaveAttribute('href', '/user/active-listings')
    })
  })

  describe('Agent User', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: mockAgentSession,
        status: 'authenticated',
      })
    })

    it('shows company name for agents', () => {
      render(<Header />)
      expect(screen.getByText(/test realty/i)).toBeInTheDocument()
    })

    it('shows add property button for agents', () => {
      render(<Header />)
      expect(screen.getByText(/add property/i)).toBeInTheDocument()
    })

    it('add property button navigates to add property page', () => {
      render(<Header />)

      const addPropertyLink = screen.getByText(/add property/i).closest('a')
      expect(addPropertyLink).toHaveAttribute('href', '/properties/add')
    })
  })

  describe('Navigation Links', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('properties link navigates to properties page', () => {
      render(<Header />)

      const propertiesLink = screen.getByText(/properties/i).closest('a')
      expect(propertiesLink).toHaveAttribute('href', '/properties')
    })

    it('projects link navigates to projects page', () => {
      render(<Header />)

      const projectsLink = screen.getByText(/projects/i).closest('a')
      expect(projectsLink).toHaveAttribute('href', '/projects')
    })

    it('forum link navigates to forum page', () => {
      render(<Header />)

      const forumLink = screen.getByText(/forum/i).closest('a')
      expect(forumLink).toHaveAttribute('href', '/forum')
    })

    it('logo navigates to home page', () => {
      render(<Header />)

      const logoLink = screen.getByText(/grihome/i).closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('Mobile Menu', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('shows mobile menu toggle button', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/toggle menu/i)
      expect(menuButton).toBeInTheDocument()
    })

    it('toggles mobile menu on button click', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/toggle menu/i)
      fireEvent.click(menuButton)

      // Mobile menu should be visible
      const mobileMenu = screen.getByRole('navigation', { name: /mobile/i })
      expect(mobileMenu).toBeInTheDocument()
    })
  })
})
