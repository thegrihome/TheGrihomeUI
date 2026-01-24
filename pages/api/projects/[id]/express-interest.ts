import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id: projectId } = req.query
    const { message: userMessage } = req.body

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    // Get user details including verification status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        emailVerified: true,
        mobileVerified: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if user has verified at least one contact method
    if (!user.emailVerified && !user.mobileVerified) {
      return res.status(400).json({
        message: 'Please verify your email or mobile number to express interest',
      })
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        builder: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if user has already expressed interest
    const existingInterest = await prisma.interest.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
    })

    if (existingInterest) {
      return res
        .status(400)
        .json({ message: 'You have already expressed interest in this project' })
    }

    // Create interest record
    const interest = await prisma.interest.create({
      data: {
        userId: user.id,
        projectId,
        message: userMessage || null,
      },
    })

    // Send email via Resend with only verified contact info
    const emailSubject = `User has expressed interest in ${project.name}`
    const emailBody = `
      <h2>New Interest in Project</h2>

      <p>A user has expressed interest in the project: <strong>${project.name}</strong> by ${project.builder.name}</p>

      <h3>User Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${user.name || 'N/A'}</li>
        <li><strong>Username:</strong> ${user.username}</li>
        ${user.emailVerified ? `<li><strong>Email:</strong> ${user.email} ✓</li>` : ''}
        ${user.mobileVerified && user.phone ? `<li><strong>Mobile:</strong> ${user.phone} ✓</li>` : ''}
      </ul>

      ${userMessage ? `<h3>Message:</h3><p>${userMessage}</p>` : ''}

      <p><strong>Project:</strong> ${project.name}</p>
      <p><strong>Builder:</strong> ${project.builder.name}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>

      <hr>
      <p><small>This is an automated message from Zillfin platform. Only verified contact information is included.</small></p>
    `

    try {
      await resend.emails.send({
        from: 'Zillfin <noreply@grihome.com>',
        to: ['thegrihome@gmail.com'],
        subject: emailSubject,
        html: emailBody,
      })
    } catch (emailError) {
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      message: 'Interest expressed successfully',
      interest: {
        id: interest.id,
        createdAt: interest.createdAt,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
