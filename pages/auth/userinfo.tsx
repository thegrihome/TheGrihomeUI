import { useSession, signOut, signIn } from 'next-auth/react'
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
            {userData.image && (
              <div className="userinfo-avatar-section">
                <Image
                  src={userData.image}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="userinfo-avatar"
                />
              </div>
            )}

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
                <div className="userinfo-value-with-badge">
                  <p className="userinfo-value">{userData.email}</p>
                  {userData.emailVerified ? (
                    <span className="userinfo-badge userinfo-badge--verified">Verified</span>
                  ) : (
                    <span className="userinfo-badge userinfo-badge--unverified">Unverified</span>
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
