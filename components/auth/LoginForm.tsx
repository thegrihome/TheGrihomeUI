import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setLoading, setError, setUser, setLoginMethod } from '@/store/slices/authSlice'
import { authService } from '@/services/authService'
import CountryCodeDropdown from '@/components/CountryCodeDropdown'

interface LoginFormProps {
  onClose: () => void
}

export default function LoginForm({ onClose }: LoginFormProps) {
  const dispatch = useDispatch()
  const { isLoading, error, loginMethod } = useSelector((state: RootState) => state.auth)
  
  const [activeTab, setActiveTab] = useState<'email-password' | 'email-otp' | 'mobile-otp'>('mobile-otp')
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    password: '',
    otp: '',
  })
  const [countryCode, setCountryCode] = useState('+91') // Default to India
  const [mobileNumber, setMobileNumber] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const handleTabChange = (tab: 'email-password' | 'email-otp' | 'mobile-otp') => {
    setActiveTab(tab)
    setFormData({ email: '', mobile: '', password: '', otp: '' })
    setMobileNumber('')
    setOtpSent(false)
    setTimeLeft(0)
    dispatch(setError(null))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSendOTP = async (type: 'email' | 'mobile') => {
    const contact = type === 'email' ? formData.email : countryCode + mobileNumber
    
    if (!contact || (type === 'mobile' && !mobileNumber)) {
      dispatch(setError(`Please enter your ${type === 'mobile' ? 'mobile number' : type}`))
      return
    }
    
    dispatch(setLoading(true))
    dispatch(setError(null))
    
    try {
      if (type === 'email') {
        await authService.sendEmailOTP(contact)
      } else {
        await authService.sendMobileOTP(contact)
      }
      setOtpSent(true)
      setTimeLeft(300) // 5 minutes
      
      // Start countdown
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to send OTP'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    dispatch(setLoading(true))
    dispatch(setError(null))
    dispatch(setLoginMethod(activeTab))
    
    try {
      let user
      
      if (activeTab === 'email-password') {
        if (!formData.email || !formData.password) {
          dispatch(setError('Please enter email and password'))
          return
        }
        user = await authService.loginWithEmailPassword({
          email: formData.email,
          password: formData.password
        })
      } else if (activeTab === 'email-otp') {
        if (!formData.email || !formData.otp) {
          dispatch(setError('Please enter email and OTP'))
          return
        }
        user = await authService.loginWithEmailOTP({
          email: formData.email,
          otp: formData.otp
        })
      } else if (activeTab === 'mobile-otp') {
        if (!formData.mobile || !formData.otp) {
          dispatch(setError('Please enter mobile number and OTP'))
          return
        }
        user = await authService.loginWithMobileOTP({
          mobile: formData.mobile,
          otp: formData.otp
        })
      }
      
      if (user) {
        dispatch(setUser(user))
        onClose()
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Login failed'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto my-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
          <button
            onClick={() => handleTabChange('mobile-otp')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'mobile-otp'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Mobile OTP
          </button>
          <button
            onClick={() => handleTabChange('email-otp')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'email-otp'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Email OTP
          </button>
          <button
            onClick={() => handleTabChange('email-password')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'email-password'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Email & Password
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'email-password' && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="••••••"
                />
              </div>
            </>
          )}

          {activeTab === 'email-otp' && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="john@example.com"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendOTP('email')}
                    disabled={isLoading || (otpSent && timeLeft > 0)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    {otpSent && timeLeft > 0 ? formatTime(timeLeft) : 'Send OTP'}
                  </button>
                </div>
              </div>
              {otpSent && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center text-lg tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'mobile-otp' && (
            <>
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="w-36">
                    <CountryCodeDropdown
                      value={countryCode}
                      onChange={setCountryCode}
                    />
                  </div>
                  <input
                    type="tel"
                    id="mobile"
                    value={mobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '') // Only allow digits
                      setMobileNumber(value)
                    }}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    placeholder="1234567890"
                    maxLength={15}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendOTP('mobile')}
                    disabled={isLoading || (otpSent && timeLeft > 0)}
                    className="px-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                  >
                    {otpSent && timeLeft > 0 ? formatTime(timeLeft) : 'Send OTP'}
                  </button>
                </div>
              </div>
              {otpSent && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center text-lg tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>For OTP login, use: <span className="font-mono font-bold">123456</span></p>
          <p>For email/password, use any email and password</p>
        </div>
    </div>
  )
}