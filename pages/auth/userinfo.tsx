import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CountryCodeDropdown from '@/components/auth/CountryCodeDropdown'

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function UserInfoPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailOtpLoading, setEmailOtpLoading] = useState(false)
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false)
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
  const [userProfileImage, setUserProfileImage] = useState<string>('')

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editMobile, setEditMobile] = useState('')
  const [editCountryCode, setEditCountryCode] = useState('+91')
  const [originalValues, setOriginalValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    countryCode: '+91',
  })
  const [newEmailVerified, setNewEmailVerified] = useState(false)
  const [newMobileVerified, setNewMobileVerified] = useState(false)
  const [newEmailOtp, setNewEmailOtp] = useState('')
  const [newMobileOtp, setNewMobileOtp] = useState('')
  const [newEmailOtpSent, setNewEmailOtpSent] = useState(false)
  const [newMobileOtpSent, setNewMobileOtpSent] = useState(false)
  const [newEmailTimeLeft, setNewEmailTimeLeft] = useState(180)
  const [newMobileTimeLeft, setNewMobileTimeLeft] = useState(180)
  const [savingProfile, setSavingProfile] = useState(false)

  // Edit mode validation states
  const [editValidationErrors, setEditValidationErrors] = useState({
    email: '',
    mobile: '',
  })
  const [checkingEditUnique, setCheckingEditUnique] = useState({
    email: false,
    mobile: false,
  })

  // OTP error states (for inline display)
  const [emailOtpError, setEmailOtpError] = useState('')
  const [mobileOtpError, setMobileOtpError] = useState('')
  const [newEmailOtpError, setNewEmailOtpError] = useState('')
  const [newMobileOtpError, setNewMobileOtpError] = useState('')

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

  // Fetch user profile image from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`/api/user/info?email=${user.email}`)
          if (response.ok) {
            const data = await response.json()
            if (data.user?.image) {
              setUserProfileImage(data.user.image)
            }
          }
        } catch (error) {
          // Silent fail
        }
      }
    }
    fetchUserProfile()
  }, [user?.email])

  useEffect(() => {
    if (!isAuthenticated && status !== 'loading') {
      router.push('/login')
    }
  }, [isAuthenticated, status, router])

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

  // New Email OTP timer (for edit mode)
  useEffect(() => {
    if (newEmailOtpSent && newEmailTimeLeft > 0) {
      const timer = setTimeout(() => setNewEmailTimeLeft(newEmailTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [newEmailTimeLeft, newEmailOtpSent])

  // New Mobile OTP timer (for edit mode)
  useEffect(() => {
    if (newMobileOtpSent && newMobileTimeLeft > 0) {
      const timer = setTimeout(() => setNewMobileTimeLeft(newMobileTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [newMobileTimeLeft, newMobileOtpSent])

  // Debounced email validation (format + uniqueness) for edit mode
  useEffect(() => {
    if (!isEditMode || !editEmail || editEmail === originalValues.email) {
      setEditValidationErrors(prev => ({ ...prev, email: '' }))
      return
    }

    const checkEmailValidation = async () => {
      setCheckingEditUnique(prev => ({ ...prev, email: true }))

      try {
        const response = await fetch('/api/auth/check-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'email', value: editEmail }),
        })

        const data = await response.json()

        if (!response.ok) {
          setEditValidationErrors(prev => ({
            ...prev,
            email: data.message || 'Invalid email format',
          }))
        } else if (!data.isUnique) {
          setEditValidationErrors(prev => ({
            ...prev,
            email: 'Email is already registered',
          }))
        } else {
          setEditValidationErrors(prev => ({ ...prev, email: '' }))
        }
      } catch {
        // Silently fail for network errors
      } finally {
        setCheckingEditUnique(prev => ({ ...prev, email: false }))
      }
    }

    const timer = setTimeout(() => {
      checkEmailValidation()
    }, 500)
    return () => clearTimeout(timer)
  }, [editEmail, isEditMode, originalValues.email])

  // Debounced mobile validation (format + uniqueness) for edit mode
  useEffect(() => {
    const fullMobile = editCountryCode + editMobile
    const originalFullMobile = originalValues.countryCode + originalValues.mobile

    if (!isEditMode || !editMobile || fullMobile === originalFullMobile) {
      setEditValidationErrors(prev => ({ ...prev, mobile: '' }))
      return
    }

    const checkMobileValidation = async () => {
      setCheckingEditUnique(prev => ({ ...prev, mobile: true }))

      try {
        const response = await fetch('/api/auth/check-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: 'mobile', value: fullMobile }),
        })

        const data = await response.json()

        if (!response.ok) {
          setEditValidationErrors(prev => ({
            ...prev,
            mobile: data.message || 'Invalid mobile number format',
          }))
        } else if (!data.isUnique) {
          setEditValidationErrors(prev => ({
            ...prev,
            mobile: 'Mobile number is already registered',
          }))
        } else {
          setEditValidationErrors(prev => ({ ...prev, mobile: '' }))
        }
      } catch {
        // Silently fail for network errors
      } finally {
        setCheckingEditUnique(prev => ({ ...prev, mobile: false }))
      }
    }

    const timer = setTimeout(() => {
      checkMobileValidation()
    }, 500)
    return () => clearTimeout(timer)
  }, [editMobile, editCountryCode, isEditMode, originalValues.mobile, originalValues.countryCode])

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
    if (!newPassword || !confirmPassword) {
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
        body: JSON.stringify({ userId: user?.id, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Password update failed')
      }

      showToast('Password updated successfully', 'success')
      setNewPassword('')
      setConfirmPassword('')
      setIsEditingPassword(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Password update failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpdate = async () => {
    if (!imageFile || !imagePreview) {
      showToast('Please select an image first', 'error')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imagePreview }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Avatar update failed')
      }

      await update()
      setUserProfileImage(data.imageUrl || imagePreview)
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
    setEmailOtpLoading(true)
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
      setEmailOtpLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (emailOtp !== '9848022338') {
      setEmailOtpError('Invalid OTP')
      return
    }

    setEmailOtpError('')
    setEmailOtpLoading(true)
    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, otp: emailOtp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed')
      }

      await update()
      showToast('Email verified successfully', 'success')
      setEmailOtp('')
      setEmailOtpSent(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Email verification failed', 'error')
    } finally {
      setEmailOtpLoading(false)
    }
  }

  const handleSendMobileOtp = async () => {
    setMobileOtpLoading(true)
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
      setMobileOtpLoading(false)
    }
  }

  const handleVerifyMobile = async () => {
    if (mobileOtp !== '9848022338') {
      setMobileOtpError('Invalid OTP')
      return
    }

    setMobileOtpError('')
    setMobileOtpLoading(true)
    try {
      const response = await fetch('/api/user/verify-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, otp: mobileOtp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Mobile verification failed')
      }

      await update()
      showToast('Mobile verified successfully', 'success')
      setMobileOtp('')
      setMobileOtpSent(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Mobile verification failed', 'error')
    } finally {
      setMobileOtpLoading(false)
    }
  }

  // Edit mode handlers
  const enterEditMode = () => {
    const currentFirst = user?.name?.split(' ')[0] || ''
    const currentLast = user?.name?.split(' ').slice(1).join(' ') || ''
    const currentMobile = getMobileWithoutCountryCode()

    setEditFirstName(currentFirst)
    setEditLastName(currentLast)
    setEditEmail(user?.email || '')
    setEditMobile(currentMobile)
    setEditCountryCode(countryCode || '+91')
    setOriginalValues({
      firstName: currentFirst,
      lastName: currentLast,
      email: user?.email || '',
      mobile: currentMobile,
      countryCode: countryCode || '+91',
    })
    setNewEmailVerified(false)
    setNewMobileVerified(false)
    setNewEmailOtp('')
    setNewMobileOtp('')
    setNewEmailOtpSent(false)
    setNewMobileOtpSent(false)
    setEditValidationErrors({ email: '', mobile: '' })
    setCheckingEditUnique({ email: false, mobile: false })
    setNewEmailOtpError('')
    setNewMobileOtpError('')
    setIsEditMode(true)
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
    setEditFirstName('')
    setEditLastName('')
    setEditEmail('')
    setEditMobile('')
    setNewEmailVerified(false)
    setNewMobileVerified(false)
    setNewEmailOtp('')
    setNewMobileOtp('')
    setNewEmailOtpSent(false)
    setNewMobileOtpSent(false)
    setEditValidationErrors({ email: '', mobile: '' })
    setCheckingEditUnique({ email: false, mobile: false })
    setNewEmailOtpError('')
    setNewMobileOtpError('')
  }

  const hasEmailChanged = () => editEmail !== originalValues.email
  const hasMobileChanged = () =>
    editMobile !== originalValues.mobile || editCountryCode !== originalValues.countryCode

  const canSaveProfile = () => {
    // Check for validation errors
    if (editValidationErrors.email || editValidationErrors.mobile) return false
    // Check if validation is in progress
    if (checkingEditUnique.email || checkingEditUnique.mobile) return false
    // If email changed, it must be verified
    if (hasEmailChanged() && !newEmailVerified) return false
    // If mobile changed, it must be verified
    if (hasMobileChanged() && !newMobileVerified) return false
    return true
  }

  const hasValidationErrors = () => {
    return editValidationErrors.email || editValidationErrors.mobile
  }

  const handleSendNewEmailOtp = async () => {
    setEmailOtpLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setNewEmailOtpSent(true)
      setNewEmailTimeLeft(180)
      showToast('OTP sent to new email', 'success')
    } catch {
      showToast('Failed to send OTP', 'error')
    } finally {
      setEmailOtpLoading(false)
    }
  }

  const handleVerifyNewEmail = async () => {
    if (newEmailOtp !== '9848022338') {
      setNewEmailOtpError('Invalid OTP')
      return
    }

    setNewEmailOtpError('')
    setEmailOtpLoading(true)
    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: newEmailOtp, newEmail: editEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed')
      }

      setNewEmailVerified(true)
      showToast('New email verified successfully', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Email verification failed', 'error')
    } finally {
      setEmailOtpLoading(false)
    }
  }

  const handleSendNewMobileOtp = async () => {
    setMobileOtpLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setNewMobileOtpSent(true)
      setNewMobileTimeLeft(180)
      showToast('OTP sent to new mobile', 'success')
    } catch {
      showToast('Failed to send OTP', 'error')
    } finally {
      setMobileOtpLoading(false)
    }
  }

  const handleVerifyNewMobile = async () => {
    if (newMobileOtp !== '9848022338') {
      setNewMobileOtpError('Invalid OTP')
      return
    }

    setNewMobileOtpError('')
    setMobileOtpLoading(true)
    try {
      const fullMobile = editCountryCode + editMobile
      const response = await fetch('/api/user/verify-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: newMobileOtp, newMobile: fullMobile }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Mobile verification failed')
      }

      setNewMobileVerified(true)
      showToast('New mobile verified successfully', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Mobile verification failed', 'error')
    } finally {
      setMobileOtpLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!canSaveProfile()) {
      showToast('Please verify changed email/mobile before saving', 'error')
      return
    }

    setSavingProfile(true)
    try {
      const updatePayload: {
        firstName?: string
        lastName?: string
        newEmail?: string
        emailVerified?: boolean
        newMobile?: string
        mobileVerified?: boolean
      } = {}

      // Always include name in edit mode - let the API determine if there's a change
      updatePayload.firstName = editFirstName.trim()
      updatePayload.lastName = editLastName.trim()

      // Include email if changed and verified
      if (hasEmailChanged() && newEmailVerified) {
        updatePayload.newEmail = editEmail
        updatePayload.emailVerified = true
      }

      // Include mobile if changed and verified
      if (hasMobileChanged() && newMobileVerified) {
        updatePayload.newMobile = editCountryCode + editMobile
        updatePayload.mobileVerified = true
      }

      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed')
      }

      await update()
      showToast(data.message || 'Profile updated successfully', 'success')
      setIsEditMode(false)

      // Reset edit states
      setNewEmailVerified(false)
      setNewMobileVerified(false)
      setNewEmailOtp('')
      setNewMobileOtp('')
      setNewEmailOtpSent(false)
      setNewMobileOtpSent(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Profile update failed', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Information</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your personal information and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              {!isEditMode && (
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                ) : (
                  <input
                    type="text"
                    value={user.name?.split(' ')[0] || ''}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                ) : (
                  <input
                    type="text"
                    value={user.name?.split(' ').slice(1).join(' ') || ''}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                  {isEditMode && (
                    <span className="ml-2 text-xs text-gray-500">(cannot be changed)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={user.username || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                  {isEditMode && checkingEditUnique.email && (
                    <span className="ml-2 text-xs text-gray-500">(checking...)</span>
                  )}
                </label>
                {isEditMode ? (
                  <>
                    <div className="mt-1 relative">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => {
                          setEditEmail(e.target.value)
                          setNewEmailVerified(false)
                          setNewEmailOtpSent(false)
                          setNewEmailOtp('')
                        }}
                        className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          editValidationErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                      {hasEmailChanged() && !editValidationErrors.email && newEmailVerified && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
                        </div>
                      )}
                    </div>
                    {/* Email validation error */}
                    {editValidationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{editValidationErrors.email}</p>
                    )}
                    {/* Needs verification message - shown below input */}
                    {hasEmailChanged() && !editValidationErrors.email && !newEmailVerified && (
                      <p className="mt-1 text-xs text-orange-600 font-medium">Needs verification</p>
                    )}
                    {/* New Email Verification */}
                    {hasEmailChanged() && !newEmailVerified && !editValidationErrors.email && (
                      <div className="mt-3 space-y-3">
                        {!newEmailOtpSent ? (
                          <button
                            onClick={handleSendNewEmailOtp}
                            disabled={emailOtpLoading || !editEmail || checkingEditUnique.email}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {emailOtpLoading ? 'Sending...' : 'Send OTP to New Email'}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newEmailOtp}
                              onChange={e => {
                                setNewEmailOtp(e.target.value.replace(/\D/g, ''))
                                setNewEmailOtpError('')
                              }}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter OTP"
                            />
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={handleVerifyNewEmail}
                                disabled={emailOtpLoading || !newEmailOtp}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                {emailOtpLoading ? 'Verifying...' : 'Verify'}
                              </button>
                              {newEmailOtpError && (
                                <span className="text-sm text-red-600">{newEmailOtpError}</span>
                              )}
                              {newEmailTimeLeft > 0 ? (
                                <span className="text-sm text-gray-500">
                                  Resend in {formatTime(newEmailTimeLeft)}
                                </span>
                              ) : (
                                <button
                                  onClick={handleSendNewEmailOtp}
                                  disabled={emailOtpLoading}
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
                  </>
                ) : (
                  <>
                    <div className="mt-1 relative">
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div
                          className="relative group cursor-help"
                          title={
                            user.isEmailVerified
                              ? 'Email verified successfully'
                              : 'Pending verification'
                          }
                        >
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
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            {user.isEmailVerified
                              ? 'Email verified successfully'
                              : 'Pending verification'}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email Verification */}
                    {!user.isEmailVerified && (
                      <div className="mt-3 space-y-3">
                        {!emailOtpSent ? (
                          <button
                            onClick={handleSendEmailOtp}
                            disabled={emailOtpLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {emailOtpLoading ? 'Sending...' : 'Send OTP'}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={emailOtp}
                              onChange={e => {
                                setEmailOtp(e.target.value.replace(/\D/g, ''))
                                setEmailOtpError('')
                              }}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter OTP"
                            />
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={handleVerifyEmail}
                                disabled={emailOtpLoading || !emailOtp}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                {emailOtpLoading ? 'Verifying...' : 'Verify'}
                              </button>
                              {emailOtpError && (
                                <span className="text-sm text-red-600">{emailOtpError}</span>
                              )}
                              {emailTimeLeft > 0 ? (
                                <span className="text-sm text-gray-500">
                                  Resend in {formatTime(emailTimeLeft)}
                                </span>
                              ) : (
                                <button
                                  onClick={handleSendEmailOtp}
                                  disabled={emailOtpLoading}
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
                  </>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number
                  {isEditMode && checkingEditUnique.mobile && (
                    <span className="ml-2 text-xs text-gray-500">(checking...)</span>
                  )}
                </label>
                {isEditMode ? (
                  <>
                    <div className="mt-1 flex space-x-2">
                      <div className="w-32">
                        <CountryCodeDropdown
                          value={editCountryCode}
                          onChange={code => {
                            setEditCountryCode(code)
                            setNewMobileVerified(false)
                            setNewMobileOtpSent(false)
                            setNewMobileOtp('')
                          }}
                          disabled={false}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="tel"
                          value={editMobile}
                          onChange={e => {
                            setEditMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                            setNewMobileVerified(false)
                            setNewMobileOtpSent(false)
                            setNewMobileOtp('')
                          }}
                          className={`block w-full h-[42px] px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            editValidationErrors.mobile ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter mobile number"
                          maxLength={10}
                        />
                        {hasMobileChanged() &&
                          !editValidationErrors.mobile &&
                          newMobileVerified && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
                            </div>
                          )}
                      </div>
                    </div>
                    {/* Mobile validation error */}
                    {editValidationErrors.mobile && (
                      <p className="mt-1 text-sm text-red-600">{editValidationErrors.mobile}</p>
                    )}
                    {/* Needs verification message - shown below input */}
                    {hasMobileChanged() && !editValidationErrors.mobile && !newMobileVerified && (
                      <p className="mt-1 text-xs text-orange-600 font-medium">Needs verification</p>
                    )}
                    {/* New Mobile Verification */}
                    {hasMobileChanged() && !newMobileVerified && !editValidationErrors.mobile && (
                      <div className="mt-3 space-y-3">
                        {!newMobileOtpSent ? (
                          <button
                            onClick={handleSendNewMobileOtp}
                            disabled={mobileOtpLoading || !editMobile || checkingEditUnique.mobile}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {mobileOtpLoading ? 'Sending...' : 'Send OTP to New Mobile'}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newMobileOtp}
                              onChange={e => {
                                setNewMobileOtp(e.target.value.replace(/\D/g, ''))
                                setNewMobileOtpError('')
                              }}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter OTP"
                            />
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={handleVerifyNewMobile}
                                disabled={mobileOtpLoading || !newMobileOtp}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                {mobileOtpLoading ? 'Verifying...' : 'Verify'}
                              </button>
                              {newMobileOtpError && (
                                <span className="text-sm text-red-600">{newMobileOtpError}</span>
                              )}
                              {newMobileTimeLeft > 0 ? (
                                <span className="text-sm text-gray-500">
                                  Resend in {formatTime(newMobileTimeLeft)}
                                </span>
                              ) : (
                                <button
                                  onClick={handleSendNewMobileOtp}
                                  disabled={mobileOtpLoading}
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
                  </>
                ) : (
                  <>
                    <div className="mt-1 flex space-x-2">
                      <div className="w-32">
                        <CountryCodeDropdown
                          value={countryCode}
                          onChange={setCountryCode}
                          disabled={true}
                          className="bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="tel"
                          value={getMobileWithoutCountryCode()}
                          disabled
                          className="block w-full h-[42px] px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div
                            className="relative group cursor-help"
                            title={
                              user.isMobileVerified
                                ? 'Mobile verified successfully'
                                : 'Pending verification'
                            }
                          >
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
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              {user.isMobileVerified
                                ? 'Mobile verified successfully'
                                : 'Pending verification'}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Verification */}
                    {!user.isMobileVerified && (
                      <div className="mt-3 space-y-3">
                        {!mobileOtpSent ? (
                          <button
                            onClick={handleSendMobileOtp}
                            disabled={mobileOtpLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {mobileOtpLoading ? 'Sending...' : 'Send OTP'}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={mobileOtp}
                              onChange={e => {
                                setMobileOtp(e.target.value.replace(/\D/g, ''))
                                setMobileOtpError('')
                              }}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter OTP"
                            />
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={handleVerifyMobile}
                                disabled={mobileOtpLoading || !mobileOtp}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                {mobileOtpLoading ? 'Verifying...' : 'Verify'}
                              </button>
                              {mobileOtpError && (
                                <span className="text-sm text-red-600">{mobileOtpError}</span>
                              )}
                              {mobileTimeLeft > 0 ? (
                                <span className="text-sm text-gray-500">
                                  Resend in {formatTime(mobileTimeLeft)}
                                </span>
                              ) : (
                                <button
                                  onClick={handleSendMobileOtp}
                                  disabled={mobileOtpLoading}
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
                  </>
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

              {/* Edit Mode Actions */}
              {isEditMode && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !canSaveProfile()}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={cancelEditMode}
                    disabled={savingProfile}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Help text for edit mode */}
              {isEditMode && (hasEmailChanged() || hasMobileChanged()) && (
                <p
                  className={`text-xs mt-2 ${hasValidationErrors() ? 'text-red-600' : 'text-gray-500'}`}
                >
                  {hasValidationErrors()
                    ? 'Please fix validation errors before saving.'
                    : !canSaveProfile()
                      ? 'Please verify your new email/mobile before saving.'
                      : 'All changes verified. Ready to save.'}
                </p>
              )}
            </div>
          </div>

          {/* Security & Avatar */}
          <div className="space-y-8">
            {/* Change Password */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Password</h2>

              <div className="space-y-4">
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1">
                    <input
                      type="password"
                      value="••••••••••••"
                      disabled
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingPassword(!isEditingPassword)}
                    className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
                  >
                    {isEditingPassword ? 'Cancel' : 'Change password'}
                  </button>
                </div>

                {/* New Password and Confirm Password */}
                {isEditingPassword && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
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
                          placeholder="Confirm new password"
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
                      disabled={isLoading || !newPassword || !confirmPassword}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </>
                )}
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
                    {userProfileImage ? (
                      <Image
                        src={userProfileImage}
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
                          : user.username?.charAt(0).toUpperCase() || 'U'}
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
      <Footer />
    </div>
  )
}
