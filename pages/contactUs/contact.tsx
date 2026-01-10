import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import validator from 'validator'
import CountryCodeDropdown from '@/components/auth/CountryCodeDropdown'
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
  const [termsAccepted, setTermsAccepted] = useState(false)

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

    if (!termsAccepted) {
      setToast({
        show: true,
        message: 'Please accept the Terms and Conditions',
        type: 'error',
      })
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 5000)
      return
    }

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
    <div className="contact-page">
      <Header />
      <div className="contact-page__content">
        <div className="contact-container">
          <div className="contact-card">
            <div className="contact-header">
              <h1 className="contact-header__title">Contact Us</h1>
              <p className="contact-header__subtitle">
                Have a question or need help? We&apos;d love to hear from you.
              </p>
            </div>

            {toast.show && (
              <div
                className={`contact-toast ${
                  toast.type === 'success' ? 'contact-toast--success' : 'contact-toast--error'
                }`}
              >
                {toast.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div>
                <label htmlFor="name" className="contact-form__label">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`contact-form__input ${
                    formErrors.name ? 'contact-form__input--error' : ''
                  }`}
                  placeholder="Your full name"
                />
                {formErrors.name && <p className="contact-form__error">{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="contact-form__label">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`contact-form__input ${
                    formErrors.email ? 'contact-form__input--error' : ''
                  }`}
                  placeholder="your.email@example.com"
                />
                {formErrors.email && <p className="contact-form__error">{formErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="contact-form__label">
                  Phone Number
                </label>
                <div className="contact-form__phone-group">
                  <CountryCodeDropdown value={countryCode} onChange={setCountryCode} />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`contact-form__phone-input ${
                      formErrors.phone ? 'contact-form__phone-input--error' : ''
                    }`}
                    placeholder="Phone number"
                    maxLength={15}
                  />
                </div>
                {formErrors.phone && <p className="contact-form__error">{formErrors.phone}</p>}
              </div>

              <div>
                <label htmlFor="message" className="contact-form__label">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`contact-form__textarea ${
                    formErrors.message ? 'contact-form__textarea--error' : ''
                  }`}
                  placeholder="Tell us how we can help you..."
                />
                {formErrors.message && <p className="contact-form__error">{formErrors.message}</p>}
              </div>

              <div className="contact-form__terms">
                <label className="contact-form__terms-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="contact-form__terms-checkbox"
                  />
                  <span>
                    I agree to Grihome{' '}
                    <Link
                      href="/legal/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-form__terms-link"
                    >
                      Terms and Conditions
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.message.trim() ||
                  !termsAccepted
                }
                className={`contact-form__submit ${
                  isSubmitting ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.message.trim() ||
                  !termsAccepted
                    ? 'contact-form__submit--disabled'
                    : 'contact-form__submit--active'
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
