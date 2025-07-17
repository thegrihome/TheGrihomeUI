import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setLoading, setError, setSignupStep, verifyMobile } from '@/store/slices/authSlice'
import { authService } from '@/services/authService'

interface MobileOTPVerificationProps {
  onClose: () => void
}

export default function MobileOTPVerification({ onClose }: MobileOTPVerificationProps) {
  const dispatch = useDispatch()
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth)
  
  const [otp, setOtp] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.mobile || !otp) return
    
    dispatch(setLoading(true))
    dispatch(setError(null))
    
    try {
      const isValid = await authService.verifyMobileOTP({ mobile: user.mobile, otp })
      
      if (isValid) {
        dispatch(verifyMobile())
        dispatch(setSignupStep('completed'))
        
        // Close modal after successful verification
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        dispatch(setError('Invalid OTP. Please try again.'))
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'OTP verification failed'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleResendOTP = async () => {
    if (!user?.mobile || !canResend) return
    
    dispatch(setLoading(true))
    dispatch(setError(null))
    
    try {
      await authService.sendMobileOTP(user.mobile)
      setTimeLeft(300)
      setCanResend(false)
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to resend OTP'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto my-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Mobile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a verification code to
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {user?.mobile}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        {user?.isEmailVerified && user?.isMobileVerified && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-center">
            <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Account verified successfully! Welcome to Grihome.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center text-lg tracking-widest"
              placeholder="123456"
              maxLength={6}
            />
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {timeLeft > 0 ? (
              <p>Code expires in {formatTime(timeLeft)}</p>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading || !canResend}
                className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6 || (user?.isEmailVerified && user?.isMobileVerified)}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? 'Verifying...' : 'Verify Mobile'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Use OTP: <span className="font-mono font-bold">123456</span> for testing</p>
        </div>
    </div>
  )
}