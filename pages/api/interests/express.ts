import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import { sendInterestNotification, sendProjectInterestNotification } from '@/lib/resend/email'
import { sendProjectInterestWhatsApp } from '@/lib/msg91/whatsapp'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { projectId, propertyId, message } = req.body

    if (!projectId && !propertyId) {
      return res.status(400).json({ error: 'Either projectId or propertyId is required' })
    }

    if (projectId && propertyId) {
      return res
        .status(400)
        .json({ error: 'Cannot express interest in both project and property simultaneously' })
    }

    // Check if user has already expressed interest
    const existingInterest = await prisma.interest.findFirst({
      where: {
        userId: session.user.id,
        ...(projectId ? { projectId } : { propertyId }),
      },
    })

    if (existingInterest) {
      return res.status(400).json({ error: 'Interest already expressed' })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        username: true,
        emailVerified: true,
        mobileVerified: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user has at least one verified contact method
    if (!user.emailVerified && !user.mobileVerified) {
      return res
        .status(403)
        .json({ error: 'Please verify your email or mobile number before expressing interest' })
    }

    // Get project or property details for email
    let projectOrPropertyName = ''

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          name: true,
        },
      })

      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      projectOrPropertyName = project.name
    }

    // Variables for email notification
    let sellerName = ''
    let sellerEmail = ''
    let sellerMobile = ''
    let isSellerEmailVerified = false
    let isSellerMobileVerified = false

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          project: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              email: true,
              name: true,
              phone: true,
              emailVerified: true,
              mobileVerified: true,
            },
          },
        },
      })

      if (!property) {
        return res.status(404).json({ error: 'Property not found' })
      }

      // Check if user is trying to express interest in their own property
      if (property.user.email === user.email) {
        return res.status(400).json({ error: 'You cannot express interest in your own property' })
      }

      // Get property title from propertyDetails JSON
      const propertyDetails = property.propertyDetails as { title?: string } | null
      projectOrPropertyName =
        propertyDetails?.title || property.project?.name || property.streetAddress

      // Get seller info from property owner
      sellerName = property.user.name || 'Property Owner'
      sellerEmail = property.user.email
      sellerMobile = property.user.phone || ''
      isSellerEmailVerified = property.user.emailVerified !== null
      isSellerMobileVerified = property.user.mobileVerified !== null
    }

    // Create interest record
    const interest = await prisma.interest.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        propertyId: propertyId || null,
        message: message || null,
      },
    })

    // Send email notifications via MSG91
    // Only send for property interests (not projects for now)
    if (propertyId && sellerEmail) {
      try {
        await sendInterestNotification({
          propertyName: projectOrPropertyName,
          seller: {
            name: sellerName,
            email: sellerEmail,
            mobile: sellerMobile,
            isEmailVerified: isSellerEmailVerified,
            isMobileVerified: isSellerMobileVerified,
          },
          buyer: {
            name: user.name || user.username || 'Interested Buyer',
            email: user.email,
            mobile: user.phone || '',
            isEmailVerified: user.emailVerified !== null,
            isMobileVerified: user.mobileVerified !== null,
          },
        })
      } catch {
        // Don't fail the request if email fails, just continue
      }
    }

    // Send notifications for project interest (to admin only)
    if (projectId && projectOrPropertyName) {
      try {
        const userEmail = user.emailVerified ? user.email : 'Not verified'
        const userMobile = user.mobileVerified && user.phone ? user.phone : 'Not verified'

        // Send email to admin via Resend
        await sendProjectInterestNotification({
          projectName: projectOrPropertyName,
          user: {
            name: user.name || user.username || 'Interested User',
            email: user.email,
            mobile: user.phone || '',
            isEmailVerified: user.emailVerified !== null,
            isMobileVerified: user.mobileVerified !== null,
          },
        })

        // Send WhatsApp to admin via MSG91
        await sendProjectInterestWhatsApp({
          projectName: projectOrPropertyName,
          userName: user.name || user.username || 'Interested User',
          userEmail,
          userMobile,
        })
      } catch {
        // Don't fail the request if notifications fail, just continue
      }
    }

    res.status(201).json({
      success: true,
      interest: {
        id: interest.id,
        createdAt: interest.createdAt,
      },
    })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
