import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CountryCodeDropdown from '@/components/auth/CountryCodeDropdown'
import toast from 'react-hot-toast'
import {
  sendOTP as sendMSG91OTP,
  verifyOTP as verifyMSG91OTP,
  formatPhoneForMSG91,
  initializeMSG91Widget,
  FALLBACK_OTP,
} from '@/lib/msg91'

type LoginMethod = 'email' | 'mobile' | 'password'

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [widgetReady, setWidgetReady] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  // Initialize MSG91 widget on mount
  useEffect(() => {
    const init = async () => {
      const ready = await initializeMSG91Widget()
      setWidgetReady(ready)
    }
    init()
  }, [])

  // Check if email exists in database
  useEffect(() => {
    const checkEmail = async () => {
      if (!email.trim()) {
        setUserExists(false)
        setValidationError('')
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setUserExists(false)
        setValidationError('Invalid email format')
        return
      }

      setCheckingUser(true)
      setValidationError('')

      try {
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'email', value: email }),
        })

        const data = await response.json()

        if (response.ok && data.exists) {
          setUserExists(true)
          setValidationError('')
        } else {
          setUserExists(false)
          setValidationError(data.message || 'Email not registered. Please sign up first.')
        }
      } catch (error) {
        setUserExists(false)
        setValidationError('')
      } finally {
        setCheckingUser(false)
      }
    }

    const timer = setTimeout(() => {
      if (email && loginMethod === 'email') {
        checkEmail()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [email, loginMethod])

  // Check if mobile exists in database
  useEffect(() => {
    const checkMobile = async () => {
      if (!mobileNumber.trim()) {
        setUserExists(false)
        setValidationError('')
        return
      }

      setCheckingUser(true)
      setValidationError('')

      try {
        const fullMobile = `${countryCode}${mobileNumber}`
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'mobile', value: fullMobile }),
        })

        const data = await response.json()

        if (response.ok && data.exists) {
          setUserExists(true)
          setValidationError('')
        } else {
          setUserExists(false)
          setValidationError(data.message || 'Mobile number not registered. Please sign up first.')
        }
      } catch (error) {
        setUserExists(false)
        setValidationError('')
      } finally {
        setCheckingUser(false)
      }
    }

    const timer = setTimeout(() => {
      if (mobileNumber && loginMethod === 'mobile') {
        checkMobile()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [mobileNumber, countryCode, loginMethod])

  // Show loading while checking authentication
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleSendOTP = async () => {
    if (loginMethod === 'email' && !email) {
      toast.error('Please enter your email address')
      return
    }
    if (loginMethod === 'mobile' && !mobileNumber) {
      toast.error('Please enter your mobile number')
      return
    }

    setLoading(true)
    try {
      // Format identifier for MSG91
      const identifier =
        loginMethod === 'email'
          ? email
          : formatPhoneForMSG91(mobileNumber, countryCode.replace('+', ''))

      // Send OTP via MSG91 widget
      const result = await sendMSG91OTP(identifier)

      if (result.success) {
        setOtpSent(true)
        toast.success('OTP sent!')
      } else {
        toast.error(result.message || 'Failed to send OTP')
      }
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    // Just call handleSendOTP again
    await handleSendOTP()
  }

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOtpError('')

    try {
      const identifier = loginMethod === 'email' ? email : `${countryCode}${mobileNumber}`

      // Check for fallback OTP first
      if (otp === FALLBACK_OTP) {
        // Fallback OTP - go directly to NextAuth
        const result = await signIn('credentials', {
          identifier,
          otp,
          loginType: 'otp',
          redirect: false,
        })

        if (result?.error) {
          const errorMsg = 'Login failed. User not found.'
          setOtpError(errorMsg)
          toast.error(errorMsg)
        } else {
          toast.success('Login successful!')
          router.push('/')
        }
        setLoading(false)
        return
      }

      // Verify OTP with MSG91 widget - returns JWT token
      const verifyResult = await verifyMSG91OTP(otp)

      if (!verifyResult.success) {
        const errorMsg = verifyResult.message || 'Invalid OTP'
        setOtpError(errorMsg)
        toast.error(errorMsg)
        setLoading(false)
        return
      }

      // Now authenticate with NextAuth using the verified token
      const result = await signIn('credentials', {
        identifier,
        otp,
        msg91Token: verifyResult.token,
        loginType: 'otp',
        redirect: false,
      })

      if (result?.error) {
        const errorMsg = 'Login failed. User not found.'
        setOtpError(errorMsg)
        toast.error(errorMsg)
      } else {
        toast.success('Login successful!')
        router.push('/')
      }
    } catch {
      const errorMsg = 'Login failed. Please try again.'
      setOtpError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier: username,
        password: password,
        loginType: 'password',
        redirect: false,
      })

      if (result?.error) {
        setPasswordError('Invalid username or password')
        toast.error('Invalid username or password')
      } else {
        toast.success('Login successful!')
        router.push('/')
      }
    } catch (error) {
      setPasswordError('Login failed. Please try again.')
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setOtpSent(false)
    setOtp('')
    setEmail('')
    setMobileNumber('')
    setUsername('')
    setPassword('')
    setUserExists(false)
    setValidationError('')
    setPasswordError('')
    setOtpError('')
  }

  const handleMethodChange = (method: LoginMethod) => {
    setLoginMethod(method)
    resetForm()
  }

  return (
    <div className="login-container">
      <Header />
      <main className="login-main">
        <div className="login-content">
          <div className="login-card">
            <h1 className="login-title">Sign In</h1>
            <p className="login-subtitle">Welcome back to Zillfin</p>

            {/* Login Method Tabs */}
            <div className="login-tabs">
              <button
                type="button"
                onClick={() => handleMethodChange('email')}
                className={`login-tab ${loginMethod === 'email' ? 'login-tab--active' : ''}`}
              >
                Email OTP
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('mobile')}
                className={`login-tab ${loginMethod === 'mobile' ? 'login-tab--active' : ''}`}
              >
                Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('password')}
                className={`login-tab ${loginMethod === 'password' ? 'login-tab--active' : ''}`}
              >
                Username & Password
              </button>
            </div>

            {/* Email OTP Form */}
            {loginMethod === 'email' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (otpSent) {
                    handleOTPLogin(e)
                  }
                }}
                className="login-form"
              >
                {!otpSent ? (
                  <>
                    <div className="login-form__field">
                      <label className="login-form__label">
                        Email Address
                        {checkingUser && (
                          <span className="login-form__checking"> (checking...)</span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={`login-form__input ${validationError ? 'login-form__input--error' : ''}`}
                        placeholder="you@example.com"
                        required
                      />
                      {validationError && (
                        <span className="login-form__error">{validationError}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading || !userExists || checkingUser || !widgetReady}
                      className="login-form__submit"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="login-form__field">
                      <label className="login-form__label">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={e => {
                          setOtp(e.target.value)
                          setOtpError('')
                        }}
                        className={`login-form__input ${otpError ? 'login-form__input--error' : ''}`}
                        placeholder="Enter OTP"
                        required
                        maxLength={10}
                      />
                      {otpError && <span className="login-form__error">{otpError}</span>}
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !otp || otp.length < 6}
                      className="login-form__submit"
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <div className="login-form__actions">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className="login-form__resend"
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="login-form__back"
                        disabled={loading}
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* Mobile OTP Form */}
            {loginMethod === 'mobile' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (otpSent) {
                    handleOTPLogin(e)
                  }
                }}
                className="login-form"
              >
                {!otpSent ? (
                  <>
                    <div className="login-form__field">
                      <label className="login-form__label">
                        Mobile Number
                        {checkingUser && (
                          <span className="login-form__checking"> (checking...)</span>
                        )}
                      </label>
                      <div className="login-form__phone-group">
                        <CountryCodeDropdown value={countryCode} onChange={setCountryCode} />
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={e => setMobileNumber(e.target.value)}
                          className={`login-form__phone-input ${validationError ? 'login-form__phone-input--error' : ''}`}
                          placeholder="1234567890"
                          required
                        />
                      </div>
                      {validationError && (
                        <span className="login-form__error">{validationError}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading || !userExists || checkingUser || !widgetReady}
                      className="login-form__submit"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="login-form__field">
                      <label className="login-form__label">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={e => {
                          setOtp(e.target.value)
                          setOtpError('')
                        }}
                        className={`login-form__input ${otpError ? 'login-form__input--error' : ''}`}
                        placeholder="Enter OTP"
                        required
                        maxLength={10}
                      />
                      {otpError && <span className="login-form__error">{otpError}</span>}
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !otp || otp.length < 6}
                      className="login-form__submit"
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <div className="login-form__actions">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className="login-form__resend"
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="login-form__back"
                        disabled={loading}
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* Username & Password Form */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="login-form">
                <div className="login-form__field">
                  <label className="login-form__label">Username or Email</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value)
                      setPasswordError('')
                    }}
                    className={`login-form__input ${passwordError ? 'login-form__input--error' : ''}`}
                    placeholder="Enter username or email"
                    required
                  />
                </div>
                <div className="login-form__field">
                  <label className="login-form__label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setPasswordError('')
                    }}
                    className={`login-form__input ${passwordError ? 'login-form__input--error' : ''}`}
                    placeholder="Your password"
                    required
                  />
                  {passwordError && <span className="login-form__error">{passwordError}</span>}
                </div>
                <button type="submit" disabled={loading} className="login-form__submit">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Signup Link */}
            <p className="login-footer">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="login-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
