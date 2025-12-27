import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { checkUserVerification } from '@/lib/utils/verify-user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const projectId = id as string

  if (!projectId) {
    return res.status(400).json({ message: 'Project ID is required' })
  }

  // GET: Fetch all reviews for a project
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions)

      // Fetch project to get averageRating and reviewCount
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          averageRating: true,
          reviewCount: true,
        },
      })

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Fetch all reviews
      const reviews = await prisma.projectReview.findMany({
        where: { projectId },
        select: {
          id: true,
          rating: true,
          review: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Check if current user has reviewed (if session exists)
      let userHasReviewed = false
      if (session?.user?.id) {
        userHasReviewed = reviews.some(review => review.userId === session.user.id)
      }

      return res.status(200).json({
        reviews,
        averageRating: project.averageRating || 0,
        reviewCount: project.reviewCount || 0,
        userHasReviewed,
      })
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch reviews' })
    }
  }

  // POST: Submit or update a review
  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions)

      if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' })
      }

      // Check verification status
      const verificationCheck = await checkUserVerification(session.user.id)
      if (!verificationCheck.isVerified) {
        return res.status(403).json({ message: verificationCheck.message })
      }

      const { rating, review } = req.body

      // Validation
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' })
      }

      if (!review || typeof review !== 'string' || review.trim().length < 10) {
        return res.status(400).json({ message: 'Review must be at least 10 characters' })
      }

      if (review.length > 500) {
        return res.status(400).json({ message: 'Review must not exceed 500 characters' })
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Upsert review (create if doesn't exist, update if exists)
      const upsertedReview = await prisma.projectReview.upsert({
        where: {
          projectId_userId: {
            projectId,
            userId: session.user.id,
          },
        },
        create: {
          projectId,
          userId: session.user.id,
          rating,
          review: review.trim(),
        },
        update: {
          rating,
          review: review.trim(),
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      })

      // Recalculate average rating and count
      const allReviews = await prisma.projectReview.findMany({
        where: { projectId },
        select: { rating: true },
      })

      const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0)
      const averageRating = allReviews.length > 0 ? totalRatings / allReviews.length : 0
      const reviewCount = allReviews.length

      // Update project with new average rating and count
      await prisma.project.update({
        where: { id: projectId },
        data: {
          averageRating,
          reviewCount,
        },
      })

      return res.status(200).json({
        success: true,
        review: upsertedReview,
        averageRating,
        reviewCount,
      })
    } catch (error) {
      return res.status(500).json({ message: 'Failed to submit review' })
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' })
}
