import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CountryCodeDropdown from '@/components/auth/CountryCodeDropdown'
import toast from 'react-hot-toast'

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    isAgent: false,
    companyName: '',
  })
  const [countryCode, setCountryCode] = useState('+1')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    email: '',
    mobileNumber: '',
  })
  const [checkingUnique, setCheckingUnique] = useState({
    username: false,
    email: false,
    mobileNumber: false,
  })
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  // Debounced uniqueness check for username
  useEffect(() => {
    const checkUniqueness = async () => {
      if (!formData.username.trim()) {
        setValidationErrors(prev => ({ ...prev, username: '' }))
        return
      }

      setCheckingUnique(prev => ({ ...prev, username: true }))

      try {
        const response = await fetch('/api/auth/check-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'username', value: formData.username }),
        })

        const data = await response.json()

        if (response.ok && !data.isUnique) {
          setValidationErrors(prev => ({ ...prev, username: 'Username is already taken' }))
        } else {
          setValidationErrors(prev => ({ ...prev, username: '' }))
        }
      } catch (error) {
        // Silently fail for network errors
      } finally {
        setCheckingUnique(prev => ({ ...prev, username: false }))
      }
    }

    const timer = setTimeout(() => {
      if (formData.username) {
        checkUniqueness()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.username])

  // Debounced uniqueness check for email
  useEffect(() => {
    const checkUniqueness = async () => {
      if (!formData.email.trim()) {
        setValidationErrors(prev => ({ ...prev, email: '' }))
        return
      }

      setCheckingUnique(prev => ({ ...prev, email: true }))

      try {
        const response = await fetch('/api/auth/check-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'email', value: formData.email }),
        })

        const data = await response.json()

        if (!response.ok) {
          // Handle validation errors (400) or other errors
          setValidationErrors(prev => ({
            ...prev,
            email: data.message || 'Invalid email',
          }))
        } else if (!data.isUnique) {
          setValidationErrors(prev => ({
            ...prev,
            email: 'Email is already registered',
          }))
        } else {
          setValidationErrors(prev => ({ ...prev, email: '' }))
        }
      } catch (error) {
        // Silently fail for network errors
      } finally {
        setCheckingUnique(prev => ({ ...prev, email: false }))
      }
    }

    const timer = setTimeout(() => {
      if (formData.email) {
        checkUniqueness()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.email])

  // Debounced uniqueness check for mobile
  useEffect(() => {
    const checkUniqueness = async () => {
      if (!formData.mobileNumber.trim()) {
        setValidationErrors(prev => ({ ...prev, mobileNumber: '' }))
        return
      }

      setCheckingUnique(prev => ({ ...prev, mobileNumber: true }))

      try {
        const response = await fetch('/api/auth/check-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'mobile',
            value: `${countryCode}${formData.mobileNumber}`,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          // Handle validation errors (400) or other errors
          setValidationErrors(prev => ({
            ...prev,
            mobileNumber: data.message || 'Invalid mobile number',
          }))
        } else if (!data.isUnique) {
          setValidationErrors(prev => ({
            ...prev,
            mobileNumber: 'Mobile number is already registered',
          }))
        } else {
          setValidationErrors(prev => ({ ...prev, mobileNumber: '' }))
        }
      } catch (error) {
        // Silently fail for network errors
      } finally {
        setCheckingUnique(prev => ({ ...prev, mobileNumber: false }))
      }
    }

    const timer = setTimeout(() => {
      if (formData.mobileNumber) {
        checkUniqueness()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.mobileNumber, countryCode])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for validation errors
    if (validationErrors.username || validationErrors.email || validationErrors.mobileNumber) {
      toast.error('Please fix all validation errors before submitting')
      return
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long')
      return
    }

    if (formData.isAgent && !formData.companyName.trim()) {
      toast.error('Company name is required for agents')
      return
    }

    setLoading(true)

    try {
      // Create user
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          mobileNumber: `${countryCode}${formData.mobileNumber}`,
          password: formData.password,
          isAgent: formData.isAgent,
          companyName: formData.companyName,
          imageLink: avatarPreview || null,
        }),
      })

      if (response.ok) {
        toast.success('Account created successfully!')

        // Auto-login the user with their credentials
        const result = await signIn('credentials', {
          identifier: formData.username,
          password: formData.password,
          loginType: 'password',
          redirect: false,
        })

        if (result?.ok) {
          // Redirect to home screen
          router.push('/')
        } else {
          // Fallback to login page if auto-login fails
          toast.error('Please login with your credentials')
          router.push('/auth/login')
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Signup failed')
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (JPG, PNG, or GIF)')
        e.target.value = '' // Clear the input
        return
      }

      // Validate file size (max 1MB)
      // When converted to base64, it becomes ~1.33MB, well within server limit
      const maxSize = 1 * 1024 * 1024 // 1MB in bytes
      if (file.size > maxSize) {
        toast.error('Image size must be less than 1MB')
        e.target.value = '' // Clear the input
        return
      }

      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Check if form is valid and all required fields are filled
  const isFormValid = () => {
    // Check if any field is being validated
    if (checkingUnique.username || checkingUnique.email || checkingUnique.mobileNumber) {
      return false
    }

    // Check if there are any validation errors
    if (validationErrors.username || validationErrors.email || validationErrors.mobileNumber) {
      return false
    }

    // Check required fields
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.mobileNumber.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      return false
    }

    // Check username length
    if (formData.username.length < 3) {
      return false
    }

    // Check password length
    if (formData.password.length < 6) {
      return false
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      return false
    }

    // Check agent-specific field
    if (formData.isAgent && !formData.companyName.trim()) {
      return false
    }

    return true
  }

  return (
    <div className="signup-container">
      <Header />
      <main className="signup-main">
        <div className="signup-content">
          <form onSubmit={handleSubmit} className="signup-form">
            <h1 className="signup-form__title">Create Account</h1>
            <p className="signup-form__subtitle">Join Grihome to start your property journey</p>

            {/* Name Fields */}
            <div className="signup-form__row">
              <div className="signup-form__field">
                <label className="signup-form__label">
                  First Name <span className="signup-form__required">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="signup-form__input"
                  required
                />
              </div>

              <div className="signup-form__field">
                <label className="signup-form__label">
                  Last Name <span className="signup-form__required">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="signup-form__input"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="signup-form__field">
              <label className="signup-form__label">
                Username <span className="signup-form__required">*</span>
                {checkingUnique.username && (
                  <span className="signup-form__checking"> (checking...)</span>
                )}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`signup-form__input ${validationErrors.username ? 'signup-form__input--error' : ''}`}
                placeholder="Choose a unique username"
                required
                minLength={3}
              />
              {validationErrors.username && (
                <span className="signup-form__error">{validationErrors.username}</span>
              )}
            </div>

            {/* Email */}
            <div className="signup-form__field">
              <label className="signup-form__label">
                Email Address <span className="signup-form__required">*</span>
                {checkingUnique.email && (
                  <span className="signup-form__checking"> (checking...)</span>
                )}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`signup-form__input ${validationErrors.email ? 'signup-form__input--error' : ''}`}
                placeholder="you@example.com"
                required
              />
              {validationErrors.email && (
                <span className="signup-form__error">{validationErrors.email}</span>
              )}
            </div>

            {/* Mobile Number */}
            <div className="signup-form__field">
              <label className="signup-form__label">
                Mobile Number <span className="signup-form__required">*</span>
                {checkingUnique.mobileNumber && (
                  <span className="signup-form__checking"> (checking...)</span>
                )}
              </label>
              <div className="signup-form__phone-group">
                <CountryCodeDropdown value={countryCode} onChange={setCountryCode} />
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className={`signup-form__phone-input ${validationErrors.mobileNumber ? 'signup-form__phone-input--error' : ''}`}
                  placeholder="1234567890"
                  required
                />
              </div>
              {validationErrors.mobileNumber && (
                <span className="signup-form__error">{validationErrors.mobileNumber}</span>
              )}
            </div>

            {/* Password Fields */}
            <div className="signup-form__row">
              <div className="signup-form__field">
                <label className="signup-form__label">
                  Password <span className="signup-form__required">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="signup-form__input"
                  required
                  minLength={6}
                />
              </div>

              <div className="signup-form__field">
                <label className="signup-form__label">
                  Confirm Password <span className="signup-form__required">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="signup-form__input"
                  required
                />
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="signup-form__avatar-upload-box">
              <div className="signup-form__avatar-upload-header">
                <span className="signup-form__avatar-upload-title">Profile Picture (Optional)</span>
              </div>
              <div className="signup-form__avatar-upload-content">
                {avatarPreview ? (
                  <div className="signup-form__avatar-preview-container">
                    <Image src={avatarPreview} alt="Avatar preview" width={80} height={80} />
                    <label htmlFor="avatar-input" className="signup-form__avatar-change-link">
                      Click here
                    </label>
                    <span className="signup-form__avatar-upload-info"> to change photo</span>
                  </div>
                ) : (
                  <div className="signup-form__avatar-upload-text">
                    <label htmlFor="avatar-input" className="signup-form__avatar-upload-link">
                      Click here
                    </label>
                    <span className="signup-form__avatar-upload-info">
                      {' '}
                      to upload an image (JPG, PNG, GIF - max 1MB)
                    </span>
                  </div>
                )}
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleAvatarChange}
                  className="signup-form__file-input"
                />
              </div>
            </div>

            {/* Agent Checkbox */}
            <div className="signup-form__field">
              <label className="signup-form__checkbox-label">
                <input
                  type="checkbox"
                  name="isAgent"
                  checked={formData.isAgent}
                  onChange={handleChange}
                  className="signup-form__checkbox"
                />
                I am a real estate agent
              </label>
            </div>

            {/* Company Name (for agents) */}
            {formData.isAgent && (
              <div className="signup-form__field">
                <label className="signup-form__label">
                  Company Name <span className="signup-form__required">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="signup-form__input"
                  placeholder="Your company name"
                  required={formData.isAgent}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="signup-form__submit"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <p className="signup-form__footer">
              Already have an account?{' '}
              <Link href="/auth/login" className="signup-form__link">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
