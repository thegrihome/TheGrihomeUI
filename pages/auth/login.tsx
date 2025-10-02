import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CountryCodeDropdown from '@/components/auth/CountryCodeDropdown'
import toast from 'react-hot-toast'

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
  const router = useRouter()

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
      // In production, this would send actual OTP
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500))
      setOtpSent(true)
      toast.success('OTP sent! Use 123456 for testing')
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const identifier = loginMethod === 'email' ? email : `${countryCode}${mobileNumber}`

      const result = await signIn('credentials', {
        identifier,
        otp,
        loginType: 'otp',
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid OTP or user not found')
      } else {
        toast.success('Login successful!')
        router.push('/auth/userinfo')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier: username,
        password: password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid credentials')
      } else {
        toast.success('Login successful!')
        router.push('/auth/userinfo')
      }
    } catch (error) {
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
  }

  const handleMethodChange = (method: LoginMethod) => {
    setLoginMethod(method)
    resetForm()
  }

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

  return (
    <div className="login-container">
      <Header />
      <main className="login-main">
        <div className="login-content">
          <div className="login-card">
            <h1 className="login-title">Sign In</h1>
            <p className="login-subtitle">Welcome back to Grihome</p>

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
              <form onSubmit={handleOTPLogin} className="login-form">
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
                      disabled={loading || !userExists || checkingUser}
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
                        onChange={e => setOtp(e.target.value)}
                        className="login-form__input"
                        placeholder="123456"
                        required
                        maxLength={6}
                      />
                      <p className="login-form__hint">Default OTP: 123456</p>
                    </div>
                    <button type="submit" disabled={loading} className="login-form__submit">
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="login-form__back"
                      disabled={loading}
                    >
                      Back
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Mobile OTP Form */}
            {loginMethod === 'mobile' && (
              <form onSubmit={handleOTPLogin} className="login-form">
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
                      disabled={loading || !userExists || checkingUser}
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
                        onChange={e => setOtp(e.target.value)}
                        className="login-form__input"
                        placeholder="123456"
                        required
                        maxLength={6}
                      />
                      <p className="login-form__hint">Default OTP: 123456</p>
                    </div>
                    <button type="submit" disabled={loading} className="login-form__submit">
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="login-form__back"
                      disabled={loading}
                    >
                      Back
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Username & Password Form */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="login-form">
                <div className="login-form__field">
                  <label className="login-form__label">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="login-form__input"
                    placeholder="Your username"
                    required
                  />
                </div>
                <div className="login-form__field">
                  <label className="login-form__label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="login-form__input"
                    placeholder="Your password"
                    required
                  />
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
