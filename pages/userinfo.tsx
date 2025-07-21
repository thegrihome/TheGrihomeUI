import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { RootState } from '@/store/store'
import { setUser } from '@/store/slices/authSlice'
import Header from '@/components/Header'
import CountryCodeDropdown from '@/components/CountryCodeDropdown'

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function UserInfoPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  // Form states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  // Email verification states
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailTimeLeft, setEmailTimeLeft] = useState(180)
  const [emailCanResend, setEmailCanResend] = useState(false)

  // Mobile verification states
  const [mobileOtp, setMobileOtp] = useState('')
  const [mobileOtpSent, setMobileOtpSent] = useState(false)
  const [mobileTimeLeft, setMobileTimeLeft] = useState(180)
  const [mobileCanResend, setMobileCanResend] = useState(false)
  const [countryCode, setCountryCode] = useState('')

  useEffect(() => {
    setMounted(true)
    if (user?.mobileNumber) {
      // Extract country code from mobile number
      const mobile = user.mobileNumber
      if (mobile.startsWith('+91')) {
        setCountryCode('+91')
      } else if (mobile.startsWith('+1')) {
        setCountryCode('+1')
      } else {
        setCountryCode('+91') // default
      }
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Email OTP timer
  useEffect(() => {
    if (emailOtpSent && emailTimeLeft > 0) {
      const timer = setTimeout(() => setEmailTimeLeft(emailTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (emailTimeLeft === 0) {
      setEmailCanResend(true)
    }
  }, [emailTimeLeft, emailOtpSent])

  // Mobile OTP timer
  useEffect(() => {
    if (mobileOtpSent && mobileTimeLeft > 0) {
      const timer = setTimeout(() => setMobileTimeLeft(mobileTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (mobileTimeLeft === 0) {
      setMobileCanResend(true)
    }
  }, [mobileTimeLeft, mobileOtpSent])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMobileWithoutCountryCode = () => {
    if (!user?.mobileNumber) return ''
    const mobile = user.mobileNumber
    if (mobile.startsWith('+91')) {
      return mobile.substring(3)
    } else if (mobile.startsWith('+1')) {
      return mobile.substring(2)
    }
    return mobile
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Password update failed')
      }

      showToast('Password updated successfully', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Password update failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpdate = async () => {
    if (!imageFile) {
      showToast('Please select an image first', 'error')
      return
    }

    setIsLoading(true)
    try {
      // Simulate image upload to CDN
      await new Promise(resolve => setTimeout(resolve, 2000))
      const imageUrl = `https://cdn.grihome.com/avatars/${Date.now()}-${imageFile.name}`

      const response = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, imageUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Avatar update failed')
      }

      dispatch(setUser(data.user))
      showToast('Avatar updated successfully', 'success')
      setImageFile(null)
      setImagePreview('')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Avatar update failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmailOtp = async () => {
    setIsLoading(true)
    try {
      // Simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      setEmailOtpSent(true)
      setEmailTimeLeft(180)
      setEmailCanResend(false)
      showToast('OTP sent to your email', 'success')
    } catch (error) {
      showToast('Failed to send OTP', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (emailOtp !== '123456') {
      showToast('Invalid OTP. Please enter 123456 for testing.', 'error')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, otp: emailOtp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed')
      }

      dispatch(setUser(data.user))
      showToast('Email verified successfully', 'success')
      setEmailOtp('')
      setEmailOtpSent(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Email verification failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMobileOtp = async () => {
    setIsLoading(true)
    try {
      // Simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMobileOtpSent(true)
      setMobileTimeLeft(180)
      setMobileCanResend(false)
      showToast('OTP sent to your mobile', 'success')
    } catch (error) {
      showToast('Failed to send OTP', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyMobile = async () => {
    if (mobileOtp !== '123456') {
      showToast('Invalid OTP. Please enter 123456 for testing.', 'error')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/verify-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, otp: mobileOtp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Mobile verification failed')
      }

      dispatch(setUser(data.user))
      showToast('Mobile verified successfully', 'success')
      setMobileOtp('')
      setMobileOtpSent(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Mobile verification failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Information</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your personal information and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>

            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={user.name?.split(' ')[0] || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={user.name?.split(' ').slice(1).join(' ') || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {user.isEmailVerified ? (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Email Verification */}
                {!user.isEmailVerified && (
                  <div className="mt-3 space-y-3">
                    {!emailOtpSent ? (
                      <button
                        onClick={handleSendEmailOtp}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={emailOtp}
                          onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                        />
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={handleVerifyEmail}
                            disabled={isLoading || emailOtp.length !== 6}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {isLoading ? 'Verifying...' : 'Verify'}
                          </button>
                          {emailTimeLeft > 0 ? (
                            <span className="text-sm text-gray-500">
                              Resend in {formatTime(emailTimeLeft)}
                            </span>
                          ) : (
                            <button
                              onClick={handleSendEmailOtp}
                              disabled={isLoading}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <div className="mt-1 flex space-x-2">
                  <div className="w-32">
                    <CountryCodeDropdown
                      value={countryCode}
                      onChange={setCountryCode}
                      disabled
                      className="bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={getMobileWithoutCountryCode()}
                      disabled
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {user.isMobileVerified ? (
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Verification */}
                {!user.isMobileVerified && (
                  <div className="mt-3 space-y-3">
                    {!mobileOtpSent ? (
                      <button
                        onClick={handleSendMobileOtp}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={mobileOtp}
                          onChange={e =>
                            setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                        />
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={handleVerifyMobile}
                            disabled={isLoading || mobileOtp.length !== 6}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {isLoading ? 'Verifying...' : 'Verify'}
                          </button>
                          {mobileTimeLeft > 0 ? (
                            <span className="text-sm text-gray-500">
                              Resend in {formatTime(mobileTimeLeft)}
                            </span>
                          ) : (
                            <button
                              onClick={handleSendMobileOtp}
                              disabled={isLoading}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Company Information */}
              {user.isAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={user.companyName || ''}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Security & Avatar */}
          <div className="space-y-8">
            {/* Change Password */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <div className="mt-1 relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordUpdate}
                  disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {user.isAgent ? 'Company Logo' : 'Profile Picture'}
              </h2>

              <div className="space-y-4">
                {/* Current Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                    {user.imageLink ? (
                      <Image
                        src={user.imageLink}
                        alt="Current avatar"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-2xl font-bold">
                        {user.name
                          ? user.name
                              .split(' ')
                              .map(n => n.charAt(0))
                              .join('')
                              .slice(0, 2)
                          : user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Current {user.isAgent ? 'Logo' : 'Picture'}
                    </h3>
                    <p className="text-sm text-gray-500">JPG, PNG up to 5MB</p>
                  </div>
                </div>

                {/* Upload New Avatar */}
                <div className="border-2 border-gray-300 border-dashed rounded-lg p-6">
                  <div className="text-center">
                    {imagePreview ? (
                      <div className="relative mx-auto h-32 w-32 mb-4">
                        <Image
                          src={imagePreview}
                          alt="Preview"
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
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                    )}

                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="avatar-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="avatar-upload"
                          name="avatar-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>

                {imageFile && (
                  <button
                    onClick={handleAvatarUpdate}
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Uploading...' : 'Update Avatar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
