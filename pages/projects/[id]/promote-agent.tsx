import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/cockroachDB/prisma'

interface Project {
  id: string
  name: string
  description: string
}

interface PromoteAgentPageProps {
  project: Project | null
}

export default function PromoteAgentPage({ project }: PromoteAgentPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [duration, setDuration] = useState<number>(30)
  const [isProcessing, setIsProcessing] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date>(new Date())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Calculate expiry date whenever duration changes
    const today = new Date()
    const expiry = new Date(today.getTime() + duration * 24 * 60 * 60 * 1000)
    setExpiryDate(expiry)
  }, [duration])

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <Link href="/projects" className="text-blue-600 hover:text-blue-700">
              Back to Projects
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const handlePurchase = async () => {
    if (!session?.user?.email) {
      toast.error('Please login to continue')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/promote-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration,
        }),
      })

      if (response.ok) {
        toast.success('Successfully added as verified agent!')
        router.push(`/projects/${project.id}`)
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to complete purchase')
      }
    } catch (error) {
      toast.error('Error processing request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentAmount = 0 // Currently free

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Promote as Verified Agent - {project.name}</title>
      </Head>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/projects/${project.id}`}
              className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
            >
              ← Back to Project
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Add Yourself as Verified Agent
            </h1>
            <p className="text-gray-600">Project: {project.name}</p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Verified Agent Benefits</h3>
                  <p className="text-sm text-blue-800">
                    Your profile will be displayed at the top of the agents list with a blue
                    verification badge, increasing your visibility to potential clients.
                  </p>
                </div>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Duration (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter number of days"
              />
              <p className="mt-2 text-sm text-gray-500">
                Choose how long you want to be featured as a verified agent
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{duration} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expiry Date:</span>
                <span className="font-medium text-gray-900">
                  {expiryDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{paymentAmount}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">Pre-launch offer - Free!</p>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={isProcessing || duration < 1}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-md font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Complete Purchase - Get Verified
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By completing this purchase, you agree to our terms and conditions
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const { id } = context.params || {}

    if (!id || typeof id !== 'string') {
      return {
        props: {
          project: null,
        },
      }
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    return {
      props: {
        project: project ? JSON.parse(JSON.stringify(project)) : null,
      },
    }
  } catch (error) {
    return {
      props: {
        project: null,
      },
    }
  }
}
