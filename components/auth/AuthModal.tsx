import { useSelector } from 'react-redux'
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

  if (!isOpen) return null

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