import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const {
      builderName,
      projectName,
      location,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      builderWebsite,
      projectDescription,
      projectType,
      additionalInfo,
    } = req.body

    // Validate required fields
    if (
      !builderName ||
      !projectName ||
      !location ||
      !contactPersonName ||
      !contactPersonEmail ||
      !contactPersonPhone ||
      !projectType
    ) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactPersonEmail)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Create project request in database
    const projectRequest = await prisma.projectRequest.create({
      data: {
        userId: session.user.id,
        builderName,
        projectName,
        location,
        contactPersonName,
        contactPersonEmail,
        contactPersonPhone,
        builderWebsite: builderWebsite || null,
        projectDescription: projectDescription || null,
        projectType,
        additionalInfo: additionalInfo || null,
      },
    })

    // Send email notification to admins
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Project Addition Request
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Request ID: ${projectRequest.id}</h3>
            <p style="margin: 5px 0;"><strong>Submitted by:</strong> ${session.user.name} (${session.user.email})</p>
            <p style="margin: 5px 0;"><strong>Submitted on:</strong> ${new Date().toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )}</p>
          </div>

          <h3 style="color: #1f2937;">Builder Information</h3>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 10px 0;">
            <p style="margin: 5px 0;"><strong>Builder Name:</strong> ${builderName}</p>
            ${builderWebsite ? `<p style="margin: 5px 0;"><strong>Website:</strong> <a href="${builderWebsite}" target="_blank">${builderWebsite}</a></p>` : ''}
          </div>

          <h3 style="color: #1f2937;">Project Information</h3>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 10px 0;">
            <p style="margin: 5px 0;"><strong>Project Name:</strong> ${projectName}</p>
            <p style="margin: 5px 0;"><strong>Project Type:</strong> ${projectType}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
            ${projectDescription ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${projectDescription}</p>` : ''}
          </div>

          <h3 style="color: #1f2937;">Contact Information</h3>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 10px 0;">
            <p style="margin: 5px 0;"><strong>Contact Person:</strong> ${contactPersonName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${contactPersonEmail}">${contactPersonEmail}</a></p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${contactPersonPhone}">${contactPersonPhone}</a></p>
          </div>

          ${
            additionalInfo
              ? `
            <h3 style="color: #1f2937;">Additional Information</h3>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 10px 0;">
              <p style="margin: 5px 0;">${additionalInfo}</p>
            </div>
          `
              : ''
          }

          <div style="margin-top: 30px; padding: 20px; background-color: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin-top: 0;">Next Steps</h3>
            <p style="color: #047857; margin: 5px 0;">1. Review the project request details</p>
            <p style="color: #047857; margin: 5px 0;">2. Contact the builder/requester for verification</p>
            <p style="color: #047857; margin: 5px 0;">3. Add the project to Grihome database if approved</p>
            <p style="color: #047857; margin: 5px 0;">4. Update the request status in admin panel</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 6px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This email was generated automatically from Grihome project request system.
            </p>
          </div>
        </div>
      `

      await resend.emails.send({
        from: 'Grihome <noreply@grihome.vercel.app>',
        to: ['admin@grihome.com'], // Replace with actual admin email(s)
        subject: '[New Project Addition Request] ' + projectName + ' by ' + builderName,
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails - project is still saved
    }

    res.status(201).json({
      message: 'Project request submitted successfully',
      requestId: projectRequest.id,
    })
  } catch (error) {
    console.error('Error submitting project request:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
