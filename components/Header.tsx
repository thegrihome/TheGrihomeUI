import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import type { NextPage } from 'next'
import { RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

const Header: NextPage = () => {
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false)
  
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    setUserMenuOpen(false)
  }

  if (!mounted) return null

  return (
    <header className="header sticky-nav">
      <div className="header-container">
        <div className="header-top">
          <Link href="/" className="header-logo">
            GRIHOME
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Toggle Menu"
            onClick={() => setNavbarOpen(!navbarOpen)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          <div className="desktop-nav-links">
            <a href="/#agents" className="desktop-nav-link">
              Agents
            </a>
            <a href="/#builders" className="desktop-nav-link">
              Builders
            </a>
            <a href="/#forum" className="desktop-nav-link">
              Forum
            </a>
            <Link href="/#contact" className="desktop-nav-link">
              Contact Us
            </Link>
          </div>


          <div className="auth-section">
            {isAuthenticated && user ? (
              <div className="user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="user-menu-button"
                >
                  <div className="user-avatar">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                  <span className="font-medium hidden md:block">Welcome {user.firstName} {user.lastName}</span>
                  <span className="font-medium md:hidden">{user.firstName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {userMenuOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-info">
                      <p className="user-name">{user.firstName} {user.lastName}</p>
                      <p className="username">@{user.username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="logout-button"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="signin-button"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="signup-button"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Modal - Outside header container */}
      {navbarOpen && (
        <div className="mobile-modal-overlay" onClick={() => setNavbarOpen(false)}>
          <div className="mobile-modal-backdrop" onClick={() => setNavbarOpen(false)} />
          <div className="mobile-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-content">
              <div className="mobile-modal-header">
                <Link href="/" className="mobile-modal-logo">
                  GRIHOME
                </Link>
                <button
                  onClick={() => setNavbarOpen(false)}
                  className="mobile-modal-close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="mobile-nav-links">
                <a
                  href="/#agents"
                  className="mobile-nav-link"
                  onClick={() => setNavbarOpen(false)}
                >
                  Agents
                </a>
                <a
                  href="/#builders"
                  className="mobile-nav-link"
                  onClick={() => setNavbarOpen(false)}
                >
                  Builders
                </a>
                <a
                  href="/#forum"
                  className="mobile-nav-link"
                  onClick={() => setNavbarOpen(false)}
                >
                  Forum
                </a>
                <Link
                  href="/#contact"
                  className="mobile-nav-link"
                  onClick={() => setNavbarOpen(false)}
                >
                  Contact Us
                </Link>
              </nav>

              <div className="mobile-auth-section">
                {isAuthenticated && user ? (
                  <div>
                    <div className="mobile-user-info">
                      <div className="mobile-user-avatar">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div className="mobile-user-details">
                        <p className="user-name">{user.firstName} {user.lastName}</p>
                        <p className="username">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setNavbarOpen(false)
                      }}
                      className="mobile-logout-button"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="mobile-auth-buttons">
                    <Link
                      href="/login"
                      onClick={() => setNavbarOpen(false)}
                      className="mobile-signin-button"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setNavbarOpen(false)}
                      className="mobile-signup-button"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
