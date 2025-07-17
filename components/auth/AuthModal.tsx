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
  const [modalPosition, setModalPosition] = useState<{ 
    left: number; 
    top: number; 
    caretLeft: number; 
    show: boolean 
  }>({ left: 50, top: 200, caretLeft: 50, show: false })

  useEffect(() => {
    if (isOpen) {
      // Calculate modal position based on button
      const buttonId = mode === 'login' ? 'signin-button' : 'signup-button'
      const button = document.getElementById(buttonId)
      
      if (button) {
        const rect = button.getBoundingClientRect()
        const buttonCenter = rect.left + rect.width / 2
        const buttonBottom = rect.bottom
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Calculate caret position (center of button)
        const caretLeftPercentage = (buttonCenter / viewportWidth) * 100
        
        // Modal positioning
        let modalLeft = buttonCenter
        let modalTop = buttonBottom + 20 // 20px gap below button + caret
        
        // Ensure modal doesn't go off-screen horizontally
        const modalWidth = 400 // approximate modal width
        if (modalLeft + modalWidth / 2 > viewportWidth - 20) {
          modalLeft = viewportWidth - modalWidth / 2 - 20
        }
        if (modalLeft - modalWidth / 2 < 20) {
          modalLeft = modalWidth / 2 + 20
        }
        
        // Ensure modal doesn't go off-screen vertically
        const modalHeight = 600 // approximate modal height
        if (modalTop + modalHeight > viewportHeight - 20) {
          modalTop = Math.max(20, viewportHeight - modalHeight - 20)
        }
        
        setModalPosition({ 
          left: modalLeft,
          top: modalTop,
          caretLeft: Math.min(Math.max(caretLeftPercentage, 5), 95), // Keep caret between 5% and 95%
          show: true 
        })
      }
    } else {
      setModalPosition({ left: 50, top: 200, caretLeft: 50, show: false })
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
      {modalPosition.show && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{ 
            left: `${modalPosition.caretLeft}%`, 
            top: `${modalPosition.top - 12}px`, // Position caret just above modal
            transform: 'translateX(-50%)' 
          }}
        >
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800" />
        </div>
      )}
      
      {/* Modal Content */}
      {modalPosition.show && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${modalPosition.left}px`,
            top: `${modalPosition.top}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="pointer-events-auto">
            {renderModal()}
          </div>
        </div>
      )}
    </>
  )
}