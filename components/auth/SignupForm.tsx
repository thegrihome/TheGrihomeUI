import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setLoading, setError, setSignupStep, setUser } from '@/store/slices/authSlice'
import { authService, SignupData } from '@/services/authService'
import CountryCodeDropdown from '@/components/CountryCodeDropdown'

interface SignupFormProps {
  onClose: () => void
  isAgent?: boolean
}

export default function SignupForm({ onClose, isAgent = false }: SignupFormProps) {
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)

  const [formData, setFormData] = useState<SignupData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
  })

  const [countryCode, setCountryCode] = useState('+91') // Default to India
  const [mobileNumber, setMobileNumber] = useState('')

  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Partial<SignupData & { confirmPassword: string }>>(
    {}
  )

  const validateForm = (): boolean => {
    const errors: Partial<SignupData & { confirmPassword: string }> = {}

    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.username.trim()) errors.username = 'Username is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid'
    if (!mobileNumber.trim()) errors.mobile = 'Mobile number is required'
    else if (!/^\d{7,15}$/.test(mobileNumber.replace(/\s/g, '')))
      errors.mobile = 'Please enter a valid mobile number'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6)
      errors.password = 'Password must be at least 6 characters'
    if (formData.password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Send email OTP
      await authService.sendEmailOTP(formData.email)
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Signup failed'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto my-auto shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isAgent ? 'Sign Up as Agent' : 'Sign Up'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
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

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                formErrors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John"
            />
            {formErrors.firstName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                formErrors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Doe"
            />
            {formErrors.lastName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Username *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              formErrors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="johndoe"
          />
          {formErrors.username && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.username}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="john@example.com"
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="mobile"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Mobile Number *
          </label>
          <div className="flex space-x-2">
            <div className="w-36">
              <CountryCodeDropdown
                value={countryCode}
                onChange={setCountryCode}
                className={formErrors.mobile ? 'border-red-500' : ''}
              />
            </div>
            <div className="flex-1">
              <input
                type="tel"
                id="mobile"
                value={mobileNumber}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '') // Only allow digits
                  setMobileNumber(value)
                  // Clear error when user starts typing
                  if (formErrors.mobile) {
                    setFormErrors(prev => ({ ...prev, mobile: undefined }))
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1234567890"
                maxLength={15}
              />
            </div>
          </div>
          {formErrors.mobile && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.mobile}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              formErrors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••"
          />
          {formErrors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                setFormErrors(prev => ({ ...prev, confirmPassword: undefined }))
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••"
          />
          {formErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {formErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}
