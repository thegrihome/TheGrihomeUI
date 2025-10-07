import React, { useState, useEffect } from 'react'
import { NextSeo } from 'next-seo'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface ProjectRequestForm {
  builderName: string
  projectName: string
  location: string
  contactPersonName: string
  contactPersonEmail: string
  contactPersonPhone: string
  builderWebsite: string
  projectDescription: string
  projectType: string
  additionalInfo: string
}

interface UserData {
  name?: string
  email?: string
  phone?: string
  emailVerified?: boolean
  mobileVerified?: boolean
}

export default function AddProjectRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showEmailOTP, setShowEmailOTP] = useState(false)
  const [showMobileOTP, setShowMobileOTP] = useState(false)
  const [emailOTP, setEmailOTP] = useState('')
  const [mobileOTP, setMobileOTP] = useState('')
  const [formData, setFormData] = useState<ProjectRequestForm>({
    builderName: '',
    projectName: '',
    location: '',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    builderWebsite: '',
    projectDescription: '',
    projectType: 'RESIDENTIAL',
    additionalInfo: '',
  })

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/verification-status`)
      if (!response.ok) return
      const data = await response.json()
      setUserData(data)
      // Auto-populate form
      setFormData(prev => ({
        ...prev,
        contactPersonName: data.name || '',
        contactPersonEmail: data.email || '',
        contactPersonPhone: data.phone || '',
      }))
    } catch (error) {
      // Error fetching user data
    }
  }

  const projectTypes = [
    { value: 'RESIDENTIAL', label: 'Residential', icon: '🏠' },
    { value: 'COMMERCIAL', label: 'Commercial', icon: '🏢' },
    { value: 'MIXED_USE', label: 'Mixed Use', icon: '🏛️' },
    { value: 'INDUSTRIAL', label: 'Industrial', icon: '🏭' },
  ]

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleVerifyEmail = async () => {
    if (!userData?.email) return
    setShowEmailOTP(true)
    toast.success('OTP sent to your email')
    // TODO: Call API to send email OTP
  }

  const handleVerifyMobile = async () => {
    if (!userData?.phone) return
    setShowMobileOTP(true)
    toast.success('OTP sent to your mobile')
    // TODO: Call API to send mobile OTP
  }

  const handleEmailOTPSubmit = async () => {
    if (emailOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }
    // TODO: Call API to verify email OTP
    toast.success('Email verified successfully')
    setUserData(prev => (prev ? { ...prev, emailVerified: true } : null))
    setShowEmailOTP(false)
  }

  const handleMobileOTPSubmit = async () => {
    if (mobileOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }
    // TODO: Call API to verify mobile OTP
    toast.success('Mobile verified successfully')
    setUserData(prev => (prev ? { ...prev, mobileVerified: true } : null))
    setShowMobileOTP(false)
  }

  const validateForm = () => {
    // Check email verification
    if (!userData?.emailVerified) {
      toast.error('Please verify your email address before submitting')
      return false
    }
    // Check mobile verification
    if (!userData?.mobileVerified) {
      toast.error('Please verify your mobile number before submitting')
      return false
    }

    const requiredFields = [
      'builderName',
      'projectName',
      'location',
      'contactPersonName',
      'contactPersonEmail',
      'contactPersonPhone',
      'projectType',
    ]

    for (const field of requiredFields) {
      if (!formData[field as keyof ProjectRequestForm].trim()) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return false
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.contactPersonEmail)) {
      toast.error('Please enter a valid email address')
      return false
    }

    // Phone validation (basic)
    const phoneRegex = /^[+]?[\d\s-()]+$/
    if (!phoneRegex.test(formData.contactPersonPhone)) {
      toast.error('Please enter a valid phone number')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/project-requests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit project request')
      }

      toast.success('Project request submitted successfully! We will review and get back to you.')
      router.push('/properties')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit project request')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="add-project-request-main">
        <Header />
        <div className="add-project-request-loading">
          <div className="add-project-request-spinner"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/api/auth/signin')
    return null
  }

  return (
    <div className="add-project-request-container">
      <NextSeo
        title="Add Project Request - Grihome"
        description="Request to add a new project to Grihome"
        canonical="https://grihome.vercel.app/add-project-request"
      />

      <Header />

      <main className="add-project-request-main">
        <div className="add-project-request-content">
          <div className="add-project-request-inner">
            {/* Header */}
            <div className="request-header">
              <button onClick={() => router.back()} className="request-back-button">
                <svg
                  className="request-back-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <h1 className="request-title">Add Project Request</h1>
              <p className="request-subtitle">
                Submit a request to add a new project to Grihome. Our team will review and contact
                you.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="request-form">
              {/* Builder Information */}
              <div className="form-section">
                <h2 className="form-section__title">Builder Information</h2>
                <div className="form-section__grid">
                  <div>
                    <label className="request-field__label">
                      Builder Name <span className="request-field__required">*</span>
                    </label>
                    <input
                      type="text"
                      name="builderName"
                      value={formData.builderName}
                      onChange={handleInputChange}
                      className="request-field__textarea"
                      placeholder="Enter builder/developer name"
                      required
                    />
                  </div>
                  <div>
                    <label className="request-field__label">Builder Website</label>
                    <input
                      type="url"
                      name="builderWebsite"
                      value={formData.builderWebsite}
                      onChange={handleInputChange}
                      className="request-field__textarea"
                      placeholder="https://builder-website.com"
                    />
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="form-section">
                <h2 className="form-section__title">Project Information</h2>
                <div className="form-section__fields">
                  <div className="form-section__grid">
                    <div>
                      <label className="request-field__label">
                        Project Name <span className="request-field__required">*</span>
                      </label>
                      <input
                        type="text"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleInputChange}
                        className="request-field__textarea"
                        placeholder="Enter project name"
                        required
                      />
                    </div>
                    <div>
                      <label className="request-field__label">
                        Project Type <span className="request-field__required">*</span>
                      </label>
                      <select
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleInputChange}
                        className="request-field__textarea"
                        required
                      >
                        {projectTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="request-field__label">
                      Project Location <span className="request-field__required">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="request-field__textarea"
                      placeholder="Enter complete address (city, state, area)"
                      required
                    />
                  </div>
                  <div>
                    <label className="request-field__label">Project Description</label>
                    <textarea
                      name="projectDescription"
                      value={formData.projectDescription}
                      onChange={handleInputChange}
                      rows={4}
                      className="request-field__textarea"
                      placeholder="Brief description of the project, amenities, unit types, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="form-section">
                <h2 className="form-section__title">Contact Information</h2>
                <div className="form-section__grid--three">
                  <div>
                    <label className="request-field__label">
                      Contact Person Name <span className="request-field__required">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleInputChange}
                      className="request-field__textarea"
                      placeholder="Contact person name"
                      required
                    />
                  </div>
                  <div>
                    <label className="request-field__label">
                      Email Address <span className="request-field__required">*</span>
                    </label>
                    <div className="verification-container">
                      <input
                        type="email"
                        name="contactPersonEmail"
                        value={formData.contactPersonEmail}
                        onChange={handleInputChange}
                        className="request-field__textarea verification-input"
                        placeholder="contact@example.com"
                        disabled={userData?.emailVerified}
                        required
                      />
                      {userData?.emailVerified ? (
                        <span className="verification-status">✓ Verified</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyEmail}
                          className="verification-button"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                    {showEmailOTP && !userData?.emailVerified && (
                      <div className="verification-otp-box">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOTP}
                          onChange={e => setEmailOTP(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="verification-otp-input"
                        />
                        <button
                          type="button"
                          onClick={handleEmailOTPSubmit}
                          className="verification-otp-button"
                        >
                          Submit OTP
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="request-field__label">
                      Phone Number <span className="request-field__required">*</span>
                    </label>
                    <div className="verification-container">
                      <input
                        type="tel"
                        name="contactPersonPhone"
                        value={formData.contactPersonPhone}
                        onChange={handleInputChange}
                        className="request-field__textarea verification-input"
                        placeholder="+91 98765 43210"
                        disabled={userData?.mobileVerified}
                        required
                      />
                      {userData?.mobileVerified ? (
                        <span className="verification-status">✓ Verified</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyMobile}
                          className="verification-button"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                    {showMobileOTP && !userData?.mobileVerified && (
                      <div className="verification-otp-box">
                        <input
                          type="text"
                          maxLength={6}
                          value={mobileOTP}
                          onChange={e => setMobileOTP(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="verification-otp-input"
                        />
                        <button
                          type="button"
                          onClick={handleMobileOTPSubmit}
                          className="verification-otp-button"
                        >
                          Submit OTP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h2 className="form-section__title">Additional Information</h2>
                <div>
                  <label className="request-field__label">Additional Information</label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={3}
                    className="request-field__textarea"
                    placeholder="Any additional information, special requirements, or notes for our team"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="submit-section">
                <button
                  type="submit"
                  disabled={loading || !userData?.emailVerified || !userData?.mobileVerified}
                  className="submit-button"
                >
                  {loading ? (
                    <span className="submit-button__loading">
                      <div className="submit-button__spinner"></div>
                      Submitting Request...
                    </span>
                  ) : (
                    'Submit Project Request'
                  )}
                </button>
                {(!userData?.emailVerified || !userData?.mobileVerified) && (
                  <p className="verification-error">
                    Please verify your email and phone number before submitting
                  </p>
                )}
                <p className="submit-disclaimer">
                  By submitting this request, you agree that Grihome admins will review and contact
                  you for further details.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
