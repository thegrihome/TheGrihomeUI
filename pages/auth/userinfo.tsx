import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface UserData {
  id: string
  username: string
  name: string
  email: string
  phone: string
  emailVerified: string | null
  mobileVerified: string | null
  role: string
  isAdmin: boolean
  companyName: string | null
  licenseNumber: string | null
  image: string | null
  createdAt: string
}

export default function UserInfo() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOtp, setMobileOtp] = useState('')
  const [showMobileOtpInput, setShowMobileOtpInput] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [emailOtp, setEmailOtp] = useState('')
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false)
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false)
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/info?email=${session.user.email}`)
          if (response.ok) {
            const data = await response.json()
            setUserData(data.user)
          } else {
            toast.error('Failed to load user information')
          }
        } catch (error) {
          toast.error('Error loading user data')
        } finally {
          setLoading(false)
        }
      }
    }

    if (status === 'authenticated') {
      fetchUserData()
    }
  }, [session, status])

  if (status === 'loading' || loading) {
    return (
      <div className="userinfo-container">
        <Header />
        <main className="userinfo-main">
          <div className="userinfo-loading">
            <div className="userinfo-spinner"></div>
            <p>Loading user information...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session || !userData) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleSendMobileOTP = async () => {
    if (!userData?.phone) return

    setSendingOtp(true)
    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowMobileOtpInput(true)
      toast.success('OTP sent to your mobile! Use 123456 for testing')
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyMobileOTP = async () => {
    if (!userData?.phone || !mobileOtp) return

    setVerifyingOtp(true)
    try {
      const result = await signIn('credentials', {
        identifier: userData.phone,
        otp: mobileOtp,
        loginType: 'otp',
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid OTP')
      } else {
        toast.success('Mobile number verified successfully!')
        // Refresh user data
        const response = await fetch(`/api/user/info?email=${session?.user?.email}`)
        if (response.ok) {
          const data = await response.json()
          setUserData(data.user)
        }
        setShowMobileOtpInput(false)
        setMobileOtp('')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleSendEmailOTP = async () => {
    if (!userData?.email) return

    setSendingEmailOtp(true)
    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowEmailOtpInput(true)
      toast.success('OTP sent to your email! Use 123456 for testing')
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setSendingEmailOtp(false)
    }
  }

  const handleVerifyEmailOTP = async () => {
    if (!userData?.email || !emailOtp) return

    setVerifyingEmailOtp(true)
    try {
      const result = await signIn('credentials', {
        identifier: userData.email,
        otp: emailOtp,
        loginType: 'otp',
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid OTP')
      } else {
        toast.success('Email verified successfully!')
        // Refresh user data
        const response = await fetch(`/api/user/info?email=${session?.user?.email}`)
        if (response.ok) {
          const data = await response.json()
          setUserData(data.user)
        }
        setShowEmailOtpInput(false)
        setEmailOtp('')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setVerifyingEmailOtp(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setAvatar(file)

      // Create preview and compress image
      const reader = new FileReader()
      reader.onload = e => {
        const img = new window.Image()
        img.onload = () => {
          // Create canvas to resize image
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Resize to max 400x400 while maintaining aspect ratio
          let width = img.width
          let height = img.height
          const maxSize = 400

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
          setAvatarPreview(compressedBase64)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatar || !avatarPreview) {
      toast.error('Please select an image first')
      return
    }

    setUploadingAvatar(true)

    try {
      // Convert file to base64 and compress if needed
      const reader = new FileReader()
      reader.onload = async e => {
        try {
          const base64 = e.target?.result as string

          // Update user avatar with base64 data
          const response = await fetch('/api/user/update-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: base64 }),
          })

          if (response.ok) {
            toast.success('Avatar updated successfully!')
            // Refresh user data
            const userResponse = await fetch(`/api/user/info?email=${session?.user?.email}`)
            if (userResponse.ok) {
              const data = await userResponse.json()
              setUserData(data.user)
            }
            setAvatar(null)
            setAvatarPreview('')
            // Reload page to refresh session
            window.location.reload()
          } else {
            const error = await response.json()
            toast.error(error.message || 'Failed to update avatar')
          }
        } catch (error) {
          toast.error('Failed to upload avatar')
        } finally {
          setUploadingAvatar(false)
        }
      }
      reader.readAsDataURL(avatar)
    } catch (error) {
      toast.error('Failed to upload avatar')
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="userinfo-container">
      <Header />
      <main className="userinfo-main">
        <div className="userinfo-content">
          <div className="userinfo-card">
            <div className="userinfo-header">
              <h1 className="userinfo-title">User Information</h1>
              <button
                onClick={() => router.push('/my-properties')}
                className="userinfo-properties-link"
              >
                My Properties
              </button>
            </div>

            {/* Profile Picture */}
            <div className="userinfo-avatar-section">
              <div className="userinfo-avatar-display">
                <label className="userinfo-label">Profile Picture</label>
                {userData.image || avatarPreview ? (
                  <Image
                    src={avatarPreview || userData.image || ''}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="userinfo-avatar"
                  />
                ) : (
                  <div className="userinfo-avatar-placeholder">
                    <span className="text-4xl font-medium text-gray-400">
                      {userData.name
                        ? userData.name
                            .split(' ')
                            .map(n => n.charAt(0))
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : userData.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {userData.image && !avatarPreview && (
                  <p className="userinfo-avatar-status">Current Avatar</p>
                )}
                {avatarPreview && (
                  <p className="userinfo-avatar-status">Preview - Click Save to update</p>
                )}
              </div>
              <div className="userinfo-avatar-upload">
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label htmlFor="avatar-upload" className="userinfo-avatar-select-btn">
                  {userData.image ? 'Change Avatar' : 'Upload Avatar'}
                </label>
                {avatar && (
                  <button
                    onClick={handleUploadAvatar}
                    disabled={uploadingAvatar}
                    className="userinfo-avatar-upload-btn"
                  >
                    {uploadingAvatar ? 'Uploading...' : 'Save Avatar'}
                  </button>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="userinfo-grid">
              <div className="userinfo-field">
                <label className="userinfo-label">Full Name</label>
                <p className="userinfo-value">{userData.name || 'Not provided'}</p>
              </div>

              <div className="userinfo-field">
                <label className="userinfo-label">Username</label>
                <p className="userinfo-value">{userData.username}</p>
              </div>

              <div className="userinfo-field">
                <label className="userinfo-label">Email Address</label>
                <div className="userinfo-mobile-section">
                  <div className="userinfo-value-with-badge">
                    <p className="userinfo-value">{userData.email}</p>
                    {userData.emailVerified ? (
                      <span className="userinfo-badge userinfo-badge--verified">Verified</span>
                    ) : (
                      <>
                        <span className="userinfo-badge userinfo-badge--unverified">
                          Unverified
                        </span>
                        {!showEmailOtpInput && (
                          <button
                            onClick={handleSendEmailOTP}
                            disabled={sendingEmailOtp}
                            className="userinfo-verify-btn"
                          >
                            {sendingEmailOtp ? 'Sending...' : 'Send OTP'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {showEmailOtpInput && !userData.emailVerified && (
                    <div className="userinfo-otp-full-group">
                      <input
                        type="text"
                        value={emailOtp}
                        onChange={e => setEmailOtp(e.target.value)}
                        placeholder="Enter OTP (123456)"
                        maxLength={6}
                        className="userinfo-otp-full-input"
                      />
                      <button
                        onClick={handleVerifyEmailOTP}
                        disabled={verifyingEmailOtp || !emailOtp}
                        className="userinfo-verify-full-btn"
                      >
                        {verifyingEmailOtp ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="userinfo-field">
                <label className="userinfo-label">Mobile Number</label>
                <div className="userinfo-mobile-section">
                  <div className="userinfo-value-with-badge">
                    <p className="userinfo-value">{userData.phone || 'Not provided'}</p>
                    {userData.phone && (
                      <>
                        {userData.mobileVerified ? (
                          <span className="userinfo-badge userinfo-badge--verified">Verified</span>
                        ) : (
                          <>
                            <span className="userinfo-badge userinfo-badge--unverified">
                              Unverified
                            </span>
                            {!showMobileOtpInput && (
                              <button
                                onClick={handleSendMobileOTP}
                                disabled={sendingOtp}
                                className="userinfo-verify-btn"
                              >
                                {sendingOtp ? 'Sending...' : 'Send OTP'}
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                  {showMobileOtpInput && !userData.mobileVerified && (
                    <div className="userinfo-otp-full-group">
                      <input
                        type="text"
                        value={mobileOtp}
                        onChange={e => setMobileOtp(e.target.value)}
                        placeholder="Enter OTP (123456)"
                        maxLength={6}
                        className="userinfo-otp-full-input"
                      />
                      <button
                        onClick={handleVerifyMobileOTP}
                        disabled={verifyingOtp || !mobileOtp}
                        className="userinfo-verify-full-btn"
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="userinfo-field">
                <label className="userinfo-label">Account Type</label>
                <p className="userinfo-value">
                  {userData.role === 'AGENT' ? 'Real Estate Agent' : 'Buyer'}
                  {userData.isAdmin && ' (Admin)'}
                </p>
              </div>

              {userData.companyName && (
                <div className="userinfo-field">
                  <label className="userinfo-label">Company Name</label>
                  <p className="userinfo-value">{userData.companyName}</p>
                </div>
              )}

              {userData.licenseNumber && (
                <div className="userinfo-field">
                  <label className="userinfo-label">License Number</label>
                  <p className="userinfo-value">{userData.licenseNumber}</p>
                </div>
              )}

              <div className="userinfo-field">
                <label className="userinfo-label">Member Since</label>
                <p className="userinfo-value">{formatDate(userData.createdAt)}</p>
              </div>
            </div>

            {/* Verification Notice */}
            {(!userData.emailVerified || !userData.mobileVerified) && (
              <div className="userinfo-notice">
                <h3 className="userinfo-notice-title">Verification Required</h3>
                <p className="userinfo-notice-text">
                  {!userData.emailVerified && !userData.mobileVerified
                    ? 'Please verify your email and mobile number by logging in with OTP.'
                    : !userData.emailVerified
                      ? 'Please verify your email by logging in with email OTP.'
                      : 'Please verify your mobile number by logging in with mobile OTP.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
