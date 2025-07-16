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
            PLUTONIUM
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
              href="/#features"
              className="text-black transition duration-300 dark:text-gray-300 hover:text-gray-300"
            >
              Features
            </a>
            <a
              href="/#pricing"
              className="text-black transition duration-300 dark:text-gray-300 hover:text-gray-300"
            >
              Pricing
            </a>
            <Link href="/404" className="text-black transition duration-300 dark:text-gray-300 hover:text-gray-300">
              Demo
            </Link>
          </div>

          <button
            aria-label="Toggle Dark Mode"
            type="button"
            className="w-10 h-10 p-3 ml-5 mr-0 bg-gray-200 rounded md:ml-0 md:mr-5 dark:bg-gray-800"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                className="w-4 h-4 text-gray-800 dark:text-gray-200"
              >
                {theme === 'dark' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                ) : (
                  <path
                    fill="currentColor"
                    d="M10.544 8.717l1.166-.855 1.166.855-.467-1.399 1.012-.778h-1.244l-.467-1.243-.466 1.244H10l1.011.778-.467 1.398zm5.442.855l-.467 1.244h-1.244l1.011.777-.467 1.4 1.167-.855 1.165.855-.466-1.4 1.011-.777h-1.244l-.466-1.244zm-8.979-3.02c0-2.259.795-4.33 2.117-5.955A9.418 9.418 0 00.594 9.98c0 5.207 4.211 9.426 9.406 9.426 2.94 0 5.972-1.354 7.696-3.472-.289.026-.987.044-1.283.044-5.194.001-9.406-4.219-9.406-9.426M10 18.55c-4.715 0-8.551-3.845-8.551-8.57 0-3.783 2.407-6.999 5.842-8.131a10.32 10.32 0 00-1.139 4.703c0 5.368 4.125 9.788 9.365 10.245A9.733 9.733 0 0110 18.55m9.406-16.246h-1.71l-.642-1.71-.642 1.71h-1.71l1.39 1.069-.642 1.924 1.604-1.176 1.604 1.176-.642-1.924 1.39-1.069z"
                  />
                )}
              </svg>
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="invisible md:visible flex items-center space-x-2 text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition duration-300"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <span className="font-medium">Welcome {user.firstName} {user.lastName}</span>
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
                onClick={handleSignIn}
                className="invisible dark:hover:border-gray-500 hover:shadow-md transition duration-300 mr-4 text-black border px-3 py-1.5 rounded dark:text-gray-300 md:visible"
              >
                Sign in
              </button>
              <button
                onClick={handleSignUp}
                className="invisible md:visible px-3 py-1.5 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black bg-black dark:bg-white rounded"
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
