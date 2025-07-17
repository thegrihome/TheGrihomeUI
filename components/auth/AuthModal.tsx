import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { RootState } from '@/store/store'
import SignupForm from './SignupForm'
import EmailOTPVerification from './EmailOTPVerification'
import MobileOTPVerification from './MobileOTPVerification'
import LoginForm from './LoginForm'

interface AuthModalProps {
  isOpen: boolean
  mode: 'signup' | 'login'
  onClose: () => void
}

export default function AuthModal({ isOpen, mode, onClose }: AuthModalProps) {
  const { signupStep } = useSelector((state: RootState) => state.auth)
  const [caretPosition, setCaretPosition] = useState<{ left: number; show: boolean }>({ left: 50, show: false })

  useEffect(() => {
    if (isOpen) {
      // Calculate caret position based on button
      const buttonId = mode === 'login' ? 'signin-button' : 'signup-button'
      const button = document.getElementById(buttonId)
      
      if (button) {
        const rect = button.getBoundingClientRect()
        const buttonCenter = rect.left + rect.width / 2
        const viewportWidth = window.innerWidth
        const leftPercentage = (buttonCenter / viewportWidth) * 100
        
        setCaretPosition({ 
          left: Math.min(Math.max(leftPercentage, 10), 90), // Keep between 10% and 90%
          show: true 
        })
      }
    } else {
      setCaretPosition({ left: 50, show: false })
    }
  }, [isOpen, mode])

  if (!isOpen) return null

  const renderModal = () => {
    if (mode === 'login') {
      return <LoginForm onClose={onClose} />
    }

    // Signup flow
    if (signupStep === 'form') {
      return <SignupForm onClose={onClose} />
    }

    if (signupStep === 'email-otp') {
      return <EmailOTPVerification onClose={onClose} />
    }

    if (signupStep === 'mobile-otp') {
      return <MobileOTPVerification onClose={onClose} />
    }

    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Caret */}
      {caretPosition.show && (
        <div 
          className="fixed top-16 z-50 pointer-events-none"
          style={{ left: `${caretPosition.left}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800" />
        </div>
      )}
      
      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="pointer-events-auto">
          {renderModal()}
        </div>
      </div>
    </>
  )
}