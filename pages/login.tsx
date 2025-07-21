import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { RootState } from '@/store/store'
import { setLoading, setError, setLoginMethod, setUser } from '@/store/slices/authSlice'
import { authService } from '@/services/authService'
import CountryCodeDropdown from '@/components/CountryCodeDropdown'

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'mobile-otp' | 'email-otp' | 'username-password'>(
    'mobile-otp'
  )

  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth)

  // Form states
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [mobileNumber, setMobileNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [showOTPStep, setShowOTPStep] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [canResend, setCanResend] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // OTP timer
  useEffect(() => {
    if (showOTPStep && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setCanResend(true)
    }
  }, [timeLeft, showOTPStep])

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (activeTab === 'username-password') {
      if (!username.trim()) errors.username = 'Username is required'
      if (!password) errors.password = 'Password is required'
    } else if (activeTab === 'email-otp') {
      if (!email.trim()) errors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid'
    } else if (activeTab === 'mobile-otp') {
      if (!mobileNumber.trim()) errors.mobile = 'Mobile number is required'
      else if (!/^\d{7,15}$/.test(mobileNumber.replace(/\s/g, '')))
        errors.mobile = 'Please enter a valid mobile number'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    dispatch(setLoading(true))
    dispatch(setError(null))
    dispatch(setLoginMethod(activeTab))

    try {
      if (activeTab === 'username-password') {
        // Call new username/password login API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'username-password', username, password }),
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Login failed')
        }

        dispatch(setUser(data.user))
        router.push('/')
      } else if (activeTab === 'email-otp') {
        // Check if email exists first
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'email', value: email }),
        })
        const data = await response.json()

        if (!response.ok || !data.exists) {
          throw new Error('Email not registered. Please sign up first.')
        }

        setShowOTPStep(true)
        setTimeLeft(180)
        setCanResend(false)
      } else if (activeTab === 'mobile-otp') {
        // Check if mobile exists first
        const fullMobile = countryCode + mobileNumber
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'mobile', value: fullMobile }),
        })
        const data = await response.json()

        if (!response.ok || !data.exists) {
          throw new Error('Mobile number not registered. Please sign up first.')
        }

        setShowOTPStep(true)
        setTimeLeft(180)
        setCanResend(false)
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Login failed'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) return

    // Check if OTP is 123456 (hardcoded for development)
    if (otp !== '123456') {
      dispatch(setError('Invalid OTP. Please enter 123456 for testing.'))
      return
    }

    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      let response
      if (activeTab === 'email-otp') {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'email-otp', email, otp }),
        })
      } else if (activeTab === 'mobile-otp') {
        const fullMobile = countryCode + mobileNumber
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'mobile-otp', mobile: fullMobile, otp }),
        })
      }

      if (response) {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Login failed')
        }

        dispatch(setUser(data.user))
        router.push('/')
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'OTP verification failed'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return

    // Just reset the timer - no actual OTP sending in development
    setTimeLeft(180)
    setCanResend(false)
    dispatch(setError(null))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const resetForm = () => {
    setShowOTPStep(false)
    setOtp('')
    setTimeLeft(180)
    setCanResend(false)
    dispatch(setError(null))
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              GRIHOME
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Form Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {showOTPStep ? 'Verify your code' : 'Sign in to your account'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {showOTPStep
                ? `We've sent a verification code to ${activeTab === 'email-otp' ? email : countryCode + mobileNumber}`
                : 'Welcome back to GRIHOME'}
            </p>
          </div>

          {/* Tab Navigation */}
          {!showOTPStep && (
            <div className="mb-8">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('mobile-otp')}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'mobile-otp'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mobile OTP
                </button>
                <button
                  onClick={() => setActiveTab('email-otp')}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'email-otp'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Email OTP
                </button>
                <button
                  onClick={() => setActiveTab('username-password')}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'username-password'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Username & Password
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Form Content */}
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            {!showOTPStep ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                {activeTab === 'mobile-otp' && (
                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <div className="mt-1 flex space-x-2">
                      <div className="w-36">
                        <CountryCodeDropdown
                          value={countryCode}
                          onChange={setCountryCode}
                          className={formErrors.mobile ? 'border-red-300' : ''}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          id="mobile"
                          value={mobileNumber}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '')
                            setMobileNumber(value)
                            if (formErrors.mobile) {
                              setFormErrors(prev => {
                                const { mobile, ...rest } = prev
                                return rest
                              })
                            }
                          }}
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.mobile ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="1234567890"
                          maxLength={15}
                        />
                      </div>
                    </div>
                    {formErrors.mobile && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.mobile}</p>
                    )}
                  </div>
                )}

                {activeTab === 'email-otp' && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        if (formErrors.email) {
                          setFormErrors(prev => {
                            const { email, ...rest } = prev
                            return rest
                          })
                        }
                      }}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="john@example.com"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                )}

                {activeTab === 'username-password' && (
                  <>
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={e => {
                          setUsername(e.target.value)
                          if (formErrors.username) {
                            setFormErrors(prev => {
                              const { username, ...rest } = prev
                              return rest
                            })
                          }
                        }}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.username ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="johndoe"
                      />
                      {formErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value)
                          if (formErrors.password) {
                            setFormErrors(prev => {
                              const { password, ...rest } = prev
                              return rest
                            })
                          }
                        }}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading
                    ? 'Please wait...'
                    : activeTab === 'username-password'
                      ? 'Sign In'
                      : 'Send OTP'}
                </button>

                {/* Development notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 mb-2">
                    <strong>🚧 Development Mode:</strong>
                  </p>
                  <p className="text-xs text-blue-600">
                    OTP sending is still in development. For testing, use OTP{' '}
                    <strong>123456</strong>
                  </p>
                  {activeTab === 'username-password' && (
                    <p className="text-xs text-blue-600 mt-1">
                      Try existing usernames: <strong>testuser123</strong> with password{' '}
                      <strong>password123</strong>
                    </p>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={resetForm}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>

                {/* OTP Info */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'email-otp' ? (
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-gray-600">Enter the 6-digit code sent to</p>
                  <p className="font-semibold text-gray-900">
                    {activeTab === 'email-otp' ? email : countryCode + mobileNumber}
                  </p>
                </div>

                <form onSubmit={handleOTPSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                      Enter 6-digit code
                    </label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Sign In'}
                  </button>
                </form>

                {/* Timer and Resend */}
                <div className="text-center text-sm text-gray-600">
                  {timeLeft > 0 ? (
                    <p>Resend code in {formatTime(timeLeft)}</p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Signup Link */}
          {!showOTPStep && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
