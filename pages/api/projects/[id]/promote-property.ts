import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { sendProjectTransactionNotification } from '@/lib/msg91/email'
import { checkUserVerification } from '@/lib/utils/verify-user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const { id: projectId } = req.query
    const { propertyId, duration = 14 } = req.body

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' })
    }

    // Validate duration
    const days = parseInt(String(duration))
    if (isNaN(days) || days < 1 || days > 14) {
      return res.status(400).json({ message: 'Duration must be between 1 and 14 days' })
    }

    // Get user with verification details for email notification
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        mobileVerified: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get project name for email notification
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Verify user owns the property and it's part of the project
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        projectId,
        userId: user.id,
        listingStatus: 'ACTIVE',
      },
    })

    if (!property) {
      return res
        .status(403)
        .json({ message: 'Property not found or you do not have permission to promote it' })
    }

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + days)

    // Payment amount is 0 for now
    const totalAmount = 0

    // Check if ProjectProperty record exists
    const existingProjectProperty = await prisma.projectProperty.findUnique({
      where: {
        projectId_propertyId: {
          projectId,
          propertyId,
        },
      },
    })

    let projectProperty
    if (existingProjectProperty) {
      // Update existing record
      projectProperty = await prisma.projectProperty.update({
        where: { id: existingProjectProperty.id },
        data: {
          isPromoted: true,
          promotionStartDate: startDate,
          promotionEndDate: endDate,
          promotionPaymentAmount: totalAmount,
        },
      })
    } else {
      // Create new record
      projectProperty = await prisma.projectProperty.create({
        data: {
          projectId,
          propertyId,
          isPromoted: true,
          promotionStartDate: startDate,
          promotionEndDate: endDate,
          promotionPaymentAmount: totalAmount,
        },
      })
    }

    // Send email notification
    let emailStatus = { userEmailSent: false, adminEmailSent: false }
    try {
      emailStatus = await sendProjectTransactionNotification({
        projectName: project.name,
        user: {
          name: user.name || 'Property Owner',
          email: user.email,
          mobile: user.phone || '',
          isEmailVerified: user.emailVerified !== null,
          isMobileVerified: user.mobileVerified !== null,
        },
        transaction: {
          type: 'Property Promotion',
          duration: `${days} days`,
          amount: totalAmount === 0 ? 'Free' : `₹${totalAmount}`,
        },
      })
    } catch {
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      message: 'Property promoted successfully',
      promotion: {
        id: projectProperty.id,
        startDate: projectProperty.promotionStartDate,
        endDate: projectProperty.promotionEndDate,
        totalAmount: projectProperty.promotionPaymentAmount,
        totalDays: days,
      },
      emailStatus,
    })
  } catch {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
