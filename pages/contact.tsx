import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import validator from 'validator'
import CountryCodeDropdown from '@/components/CountryCodeDropdown'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function ContactPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [countryCode, setCountryCode] = useState('+91')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    setMounted(true)
  }, [])

  const isValidEmail = (email: string): boolean => {
    return validator.isEmail(email.trim())
  }

  const isValidMobile = (mobile: string): boolean => {
    const cleanedMobile = mobile.replace(/\D/g, '')
    if (cleanedMobile.length < 7 || cleanedMobile.length > 15) {
      return false
    }
    if (/^0+$/.test(cleanedMobile)) {
      return false
    }
    return validator.isMobilePhone(cleanedMobile, 'any', { strictMode: false })
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !isValidMobile(formData.phone)) {
      errors.phone = 'Please enter a valid mobile number (7-15 digits)'
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let processedValue = value

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '')
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }))

    if (formErrors[name]) {
      setFormErrors(prev => {
        const { [name]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone ? `${countryCode}${formData.phone}` : '',
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setToast({
          show: true,
          message: "Thank you for your message! We'll get back to you soon.",
          type: 'success',
        })
        setFormData({ name: '', email: '', phone: '', message: '' })
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
      } else {
        setToast({
          show: true,
          message: result.message || 'Failed to send message. Please try again.',
          type: 'error',
        })
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 5000)
      }
    } catch (error) {
      setToast({
        show: true,
        message: 'Something went wrong. Please try again.',
        type: 'error',
      })
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
              <p className="text-gray-600">
                Have a question or need help? We&apos;d love to hear from you.
              </p>
            </div>

            {toast.show && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  toast.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {toast.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Your full name"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="your.email@example.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <CountryCodeDropdown
                    value={countryCode}
                    onChange={setCountryCode}
                    className="mr-2"
                  />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Phone number"
                    maxLength={15}
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.message ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tell us how we can help you..."
                />
                {formErrors.message && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
