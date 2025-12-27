/**
 * Resend Email Service
 * Centralized utility for sending transactional emails via Resend
 */

import { Resend } from 'resend'
import {
  sendInterestNotificationWhatsApp,
  sendProjectTransactionNotificationWhatsApp,
} from '@/lib/msg91/whatsapp'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'TheGrihome <no-reply@grihome.com>'
const ADMIN_EMAIL = 'thegrihome@gmail.com'

export interface SendEmailResult {
  success: boolean
  message: string
  id?: string
}

/**
 * Send a generic email
 */
export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
}): Promise<SendEmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
    })

    if (result.error) {
      return {
        success: false,
        message: result.error.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      message: 'Email sent successfully',
      id: result.data?.id,
    }
  } catch {
    return {
      success: false,
      message: 'Failed to send email. Please try again.',
    }
  }
}

/**
 * Send OTP email for verification
 */
export async function sendOtpEmail(params: {
  to: string
  otp: string
  name?: string
}): Promise<SendEmailResult> {
  const { to, otp, name } = params

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Verify Your Email</h2>

      <p>Hello${name ? ` ${name}` : ''},</p>

      <p>Your verification code is:</p>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
      </div>

      <p>This code will expire in 10 minutes.</p>

      <p>If you didn't request this code, please ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from TheGrihome platform.</p>
    </div>
  `

  return sendEmail({
    to,
    subject: `${otp} is your Grihome verification code`,
    html,
  })
}

/**
 * Send interest notification emails and WhatsApp (to seller and admin)
 */
export async function sendInterestNotification(params: {
  propertyName: string
  seller: {
    name: string
    email: string
    mobile: string
    isEmailVerified: boolean
    isMobileVerified: boolean
  }
  buyer: {
    name: string
    email: string
    mobile: string
    isEmailVerified: boolean
    isMobileVerified: boolean
  }
}): Promise<{
  sellerEmailSent: boolean
  adminEmailSent: boolean
  sellerWhatsAppSent: boolean
  adminWhatsAppSent: boolean
}> {
  const { propertyName, seller, buyer } = params

  const results = {
    sellerEmailSent: false,
    adminEmailSent: false,
    sellerWhatsAppSent: false,
    adminWhatsAppSent: false,
  }

  // Prepare buyer info (only show verified details)
  const buyerEmail = buyer.isEmailVerified ? buyer.email : 'Not verified'
  const buyerMobile = buyer.isMobileVerified ? buyer.mobile : 'Not verified'

  // Seller email template
  const sellerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Interest in Your Property</h2>

      <p>Hello ${seller.name},</p>

      <p>Someone has expressed interest in your property: <strong>${propertyName}</strong></p>

      <h3 style="color: #1f2937;">Interested Buyer Details:</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${buyer.name}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${buyerEmail}</p>
      <p style="margin: 5px 0;"><strong>Mobile:</strong> ${buyerMobile}</p>

      <p style="margin-top: 20px;">Please reach out to the buyer at your earliest convenience.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from TheGrihome platform.</p>
    </div>
  `

  // Send to seller if email is verified
  if (seller.isEmailVerified && seller.email) {
    const sellerResult = await sendEmail({
      to: seller.email,
      subject: `New Interest in ${propertyName} - Grihome`,
      html: sellerHtml,
    })
    results.sellerEmailSent = sellerResult.success
  }

  // Admin email template
  const sellerEmail = seller.isEmailVerified ? seller.email : 'Not verified'
  const sellerMobile = seller.isMobileVerified ? seller.mobile : 'Not verified'

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Property Interest Notification</h2>

      <p>A new interest has been expressed for a property on Grihome.</p>

      <h3 style="color: #1f2937;">Property</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${propertyName}</p>

      <h3 style="color: #1f2937;">Seller Details</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${seller.name}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${sellerEmail}</p>
      <p style="margin: 5px 0;"><strong>Mobile:</strong> ${sellerMobile}</p>

      <h3 style="color: #1f2937;">Buyer Details</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${buyer.name}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${buyerEmail}</p>
      <p style="margin: 5px 0;"><strong>Mobile:</strong> ${buyerMobile}</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">Automated notification from TheGrihome platform.</p>
    </div>
  `

  // Always send to admin
  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Interest] ${propertyName} - ${buyer.name}`,
    html: adminHtml,
  })
  results.adminEmailSent = adminResult.success

  // Send WhatsApp notifications
  const whatsAppResults = await sendInterestNotificationWhatsApp({
    propertyName,
    seller: {
      name: seller.name,
      email: seller.email,
      mobile: seller.mobile,
      isMobileVerified: seller.isMobileVerified,
    },
    buyer: {
      name: buyer.name,
      email: buyer.email,
      mobile: buyer.mobile,
      isEmailVerified: buyer.isEmailVerified,
      isMobileVerified: buyer.isMobileVerified,
    },
  })
  results.sellerWhatsAppSent = whatsAppResults.sellerWhatsAppSent
  results.adminWhatsAppSent = whatsAppResults.adminWhatsAppSent

  return results
}

/**
 * Send project transaction notification emails (agent registration, property promotion)
 */
export async function sendProjectTransactionNotification(params: {
  projectName: string
  user: {
    name: string
    email: string
    mobile: string
    isEmailVerified: boolean
    isMobileVerified: boolean
  }
  transaction: {
    type: 'Agent Registration' | 'Property Promotion'
    duration: string
    amount: string
  }
}): Promise<{
  userEmailSent: boolean
  adminEmailSent: boolean
  userWhatsAppSent: boolean
  adminWhatsAppSent: boolean
}> {
  const { projectName, user, transaction } = params

  const results = {
    userEmailSent: false,
    adminEmailSent: false,
    userWhatsAppSent: false,
    adminWhatsAppSent: false,
  }

  const userEmail = user.isEmailVerified ? user.email : 'Not verified'
  const userMobile = user.isMobileVerified ? user.mobile : 'Not verified'

  const userHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Transaction Confirmation</h2>

      <p>Hello ${user.name},</p>

      <p>Your transaction has been processed successfully.</p>

      <h3 style="color: #1f2937;">Transaction Details:</h3>
      <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${transaction.type}</p>
      <p style="margin: 5px 0;"><strong>Duration:</strong> ${transaction.duration}</p>
      <p style="margin: 5px 0;"><strong>Amount:</strong> ${transaction.amount}</p>

      <p style="margin-top: 20px;">Thank you for using Grihome!</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is an automated message from TheGrihome platform.</p>
    </div>
  `

  // Send to user if email is verified
  if (user.isEmailVerified && user.email) {
    const userResult = await sendEmail({
      to: user.email,
      subject: `${transaction.type} Confirmation - ${projectName}`,
      html: userHtml,
    })
    results.userEmailSent = userResult.success
  }

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Project Transaction</h2>

      <h3 style="color: #1f2937;">Transaction Details:</h3>
      <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${transaction.type}</p>
      <p style="margin: 5px 0;"><strong>Duration:</strong> ${transaction.duration}</p>
      <p style="margin: 5px 0;"><strong>Amount:</strong> ${transaction.amount}</p>

      <h3 style="color: #1f2937;">User Details:</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${user.name}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
      <p style="margin: 5px 0;"><strong>Mobile:</strong> ${userMobile}</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">Automated notification from TheGrihome platform.</p>
    </div>
  `

  // Always send to admin
  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Transaction] ${transaction.type} - ${projectName} - ${user.name}`,
    html: adminHtml,
  })
  results.adminEmailSent = adminResult.success

  // Send WhatsApp notifications
  const whatsAppResults = await sendProjectTransactionNotificationWhatsApp({
    projectName,
    user: {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
    },
    transaction,
  })
  results.userWhatsAppSent = whatsAppResults.userWhatsAppSent
  results.adminWhatsAppSent = whatsAppResults.adminWhatsAppSent

  return results
}

/**
 * Send contact form email
 */
export async function sendContactEmail(params: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<SendEmailResult> {
  const { name, email, phone, message } = params

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Contact Request</h2>

      <h3 style="color: #1f2937;">From:</h3>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
      </div>

      <h3 style="color: #1f2937;">Message:</h3>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">Contact form submission from Grihome.com</p>
    </div>
  `

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Contact] ${name} - Grihome`,
    html,
  })
}

/**
 * Send project request email
 */
export async function sendProjectRequestEmail(params: {
  requestId: string
  submittedBy: { name: string; email: string }
  builderName: string
  builderWebsite?: string
  projectName: string
  projectType: string
  location: string
  projectDescription?: string
  contactPersonName: string
  contactPersonEmail: string
  contactPersonPhone: string
  additionalInfo?: string
}): Promise<SendEmailResult> {
  const {
    requestId,
    submittedBy,
    builderName,
    builderWebsite,
    projectName,
    projectType,
    location,
    projectDescription,
    contactPersonName,
    contactPersonEmail,
    contactPersonPhone,
    additionalInfo,
  } = params

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        New Project Addition Request
      </h2>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">Request ID: ${requestId}</h3>
        <p style="margin: 5px 0;"><strong>Submitted by:</strong> ${submittedBy.name} (${submittedBy.email})</p>
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

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[New Project Request] ${projectName} by ${builderName}`,
    html,
  })
}
