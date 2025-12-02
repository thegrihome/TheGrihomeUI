import React, { useState, useEffect } from 'react'
import { NextSeo } from 'next-seo'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface UserData {
  name: string
  email: string
  phone: string
  emailVerified: string | null
  mobileVerified: string | null
}

interface ProjectRequestForm {
  builderName: string
  projectName: string
  location: string
  contactPersonFirstName: string
  contactPersonLastName: string
  contactPersonEmail: string
  contactPersonPhone: string
  builderWebsite: string
  projectDescription: string
  projectType: string
  additionalInfo: string
}

export default function AddProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showEmailOTP, setShowEmailOTP] = useState(false)
  const [showMobileOTP, setShowMobileOTP] = useState(false)
  const [emailOTP, setEmailOTP] = useState('')
  const [mobileOTP, setMobileOTP] = useState('')
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifyingOTP, setVerifyingOTP] = useState(false)

  const [formData, setFormData] = useState<ProjectRequestForm>({
    builderName: '',
    projectName: '',
    location: '',
    contactPersonFirstName: '',
    contactPersonLastName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    builderWebsite: '',
    projectDescription: '',
    projectType: 'RESIDENTIAL',
    additionalInfo: '',
  })

  const projectTypes = [
    { value: 'RESIDENTIAL', label: 'Residential', icon: '🏠' },
    { value: 'COMMERCIAL', label: 'Commercial', icon: '🏢' },
    { value: 'MIXED_USE', label: 'Mixed Use', icon: '🏛️' },
    { value: 'INDUSTRIAL', label: 'Industrial', icon: '🏭' },
  ]

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchUserData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/info?email=${session?.user?.email}`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
        // Auto-populate form - split name into first and last
        const nameParts = (data.user.name || '').trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        setFormData(prev => ({
          ...prev,
          contactPersonFirstName: firstName,
          contactPersonLastName: lastName,
          contactPersonEmail: data.user.email || '',
          contactPersonPhone: data.user.phone || '',
        }))
      }
    } catch (error) {
      // Error fetching user data
    }
  }

  const handleSendEmailOTP = async () => {
    setSendingOTP(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowEmailOTP(true)
      toast.success('OTP sent to your email!')
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleVerifyEmailOTP = async () => {
    setVerifyingOTP(true)
    try {
      const result = await signIn('credentials', {
        identifier: formData.contactPersonEmail,
        otp: emailOTP,
        loginType: 'otp',
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid OTP')
      } else {
        toast.success('Email verified successfully!')
        await fetchUserData()
        setShowEmailOTP(false)
        setEmailOTP('')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setVerifyingOTP(false)
    }
  }

  const handleSendMobileOTP = async () => {
    setSendingOTP(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowMobileOTP(true)
      toast.success('OTP sent to your mobile!')
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleVerifyMobileOTP = async () => {
    setVerifyingOTP(true)
    try {
      const result = await signIn('credentials', {
        identifier: formData.contactPersonPhone,
        otp: mobileOTP,
        loginType: 'otp',
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid OTP')
      } else {
        toast.success('Mobile verified successfully!')
        await fetchUserData()
        setShowMobileOTP(false)
        setMobileOTP('')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setVerifyingOTP(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const requiredFields = [
      'builderName',
      'projectName',
      'location',
      'contactPersonFirstName',
      'contactPersonLastName',
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.contactPersonEmail)) {
      toast.error('Please enter a valid email address')
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
      router.push('/projects')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit project request')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NextSeo
        title="Add Project Request - Grihome"
        description="Request to add a new project to Grihome"
        canonical="https://grihome.vercel.app/projects/add-project"
      />

      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Add Project Request</h1>
            <p className="text-gray-600 mt-2">
              Submit a request to add a new project to Grihome. Our team will review and contact
              you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Builder Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Builder Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Builder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="builderName"
                    value={formData.builderName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter builder/developer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Builder Website/URL
                  </label>
                  <input
                    type="url"
                    name="builderWebsite"
                    value={formData.builderWebsite}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://builder-website.com"
                  />
                </div>
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Project Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {projectTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter complete address (city, state, area)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Brief description of the project, amenities, unit types, etc."
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPersonFirstName"
                      value={formData.contactPersonFirstName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPersonLastName"
                      value={formData.contactPersonLastName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                    {userData?.emailVerified ? (
                      <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                    ) : (
                      <span className="ml-2 text-red-600 text-xs">✗ Not Verified</span>
                    )}
                  </label>
                  <input
                    type="email"
                    name="contactPersonEmail"
                    value={formData.contactPersonEmail}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    required
                  />
                  {!userData?.emailVerified && (
                    <div className="mt-2">
                      {!showEmailOTP ? (
                        <button
                          type="button"
                          onClick={handleSendEmailOTP}
                          disabled={sendingOTP}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          {sendingOTP ? 'Sending OTP...' : 'Send Verification OTP'}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={emailOTP}
                            onChange={e => setEmailOTP(e.target.value)}
                            placeholder="Enter OTP"
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyEmailOTP}
                            disabled={verifyingOTP || !emailOTP}
                            className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {verifyingOTP ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                    {userData?.mobileVerified ? (
                      <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                    ) : (
                      <span className="ml-2 text-red-600 text-xs">✗ Not Verified</span>
                    )}
                  </label>
                  <input
                    type="tel"
                    name="contactPersonPhone"
                    value={formData.contactPersonPhone}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    required
                  />
                  {!userData?.mobileVerified && (
                    <div className="mt-2">
                      {!showMobileOTP ? (
                        <button
                          type="button"
                          onClick={handleSendMobileOTP}
                          disabled={sendingOTP}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          {sendingOTP ? 'Sending OTP...' : 'Send Verification OTP'}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={mobileOTP}
                            onChange={e => setMobileOTP(e.target.value)}
                            placeholder="Enter OTP"
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyMobileOTP}
                            disabled={verifyingOTP || !mobileOTP}
                            className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {verifyingOTP ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Any additional information, special requirements, or notes for our team"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !userData?.emailVerified || !userData?.mobileVerified}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Project Request'}
              </button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              By submitting this request, you agree that Grihome admins will review and contact you
              for further details.
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
