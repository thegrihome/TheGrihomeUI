import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import type { NextPage } from 'next'
import { RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'
import AuthModal from './auth/AuthModal'

const Header: NextPage = () => {
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false)
  
  const { theme, setTheme } = useTheme()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignIn = () => {
    setAuthMode('login')
    setAuthModalOpen(true)
  }

  const handleSignUp = () => {
    setAuthMode('signup')
    setAuthModalOpen(true)
  }

  const handleLogout = () => {
    dispatch(logout())
    setUserMenuOpen(false)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  if (!mounted) return null

  return (
    <header className="w-full sticky-nav">
      <div className="flex flex-col flex-wrap max-w-5xl p-2.5 mx-auto md:flex-row">
        <div className="flex flex-row items-center justify-between p-2 md:p-1">
          <Link href="/" className="mb-4 text-2xl font-medium text-black transition duration-300 hover:text-gray-300 dark:text-gray-300 dark:hover:text-white md:mb-0">
            GRIHOME
          </Link>
          <button
            className="px-3 py-1 pb-4 ml-auto text-black outline-none dark:text-gray-300 md:hidden"
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

        <div
          className={`md:flex flex-grow items-center ${
            navbarOpen ? 'flex' : 'hidden'
          }`}
        >
          <div className="flex flex-wrap items-center justify-center pt-1 pl-2 ml-1 space-x-8 md:space-x-16 md:mx-auto md:pl-14">
            <a
              href="/#agents"
              className="text-black transition duration-300 dark:text-gray-300 hover:text-gray-300"
            >
              Agents
            </a>
            <a
              href="/#forum"
              className="text-black transition duration-300 dark:text-gray-300 hover:text-gray-300"
            >
              Forum
            </a>
            <Link href="/#contact" className="text-black transition duration-300 dark:text-gray-300 hover:text-gray-300">
              Contact Us
            </Link>
          </div>


          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition duration-300"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <span className="font-medium hidden md:block">Welcome {user.firstName} {user.lastName}</span>
                <span className="font-medium md:hidden">{user.firstName}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2 z-10">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                id="signin-button"
                onClick={handleSignIn}
                className="dark:hover:border-gray-500 hover:shadow-md transition duration-300 mr-2 md:mr-4 text-black border px-2 md:px-3 py-1.5 rounded dark:text-gray-300 text-sm"
              >
                Sign in
              </button>
              <button
                id="signup-button"
                onClick={handleSignUp}
                className="px-2 md:px-3 py-1.5 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black bg-black dark:bg-white rounded text-sm"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
      
      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={closeAuthModal}
      />
    </header>
  )
}

export default Header
