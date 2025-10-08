import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import type { NextPage } from 'next'

const Header: NextPage = () => {
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false)
  const [userImage, setUserImage] = useState<string | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { data: session, status, update } = useSession()
  const router = useRouter()
  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user image from database if not in session
  useEffect(() => {
    const fetchUserImage = async () => {
      if (isAuthenticated && user?.email && !user.image) {
        try {
          const response = await fetch(`/api/user/info?email=${user.email}`)
          if (response.ok) {
            const data = await response.json()
            if (data.user?.image) {
              setUserImage(data.user.image)
              // Update session with the image
              await update()
            }
          }
        } catch (error) {
          // Silent fail
        }
      } else if (user?.image) {
        setUserImage(user.image)
      }
    }

    fetchUserImage()
  }, [isAuthenticated, user?.email, user?.image, update, user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
    setUserMenuOpen(false)
  }

  if (!mounted) return null

  return (
    <>
      <header className="header sticky-nav">
        <div className="header-container">
          <div className="header-top">
            <Link href="/" className="header-logo">
              <Image
                src="/images/grihome-logo.png"
                alt="Grihome Logo"
                width={50}
                height={50}
                className="header-logo-image"
              />
              <span className="header-logo-text">GRIHOME</span>
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
            <div className="desktop-nav-links flex items-center">
              <Link href="/agents" className="desktop-nav-link">
                Agents
              </Link>
              <Link href="/projects" className="desktop-nav-link">
                Projects
              </Link>
              <Link href="/properties" className="desktop-nav-link">
                Properties
              </Link>
              <Link href="/forum" className="desktop-nav-link">
                Forum
              </Link>
              <Link href="/contactUs/contact" className="desktop-nav-link">
                Contact Us
              </Link>
              {isAuthenticated && user && (
                <Link href="/properties/add-property" className="header-add-property-link">
                  Post property for free
                </Link>
              )}
            </div>

            <div className="auth-section flex items-center">
              {isAuthenticated && user ? (
                <>
                  <div className="user-menu" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="user-menu-button flex items-center"
                    >
                      <span className="font-medium hidden md:block">
                        Welcome {user.name || user.email?.split('@')[0]}
                      </span>
                      <span className="font-medium md:hidden">
                        {user.name?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                      <div className="user-avatar relative">
                        {userImage ? (
                          <Image
                            src={userImage}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center">
                            {user.name
                              ? user.name
                                  .split(' ')
                                  .map((n: string) => n.charAt(0))
                                  .join('')
                                  .slice(0, 2)
                              : user.email?.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <svg
                          className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-blue-600 bg-white rounded-full"
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
                          <p className="user-name">{user.name || user.email?.split('@')[0]}</p>
                          <p className="username">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.role || 'USER'}</p>
                        </div>
                        <Link href="/userinfo" className="dropdown-link">
                          My Information
                        </Link>
                        <Link href="/properties/my-properties" className="dropdown-link">
                          My Properties
                        </Link>
                        <button onClick={handleLogout} className="logout-button">
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
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
                    href="/agents"
                    className="mobile-nav-link"
                    onClick={() => setNavbarOpen(false)}
                  >
                    Agents
                  </Link>
                  <Link
                    href="/projects"
                    className="mobile-nav-link"
                    onClick={() => setNavbarOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    href="/properties"
                    className="mobile-nav-link"
                    onClick={() => setNavbarOpen(false)}
                  >
                    Properties
                  </Link>
                  <Link
                    href="/forum"
                    className="mobile-nav-link"
                    onClick={() => setNavbarOpen(false)}
                  >
                    Forum
                  </Link>
                  <Link
                    href="/contactUs/contact"
                    className="mobile-nav-link"
                    onClick={() => setNavbarOpen(false)}
                  >
                    Contact Us
                  </Link>
                  {isAuthenticated && user && (
                    <Link
                      href="/properties/add-property"
                      className="header-add-property-link-mobile"
                      onClick={() => setNavbarOpen(false)}
                    >
                      Post property for free
                    </Link>
                  )}
                </nav>

                <div className="mobile-auth-section">
                  {isAuthenticated && user ? (
                    <div>
                      <div className="mobile-user-info">
                        <div className="mobile-user-avatar">
                          {userImage ? (
                            <Image
                              src={userImage}
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
                                : user.email?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="mobile-user-details">
                          <p className="user-name">{user.name || user.email?.split('@')[0]}</p>
                          <p className="username">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.role || 'USER'}</p>
                        </div>
                      </div>
                      <div className="mobile-user-links">
                        <Link
                          href="/userinfo"
                          onClick={() => setNavbarOpen(false)}
                          className="mobile-user-link"
                        >
                          My Information
                        </Link>
                        <Link
                          href="/properties/my-properties"
                          onClick={() => setNavbarOpen(false)}
                          className="mobile-user-link"
                        >
                          My Properties
                        </Link>
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
    </>
  )
}

export default Header
