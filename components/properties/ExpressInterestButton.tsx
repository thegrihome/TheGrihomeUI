import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ExpressInterestButtonProps {
  projectId?: string
  propertyId?: string
  projectName?: string
  propertyName?: string
  onAuthRequired: () => void
}

export default function ExpressInterestButton({
  projectId,
  propertyId,
  projectName,
  propertyName,
  onAuthRequired,
}: ExpressInterestButtonProps) {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const user = session?.user
  const [isExpressing, setIsExpressing] = useState(false)
  const [hasExpressed, setHasExpressed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingState, setIsCheckingState] = useState(false)

  // Check existing interest state when user is authenticated
  useEffect(() => {
    const checkExistingInterest = async () => {
      if (!isAuthenticated || (!projectId && !propertyId)) {
        return
      }

      setIsCheckingState(true)

      try {
        const params = new URLSearchParams()
        if (projectId) params.set('projectId', projectId)
        if (propertyId) params.set('propertyId', propertyId)

        const response = await fetch(`/api/interests/check?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setHasExpressed(data.hasExpressed)
        }
      } catch (error) {
        // Silently fail - not critical
      } finally {
        setIsCheckingState(false)
      }
    }

    checkExistingInterest()
  }, [isAuthenticated, projectId, propertyId])

  const handleExpressInterest = async () => {
    if (!isAuthenticated) {
      onAuthRequired()
      return
    }

    if (hasExpressed) {
      return
    }

    setIsExpressing(true)
    setError(null)

    try {
      const response = await fetch('/api/interests/express', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          propertyId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setHasExpressed(true)
      } else {
        setError(data.error || 'Failed to express interest')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsExpressing(false)
    }
  }

  const buttonText = () => {
    if (isCheckingState) return 'Loading...'
    if (isExpressing) return 'Sending...'
    if (hasExpressed) return 'Interest Sent'
    return 'Express Interest'
  }

  const buttonIcon = () => {
    if (isCheckingState || isExpressing) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )
    }

    if (hasExpressed) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleExpressInterest}
        disabled={isCheckingState || isExpressing || hasExpressed}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          hasExpressed
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : isCheckingState || isExpressing
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
        }`}
      >
        {buttonIcon()}
        {buttonText()}
      </button>

      {error && <p className="text-sm text-red-600 text-center max-w-xs">{error}</p>}
    </div>
  )
}
