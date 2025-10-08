import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

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
    let builderEmail = 'thegrihome@gmail.com' // Default fallback

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          builder: {
            select: {
              name: true,
              contactInfo: true,
            },
          },
        },
      })

      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      projectOrPropertyName = project.name

      // Try to get builder email from contactInfo JSON
      if (project.builder.contactInfo && typeof project.builder.contactInfo === 'object') {
        const contactInfo = project.builder.contactInfo as any
        if (contactInfo.email) {
          builderEmail = contactInfo.email
        }
      }
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          project: {
            select: {
              name: true,
            },
          },
          builder: {
            select: {
              name: true,
              contactInfo: true,
            },
          },
          user: {
            select: {
              email: true,
              name: true,
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

      projectOrPropertyName = property.project?.name || `Property at ${property.streetAddress}`

      // Use property owner's email as primary recipient
      builderEmail = property.user.email

      // Try to get builder email from contactInfo JSON as secondary
      if (property.builder?.contactInfo && typeof property.builder.contactInfo === 'object') {
        const contactInfo = property.builder.contactInfo as any
        if (contactInfo.email) {
          builderEmail = contactInfo.email
        }
      }
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

    // Send email notification
    const emailSubject = `${user.username || user.name} is interested in your property: ${projectOrPropertyName}`

    // Build contact info with only verified details
    const verifiedContactInfo = []
    verifiedContactInfo.push(`<li><strong>Name:</strong> ${user.name || user.username}</li>`)
    if (user.emailVerified) {
      verifiedContactInfo.push(`<li><strong>Email:</strong> ${user.email}</li>`)
    }
    if (user.mobileVerified && user.phone) {
      verifiedContactInfo.push(`<li><strong>Phone:</strong> ${user.phone}</li>`)
    }

    const emailBody = `
      <h2>New Interest in Your Property</h2>

      <p>${user.name || user.username} is interested in your property: <strong>${projectOrPropertyName}</strong></p>

      <h3>Contact Information:</h3>
      <ul>
        ${verifiedContactInfo.join('\n        ')}
      </ul>

      <p>Date: ${new Date().toLocaleDateString()}</p>

      <hr>
      <p><small>This is an automated message from TheGrihome platform.</small></p>
    `

    try {
      // Send email to property owner and TheGrihome
      const recipients = ['thegrihome@gmail.com']
      if (builderEmail && builderEmail !== 'thegrihome@gmail.com') {
        recipients.push(builderEmail)
      }

      await resend.emails.send({
        from: 'TheGrihome <noreply@grihome.com>',
        to: recipients,
        subject: emailSubject,
        html: emailBody,
      })
    } catch (emailError) {
      // Don't fail the request if email fails, just continue
    }

    res.status(201).json({
      success: true,
      interest: {
        id: interest.id,
        createdAt: interest.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
