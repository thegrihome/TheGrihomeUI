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
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
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
        },
      })

      if (!property) {
        return res.status(404).json({ error: 'Property not found' })
      }

      projectOrPropertyName = property.project?.name || `Property at ${property.streetAddress}`

      // Try to get builder email from contactInfo JSON
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
    const emailSubject = `[Expression of Interest] ${user.name || user.username} is interested in ${projectOrPropertyName}`

    const emailBody = `
      <h2>New Expression of Interest</h2>
      
      <h3>User Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${user.name || user.username}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Phone:</strong> ${user.phone || 'Not provided'}</li>
        <li><strong>Username:</strong> ${user.username}</li>
      </ul>
      
      <h3>Interest Details:</h3>
      <ul>
        <li><strong>Property/Project:</strong> ${projectOrPropertyName}</li>
        <li><strong>Type:</strong> ${projectId ? 'Project' : 'Property'}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      
      ${
        message
          ? `
      <h3>Message from User:</h3>
      <p>${message}</p>
      `
          : ''
      }
      
      <hr>
      <p><small>This email was sent automatically from TheGrihome platform.</small></p>
    `

    try {
      await resend.emails.send({
        from: 'TheGrihome <noreply@grihome.com>',
        to: ['thegrihome@gmail.com'],
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
