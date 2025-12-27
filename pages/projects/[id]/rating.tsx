import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

interface ExistingReview {
  id: string
  rating: number
  review: string
  userId: string
}

export default function ProjectRatingPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session, status } = useSession()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null)
  const [projectName, setProjectName] = useState('')
  const [fetchingData, setFetchingData] = useState(true)

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please log in to write a review')
      router.push('/login')
    }
  }, [status, router])

  // Redirect unverified users
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const isVerified = session.user.isEmailVerified || session.user.isMobileVerified
      if (!isVerified) {
        toast.error('Please verify your email or mobile to write a review')
        router.push('/auth/userinfo')
      }
    }
  }, [status, session, router])

  // Fetch existing review if user has already reviewed
  useEffect(() => {
    if (!id || !session) return

    const fetchExisting = async () => {
      try {
        const res = await fetch(`/api/projects/${id}/reviews`)
        if (res.ok) {
          const data = await res.json()
          if (data.userHasReviewed && session.user?.id) {
            const userReview = data.reviews.find(
              (r: ExistingReview) => r.userId === session.user.id
            )
            if (userReview) {
              setRating(userReview.rating)
              setReview(userReview.review)
              setExistingReview(userReview)
            }
          }
        }
      } catch (error) {
        // Silent fail - user can still submit review
      } finally {
        setFetchingData(false)
      }
    }

    fetchExisting()
  }, [id, session])

  // Fetch project details
  useEffect(() => {
    if (!id) return

    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`)
        if (res.ok) {
          const data = await res.json()
          setProjectName(data.name || data.project?.name || '')
        }
      } catch (error) {
        // Silent fail - project name optional
      }
    }

    fetchProject()
  }, [id])

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (review.trim().length < 10) {
      toast.error('Review must be at least 10 characters')
      return
    }

    if (review.length > 500) {
      toast.error('Review must not exceed 500 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review: review.trim() }),
      })

      if (res.ok) {
        toast.success(existingReview ? 'Review updated!' : 'Review submitted!')
        router.push(`/projects/${id}`)
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to submit review')
      }
    } catch (error) {
      toast.error('Error submitting review')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || fetchingData) {
    return (
      <div className="rating-page-container">
        <Header />
        <main className="rating-page-content">
          <div className="rating-card">
            <p className="text-center text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="rating-page-container">
      <Header />

      <main className="rating-page-content">
        <div className="rating-card">
          <h1 className="rating-title">{existingReview ? 'Edit Your Review' : 'Write a Review'}</h1>

          {projectName && <p className="project-name">{projectName}</p>}

          {/* Star Rating Input */}
          <div className="rating-section">
            <label className="rating-label">Your Rating</label>
            <div className="stars-input">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="star-button"
                >
                  <svg
                    className={`star-input-icon ${
                      star <= (hoverRating || rating) ? 'filled' : 'empty'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="rating-selected">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Review Text */}
          <div className="review-section">
            <label className="review-label">Your Review</label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              className="review-textarea"
              rows={5}
              placeholder="Share your experience with this project..."
              minLength={10}
              maxLength={500}
            />
            <span className="review-char-count">{review.length} / 500 characters</span>
          </div>

          {/* Action Buttons */}
          <div className="rating-actions">
            <button onClick={() => router.back()} className="cancel-button" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="submit-button"
              disabled={loading || rating === 0 || review.trim().length < 10}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
