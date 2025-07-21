import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import type { NextPage } from 'next'
import { RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

const Header: NextPage = () => {
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false)

  const dispatch = useDispatch()
  const router = useRouter()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    setUserMenuOpen(false)
    router.push('/')
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
            <Link href="/#agents" className="desktop-nav-link">
              Agents
            </Link>
            <Link href="/#builders" className="desktop-nav-link">
              Builders
            </Link>
            <Link href="/#forum" className="desktop-nav-link">
              Forum
            </Link>
            <Link href="/#contact" className="desktop-nav-link">
              Contact Us
            </Link>
          </div>

          <div className="auth-section">
            {isAuthenticated && user ? (
              <div className="user-menu">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="user-menu-button">
                  <span className="font-medium hidden md:block">
                    Welcome {user.name || user.username}
                  </span>
                  <span className="font-medium md:hidden">
                    {user.name?.split(' ')[0] || user.username}
                  </span>
                  <div className="user-avatar relative">
                    {user.imageLink ? (
                      <Image
                        src={user.imageLink}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium">
                        {user.name
                          ? user.name
                              .split(' ')
                              .map((n: string) => n.charAt(0))
                              .join('')
                              .slice(0, 2)
                          : user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <svg
                      className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-gray-600 bg-white rounded-full"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-info">
                      <p className="user-name">{user.name || user.username}</p>
                      <p className="username">@{user.username}</p>
                      {user.isAgent && user.companyName && (
                        <p className="text-xs text-gray-500">{user.companyName}</p>
                      )}
                    </div>
                    <Link href="/userinfo" className="dropdown-link">
                      My Information
                    </Link>
                    <button onClick={handleLogout} className="logout-button">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="signin-button">
                  Sign in
                </Link>
                <Link href="/signup" className="signup-button">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Modal - Outside header container */}
      {navbarOpen && (
        <div
          className="mobile-modal-overlay"
          onClick={() => setNavbarOpen(false)}
          onTouchEnd={() => setNavbarOpen(false)}
        >
          <div
            className="mobile-modal-backdrop"
            onClick={() => setNavbarOpen(false)}
            onTouchEnd={() => setNavbarOpen(false)}
          />
          <div
            className="mobile-modal-panel"
            onClick={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            <div className="mobile-modal-content">
              <div className="mobile-modal-header">
                <Link href="/" className="mobile-modal-logo">
                  GRIHOME
                </Link>
                <button onClick={() => setNavbarOpen(false)} className="mobile-modal-close">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <nav className="mobile-nav-links">
                <Link
                  href="/#agents"
                  className="mobile-nav-link"
                  onClick={() => setNavbarOpen(false)}
                >
                  Agents
                </Link>
                <Link
                  href="/#builders"
                  className="mobile-nav-link"
                  onClick={() => setNavbarOpen(false)}
                >
                  Builders
                </Link>
                <Link
                  href="/#forum"
                  className="mobile-nav-link"
                  onClick={() => setNavbarOpen(false)}
                >
                  Forum
                </Link>
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
                        {user.imageLink ? (
                          <Image
                            src={user.imageLink}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium">
                            {user.name
                              ? user.name
                                  .split(' ')
                                  .map((n: string) => n.charAt(0))
                                  .join('')
                                  .slice(0, 2)
                              : user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="mobile-user-details">
                        <p className="user-name">{user.name || user.username}</p>
                        <p className="username">@{user.username}</p>
                        {user.isAgent && user.companyName && (
                          <p className="text-xs text-gray-500">{user.companyName}</p>
                        )}
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
