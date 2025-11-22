import React, { useState, useEffect } from 'react'
import { NextSeo } from 'next-seo'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface BuilderForm {
  name: string
  description: string
  website: string
  address: string
  emails: string
  phones: string
  logoBase64: string
}

export default function AddBuilderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState<BuilderForm>({
    name: '',
    description: '',
    website: '',
    address: '',
    emails: '',
    phones: '',
    logoBase64: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please sign in to add a builder')
      router.push('/login')
    }
  }, [status, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLogoPreview(base64String)
      setFormData(prev => ({
        ...prev,
        logoBase64: base64String,
      }))
    }
    reader.readAsDataURL(file)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Builder name is required')
      return false
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      toast.error('Please enter a valid website URL (starting with http:// or https://)')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('/api/builders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Builder added successfully!')
        router.push(`/builders/${data.builder.id}`)
      } else {
        toast.error(data.message || 'Failed to add builder')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NextSeo title="Add Builder | Grihome" description="Add a new builder to Grihome" />

      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Builder</h1>
          <p className="text-gray-600 mb-6">
            Add a new builder or real estate developer to the platform
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Builder Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Builder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter builder name"
                required
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Builder Logo</label>
              <div className="flex items-start gap-4">
                {logoPreview && (
                  <div className="flex-shrink-0">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={100}
                      height={100}
                      className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-gray-50 p-2"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-xs text-gray-500
                      file:mr-3 file:py-1 file:px-2
                      file:rounded file:border-0
                      file:text-xs file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">(PNG, JPG, GIF up to 5MB)</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the builder"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Website URL</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Builder's office address"
              />
            </div>

            {/* Email Addresses */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Addresses</label>
              <input
                type="text"
                name="emails"
                value={formData.emails}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter multiple email addresses separated by commas
              </p>
            </div>

            {/* Phone Numbers */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Numbers</label>
              <input
                type="text"
                name="phones"
                value={formData.phones}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 12345 67890, +91 98765 43210"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter multiple phone numbers separated by commas
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
