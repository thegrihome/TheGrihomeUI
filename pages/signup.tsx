import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { RootState } from '@/store/store'
import { resetSignupForm, setLoading, setError, setSignupStep, setUser, verifyEmail, verifyMobile } from '@/store/slices/authSlice'
import { authService, SignupData } from '@/services/authService'
import CountryCodeDropdown from '@/components/CountryCodeDropdown'

export default function SignupPage() {
  const [activeTab, setActiveTab] = useState<'user' | 'agent'>('user')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { signupStep, isAuthenticated, user, isLoading, error } = useSelector((state: RootState) => state.auth)

  // Form state
  const [formData, setFormData] = useState<SignupData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
  })
  
  const [countryCode, setCountryCode] = useState('+91')
  const [mobileNumber, setMobileNumber] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Partial<SignupData & { confirmPassword: string }>>({})

  // OTP state
  const [otp, setOtp] = useState('')
  const [timeLeft, setTimeLeft] = useState(300)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    setMounted(true)
    const { type } = router.query
    if (type === 'agent') {
      setActiveTab('agent')
    }
  }, [router.query])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // OTP timer
  useEffect(() => {
    if ((signupStep === 'email-otp' || signupStep === 'mobile-otp') && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setCanResend(true)
    }
  }, [timeLeft, signupStep])

  const handleClose = () => {
    dispatch(resetSignupForm())
    router.push('/')
  }

  useEffect(() => {
    return () => {
      if (!isAuthenticated) {
        dispatch(resetSignupForm())
      }
    }
  }, [dispatch, isAuthenticated])

  const validateForm = (): boolean => {
    const errors: Partial<SignupData & { confirmPassword: string }> = {}
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.username.trim()) errors.username = 'Username is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid'
    if (!mobileNumber.trim()) errors.mobile = 'Mobile number is required'
    else if (!/^\d{7,15}$/.test(mobileNumber.replace(/\s/g, ''))) errors.mobile = 'Please enter a valid mobile number'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (formData.password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    dispatch(setLoading(true))
    dispatch(setError(null))
    
    try {
      const fullMobile = countryCode + mobileNumber
      const signupData = { ...formData, mobile: fullMobile }
      
      const { user } = await authService.signup(signupData)
      dispatch(setUser(user))
      dispatch(setSignupStep('email-otp'))
      setTimeLeft(300)
      setCanResend(false)
      
      await authService.sendEmailOTP(formData.email)
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Signup failed'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || !user) return
    
    dispatch(setLoading(true))
    dispatch(setError(null))
    
    try {
      if (signupStep === 'email-otp') {
        const isValid = await authService.verifyEmailOTP({ email: user.email, otp })
        if (isValid) {
          dispatch(verifyEmail())
          dispatch(setSignupStep('mobile-otp'))
          setOtp('')
          setTimeLeft(300)
          setCanResend(false)
          await authService.sendMobileOTP(user.mobile)
        }
      } else if (signupStep === 'mobile-otp') {
        const isValid = await authService.verifyMobileOTP({ mobile: user.mobile, otp })
        if (isValid) {
          dispatch(verifyMobile())
          dispatch(setSignupStep('completed'))
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'OTP verification failed'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleResendOTP = async () => {
    if (!user || !canResend) return
    
    dispatch(setLoading(true))
    dispatch(setError(null))
    
    try {
      if (signupStep === 'email-otp') {
        await authService.sendEmailOTP(user.email)
      } else {
        await authService.sendMobileOTP(user.mobile)
      }
      setTimeLeft(300)
      setCanResend(false)
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to resend OTP'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof typeof formErrors]
        return newErrors
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
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
              {signupStep === 'form' 
                ? (activeTab === 'agent' ? 'Sign up as Agent' : 'Create your account')
                : signupStep === 'email-otp' 
                ? 'Verify your email' 
                : signupStep === 'mobile-otp'
                ? 'Verify your mobile'
                : 'Welcome to GRIHOME!'
              }
            </h1>
            {signupStep === 'form' && (
              <p className="mt-2 text-sm text-gray-600">
                {activeTab === 'agent' 
                  ? 'Join as a real estate agent'
                  : 'Join GRIHOME today'
                }
              </p>
            )}
          </div>

          {/* Tab Navigation */}
          {signupStep === 'form' && (
            <div className="mb-8">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setActiveTab('user')
                    router.push('/signup', undefined, { shallow: true })
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'user'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign up
                </button>
                <button
                  onClick={() => {
                    setActiveTab('agent')
                    router.push('/signup?type=agent', undefined, { shallow: true })
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'agent'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign up as Agent
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
            {signupStep === 'form' && (
              <form onSubmit={handleSignupSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                    Mobile Number *
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
                        onChange={(e) => {
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

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (formErrors.confirmPassword) {
                        setFormErrors(prev => {
                          const { confirmPassword, ...rest } = prev
                          return rest
                        })
                      }
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {(signupStep === 'email-otp' || signupStep === 'mobile-otp') && (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={() => {
                    if (signupStep === 'email-otp') {
                      dispatch(setSignupStep('form'))
                    } else {
                      dispatch(setSignupStep('email-otp'))
                    }
                  }}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                {/* OTP Info */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {signupStep === 'email-otp' ? (
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-gray-600">
                    We've sent a verification code to
                  </p>
                  <p className="font-semibold text-gray-900">
                    {signupStep === 'email-otp' ? user?.email : user?.mobile}
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
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                    {isLoading ? 'Verifying...' : 'Verify Code'}
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

            {signupStep === 'completed' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Account created successfully!</h3>
                <p className="text-gray-600">Redirecting to home page...</p>
              </div>
            )}
          </div>

          {/* Login Link */}
          {signupStep === 'form' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}