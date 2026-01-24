import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { Resend } from 'resend'
import { sendExpiryReminderWhatsApp } from '@/lib/msg91/whatsapp'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'thegrihome@gmail.com'
const FROM_EMAIL = 'Zillfin <no-reply@grihome.com>'

interface ExpiringAgent {
  id: string
  promotionEndDate: Date
  user: {
    name: string | null
    email: string
    phone: string | null
    emailVerified: Date | null
    mobileVerified: Date | null
  }
  project: {
    id: string
    name: string
  }
}

interface ExpiringProperty {
  id: string
  promotionEndDate: Date
  property: {
    id: string
    streetAddress: string
    user: {
      name: string | null
      email: string
      phone: string | null
      emailVerified: Date | null
      mobileVerified: Date | null
    }
  }
  project: {
    id: string
    name: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET or POST requests (Vercel Cron uses GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Calculate dates for 3-day and 1-day reminders
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    const threeDaysEnd = new Date(threeDaysFromNow)
    threeDaysEnd.setDate(threeDaysEnd.getDate() + 1)

    const oneDayFromNow = new Date(today)
    oneDayFromNow.setDate(today.getDate() + 1)
    const oneDayEnd = new Date(oneDayFromNow)
    oneDayEnd.setDate(oneDayEnd.getDate() + 1)

    // Find agents expiring in 3 days
    const agentsExpiring3Days = await prisma.projectAgent.findMany({
      where: {
        isPromoted: true,
        promotionEndDate: {
          gte: threeDaysFromNow,
          lt: threeDaysEnd,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            mobileVerified: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Find agents expiring in 1 day
    const agentsExpiring1Day = await prisma.projectAgent.findMany({
      where: {
        isPromoted: true,
        promotionEndDate: {
          gte: oneDayFromNow,
          lt: oneDayEnd,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            mobileVerified: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Find properties expiring in 3 days
    const propertiesExpiring3Days = await prisma.projectProperty.findMany({
      where: {
        isPromoted: true,
        promotionEndDate: {
          gte: threeDaysFromNow,
          lt: threeDaysEnd,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            streetAddress: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                emailVerified: true,
                mobileVerified: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Find properties expiring in 1 day
    const propertiesExpiring1Day = await prisma.projectProperty.findMany({
      where: {
        isPromoted: true,
        promotionEndDate: {
          gte: oneDayFromNow,
          lt: oneDayEnd,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            streetAddress: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                emailVerified: true,
                mobileVerified: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const emailResults = {
      agentReminders3Day: { email: 0, whatsApp: 0 },
      agentReminders1Day: { email: 0, whatsApp: 0 },
      propertyReminders3Day: { email: 0, whatsApp: 0 },
      propertyReminders1Day: { email: 0, whatsApp: 0 },
      errors: [] as string[],
    }

    // Send 3-day agent reminders
    for (const agent of agentsExpiring3Days as ExpiringAgent[]) {
      try {
        const result = await sendAgentExpiryReminder(agent, 3)
        if (result.emailSent) emailResults.agentReminders3Day.email++
        if (result.whatsAppSent) emailResults.agentReminders3Day.whatsApp++
      } catch (error) {
        emailResults.errors.push(`Agent ${agent.id}: ${error}`)
      }
    }

    // Send 1-day agent reminders
    for (const agent of agentsExpiring1Day as ExpiringAgent[]) {
      try {
        const result = await sendAgentExpiryReminder(agent, 1)
        if (result.emailSent) emailResults.agentReminders1Day.email++
        if (result.whatsAppSent) emailResults.agentReminders1Day.whatsApp++
      } catch (error) {
        emailResults.errors.push(`Agent ${agent.id}: ${error}`)
      }
    }

    // Send 3-day property reminders
    for (const property of propertiesExpiring3Days as ExpiringProperty[]) {
      try {
        const result = await sendPropertyExpiryReminder(property, 3)
        if (result.emailSent) emailResults.propertyReminders3Day.email++
        if (result.whatsAppSent) emailResults.propertyReminders3Day.whatsApp++
      } catch (error) {
        emailResults.errors.push(`Property ${property.id}: ${error}`)
      }
    }

    // Send 1-day property reminders
    for (const property of propertiesExpiring1Day as ExpiringProperty[]) {
      try {
        const result = await sendPropertyExpiryReminder(property, 1)
        if (result.emailSent) emailResults.propertyReminders1Day.email++
        if (result.whatsAppSent) emailResults.propertyReminders1Day.whatsApp++
      } catch (error) {
        emailResults.errors.push(`Property ${property.id}: ${error}`)
      }
    }

    return res.status(200).json({
      message: 'Expiry reminders processed',
      results: emailResults,
      found: {
        agentsExpiring3Days: agentsExpiring3Days.length,
        agentsExpiring1Day: agentsExpiring1Day.length,
        propertiesExpiring3Days: propertiesExpiring3Days.length,
        propertiesExpiring1Day: propertiesExpiring1Day.length,
      },
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error sending expiry reminders:', error)
    }
    return res.status(500).json({ message: 'Internal server error' })
  }
}

async function sendAgentExpiryReminder(
  agent: ExpiringAgent,
  daysRemaining: number
): Promise<{ emailSent: boolean; whatsAppSent: boolean }> {
  const { user, project, promotionEndDate } = agent
  const expiryDate = new Date(promotionEndDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const result = { emailSent: false, whatsAppSent: false }

  const subject = `Reminder: Your agent registration for ${project.name} expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`

  const emailBody = `
    <h2>Agent Registration Expiring Soon</h2>

    <p>Hello ${user.name || 'Agent'},</p>

    <p>This is a friendly reminder that your verified agent registration for <strong>${project.name}</strong> will expire on <strong>${expiryDate}</strong> (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} from now).</p>

    <p>To continue being displayed as a verified agent on this project, please renew your registration before it expires.</p>

    <p><a href="${process.env.NEXTAUTH_URL || 'https://grihome.vercel.app'}/projects/${project.id}">View Project</a></p>

    <hr>
    <p><small>This is an automated reminder from Zillfin platform.</small></p>
  `

  // Send to user if email is verified
  if (user.emailVerified && user.email) {
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject,
      html: emailBody,
    })
    result.emailSent = !emailResult.error
  }

  // Send to admin
  const adminSubject = `Agent Expiry Notice: ${user.name || user.email} - ${project.name}`
  const adminBody = `
    <h2>Agent Registration Expiring</h2>

    <p><strong>Agent:</strong> ${user.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Mobile:</strong> ${user.phone || 'N/A'}</p>
    <p><strong>Project:</strong> ${project.name}</p>
    <p><strong>Expiry Date:</strong> ${expiryDate}</p>
    <p><strong>Days Remaining:</strong> ${daysRemaining}</p>

    <hr>
    <p><small>Automated notification from Zillfin platform.</small></p>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL],
    subject: adminSubject,
    html: adminBody,
  })

  // Send WhatsApp reminder to user if phone is verified (admin receives email only)
  if (user.mobileVerified && user.phone) {
    const whatsAppResult = await sendExpiryReminderWhatsApp({
      recipientPhone: user.phone,
      projectName: project.name,
      customerName: user.name || 'Agent',
      customerEmail: user.emailVerified ? user.email : 'Not verified',
      customerMobile: user.phone,
      expiryType: 'Agent Registration',
      daysRemaining,
      expiryDate,
    })
    result.whatsAppSent = whatsAppResult.success
  }

  // Admin receives email only (no WhatsApp to avoid rate limiting)

  return result
}

async function sendPropertyExpiryReminder(
  propertyRecord: ExpiringProperty,
  daysRemaining: number
): Promise<{ emailSent: boolean; whatsAppSent: boolean }> {
  const { property, project, promotionEndDate } = propertyRecord
  const { user } = property
  const expiryDate = new Date(promotionEndDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const result = { emailSent: false, whatsAppSent: false }

  const subject = `Reminder: Your property promotion for ${project.name} expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`

  const emailBody = `
    <h2>Property Promotion Expiring Soon</h2>

    <p>Hello ${user.name || 'Property Owner'},</p>

    <p>This is a friendly reminder that your verified property promotion for <strong>${property.streetAddress}</strong> in <strong>${project.name}</strong> will expire on <strong>${expiryDate}</strong> (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} from now).</p>

    <p>To continue having your property displayed as verified on this project, please renew your promotion before it expires.</p>

    <p><a href="${process.env.NEXTAUTH_URL || 'https://grihome.vercel.app'}/projects/${project.id}">View Project</a></p>

    <hr>
    <p><small>This is an automated reminder from Zillfin platform.</small></p>
  `

  // Send to user if email is verified
  if (user.emailVerified && user.email) {
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject,
      html: emailBody,
    })
    result.emailSent = !emailResult.error
  }

  // Send to admin
  const adminSubject = `Property Expiry Notice: ${property.streetAddress} - ${project.name}`
  const adminBody = `
    <h2>Property Promotion Expiring</h2>

    <p><strong>Property:</strong> ${property.streetAddress}</p>
    <p><strong>Owner:</strong> ${user.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Mobile:</strong> ${user.phone || 'N/A'}</p>
    <p><strong>Project:</strong> ${project.name}</p>
    <p><strong>Expiry Date:</strong> ${expiryDate}</p>
    <p><strong>Days Remaining:</strong> ${daysRemaining}</p>

    <hr>
    <p><small>Automated notification from Zillfin platform.</small></p>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL],
    subject: adminSubject,
    html: adminBody,
  })

  // Send WhatsApp reminder to user if phone is verified (admin receives email only)
  if (user.mobileVerified && user.phone) {
    const whatsAppResult = await sendExpiryReminderWhatsApp({
      recipientPhone: user.phone,
      projectName: project.name,
      customerName: user.name || 'Property Owner',
      customerEmail: user.emailVerified ? user.email : 'Not verified',
      customerMobile: user.phone,
      expiryType: 'Property Promotion',
      daysRemaining,
      expiryDate,
    })
    result.whatsAppSent = whatsAppResult.success
  }

  // Admin receives email only (no WhatsApp to avoid rate limiting)

  return result
}
