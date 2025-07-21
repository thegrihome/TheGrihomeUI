import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import validator from 'validator'
import CountryCodeDropdown from '@/components/CountryCodeDropdown'

interface SignupData {
  firstName: string
  lastName: string
  username: string
  email: string
  mobileNumber: string
  password: string
  isAgent: boolean
  companyName: string
  imageLink?: string
}

export default function SignupPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState<SignupData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobileNumber: '',
    password: '',
    isAgent: false,
    companyName: '',
    imageLink: '',
  })

  const [countryCode, setCountryCode] = useState('+91')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState<Partial<SignupData & { confirmPassword: string }>>(
    {}
  )
  const [checkingUnique, setCheckingUnique] = useState<{
    username: boolean
    email: boolean
    mobile: boolean
  }>({
    username: false,
    email: false,
    mobile: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Validation helper functions
  const isValidEmail = (email: string): boolean => {
    return validator.isEmail(email.trim())
  }

  const isValidMobile = (mobile: string): boolean => {
    // Remove all non-digit characters
    const cleanedMobile = mobile.replace(/\D/g, '')
    // Check if it's a valid mobile number (7-15 digits)
    if (cleanedMobile.length < 7 || cleanedMobile.length > 15) {
      return false
    }

    // Only reject completely invalid patterns (all zeros)
    if (/^0+$/.test(cleanedMobile)) {
      return false
    }

    // Basic mobile number validation - ensure it looks like a reasonable mobile number
    // Don't be too strict as different countries have different formats
    return /^[1-9]\d*$/.test(cleanedMobile)
  }

  // Debounced uniqueness check with validation
  useEffect(() => {
    const checkUniqueness = async (field: 'username' | 'email' | 'mobile', value: string) => {
      if (!value.trim()) return

      // Pre-validate before making database call
      if (field === 'email' && !isValidEmail(value)) {
        // Show invalid email error
        setFormErrors(prev => ({
          ...prev,
          email: 'Invalid email address entered',
        }))
        return
      }

      if (field === 'mobile' && !isValidMobile(value)) {
        // Show invalid mobile error
        setFormErrors(prev => ({
          ...prev,
          mobileNumber: 'Invalid mobile number entered',
        }))
        return
      }

      // Clear any format errors since validation passed
      setFormErrors(prev => {
        const newErrors = { ...prev }
        const fieldKey = field === 'mobile' ? 'mobileNumber' : field
        if (
          newErrors[fieldKey] &&
          (newErrors[fieldKey].includes('Invalid email') ||
            newErrors[fieldKey].includes('Invalid mobile'))
        ) {
          delete newErrors[fieldKey]
        }
        return newErrors
      })

      setCheckingUnique(prev => ({ ...prev, [field]: true }))

      try {
        const checkValue = field === 'mobile' ? countryCode + value : value

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Frontend uniqueness check:', { field, value, checkValue })
        }

        const response = await fetch('/api/auth/check-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field, value: checkValue }),
        })

        const data = await response.json()

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Frontend uniqueness response:', data)
        }

        if (!data.isUnique) {
          setFormErrors(prev => ({
            ...prev,
            [field === 'mobile' ? 'mobileNumber' : field]:
              `${field === 'mobile' ? 'Mobile number' : field.charAt(0).toUpperCase() + field.slice(1)} is already registered`,
          }))
        } else {
          setFormErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[
              field === 'mobile' ? 'mobileNumber' : (field as keyof typeof newErrors)
            ]
            return newErrors
          })
        }
      } catch (error) {
        // Silently fail - don't show error for network issues during typing
      } finally {
        setCheckingUnique(prev => ({ ...prev, [field]: false }))
      }
    }

    const timeouts: NodeJS.Timeout[] = []

    // Check username after 500ms delay
    if (formData.username.length >= 3) {
      timeouts.push(setTimeout(() => checkUniqueness('username', formData.username), 500))
    } else if (formData.username.length > 0 && formData.username.length < 3) {
      // Clear errors if username is too short (will show validation error instead)
      setFormErrors(prev => {
        const newErrors = { ...prev }
        if (newErrors.username && newErrors.username.includes('already registered')) {
          delete newErrors.username
        }
        return newErrors
      })
    }

    // Check email after 500ms delay - only if valid format
    if (isValidEmail(formData.email)) {
      // Clear any format errors since email is now valid
      setFormErrors(prev => {
        const newErrors = { ...prev }
        if (newErrors.email && newErrors.email.includes('Invalid email')) {
          delete newErrors.email
        }
        return newErrors
      })
      timeouts.push(setTimeout(() => checkUniqueness('email', formData.email), 500))
    } else if (formData.email.length > 0) {
      // Show invalid email error immediately
      setFormErrors(prev => ({
        ...prev,
        email: 'Invalid email address entered',
      }))
    }

    // Check mobile after 500ms delay - only if valid format
    if (isValidMobile(formData.mobileNumber)) {
      // Clear any format errors since mobile is now valid
      setFormErrors(prev => {
        const newErrors = { ...prev }
        if (newErrors.mobileNumber && newErrors.mobileNumber.includes('Invalid mobile')) {
          delete newErrors.mobileNumber
        }
        return newErrors
      })
      timeouts.push(setTimeout(() => checkUniqueness('mobile', formData.mobileNumber), 500))
    } else if (formData.mobileNumber.length > 0) {
      // Show invalid mobile error immediately
      setFormErrors(prev => ({
        ...prev,
        mobileNumber: 'Invalid mobile number entered',
      }))
    }

    return () => timeouts.forEach(clearTimeout)
  }, [formData.username, formData.email, formData.mobileNumber, countryCode])

  const validateForm = (): boolean => {
    const errors: Partial<SignupData & { confirmPassword: string }> = {}

    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'

    if (formData.isAgent && !formData.companyName.trim())
      errors.companyName = 'Company name is required for agents'

    if (!formData.username.trim()) errors.username = 'Username is required'
    else if (formData.username.length < 3)
      errors.username = 'Username must be at least 3 characters'

    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!isValidEmail(formData.email)) errors.email = 'Please enter a valid email address'

    if (!formData.mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required'
    else if (!isValidMobile(formData.mobileNumber))
      errors.mobileNumber = 'Please enter a valid mobile number (7-15 digits)'

    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6)
      errors.password = 'Password must be at least 6 characters'

    if (formData.password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }

      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const uploadImageToCDN = async (file: File): Promise<string> => {
    // This is a placeholder for CDN upload
    // In real implementation, you would upload to Cloudflare R2, AWS S3, etc.
    // For now, we'll simulate it
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate API call to upload service
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Return a mock CDN URL
      return `https://cdn.grihome.com/logos/${Date.now()}-${file.name}`
    } catch (error) {
      throw new Error('Failed to upload image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      let imageUrl = ''

      // Upload image if agent and file selected
      if (formData.isAgent && imageFile) {
        imageUrl = await uploadImageToCDN(imageFile)
      }

      const signupData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        mobileNumber: countryCode + formData.mobileNumber,
        password: formData.password,
        isAgent: formData.isAgent,
        companyName: formData.companyName,
        imageLink: imageUrl,
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      // Redirect to login or dashboard
      router.push('/login?message=Account created successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear specific error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof typeof formErrors]
        return newErrors
      })
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-2 text-sm text-gray-600">Join GRIHOME today</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Agent Checkbox */}
              <div className="flex items-center">
                <input
                  id="isAgent"
                  name="isAgent"
                  type="checkbox"
                  checked={formData.isAgent}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isAgent" className="ml-2 block text-sm text-gray-900">
                  Do you want to signup as an agent?
                </label>
              </div>

              {/* Company Name (shown only if agent is checked) */}
              {formData.isAgent && (
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.companyName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="ACME Real Estate"
                  />
                  {formErrors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.companyName}</p>
                  )}
                </div>
              )}

              {/* First Name and Last Name */}
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

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <div className="relative">
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
                  {checkingUnique.username && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="relative">
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
                  {checkingUnique.email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                  Mobile Number *
                </label>
                <div className="mt-1 flex space-x-2">
                  <div className="w-36">
                    <CountryCodeDropdown
                      value={countryCode}
                      onChange={setCountryCode}
                      className={formErrors.mobileNumber ? 'border-red-300' : ''}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      id="mobile"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '')
                        setFormData(prev => ({ ...prev, mobileNumber: value }))
                        if (formErrors.mobileNumber) {
                          setFormErrors(prev => {
                            const { mobileNumber, ...rest } = prev
                            return rest
                          })
                        }
                      }}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.mobileNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="1234567890"
                      maxLength={15}
                    />
                    {checkingUnique.mobile && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
                {formErrors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.mobileNumber}</p>
                )}
              </div>

              {/* Password */}
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

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={e => {
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

              {/* Profile Image Upload */}
              <div className="border-t pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.isAgent ? 'Company Logo (Optional)' : 'Profile Picture (Optional)'}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    {formData.isAgent
                      ? 'Click to upload an image of your company logo'
                      : 'Click to upload an image of your company logo or avatar'}
                  </p>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="relative mx-auto h-32 w-32">
                          <Image
                            src={imagePreview}
                            alt="Logo preview"
                            fill
                            className="object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null)
                              setImagePreview('')
                            }}
                            className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  Object.keys(formErrors).length > 0 ||
                  checkingUnique.username ||
                  checkingUnique.email ||
                  checkingUnique.mobile
                }
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
