/**
 * MSG91 Email Service
 * Server-side utility for sending transactional emails via MSG91
 */

export interface EmailRecipient {
  email: string
  name: string
}

export interface SendEmailResult {
  success: boolean
  message: string
}

const MSG91_EMAIL_ENDPOINT = 'https://control.msg91.com/api/v5/email/send'
const SELLER_TEMPLATE_ID = 'grihome_notification'
const ADMIN_TEMPLATE_ID = 'grihome_notification_admin'
const PROJECT_TRANSACTION_TEMPLATE_ID = 'grihome_project_transaction'
const FROM_EMAIL = 'no-reply@grihome.com'
const DOMAIN = 'grihome.com'

/**
 * Send email to seller when someone expresses interest
 * Template: grihome_notification
 * Variables: customer.property.name, customer.name, customer2.name, customer2.email, customer2.mobile
 */
async function sendSellerEmail(params: {
  to: EmailRecipient
  propertyName: string
  sellerName: string
  buyerName: string
  buyerEmail: string
  buyerMobile: string
}): Promise<SendEmailResult> {
  const authKey = process.env.MSG91_AUTH_KEY

  if (!authKey) {
    return {
      success: false,
      message: 'MSG91 is not configured. Please set MSG91_AUTH_KEY.',
    }
  }

  const { to, propertyName, sellerName, buyerName, buyerEmail, buyerMobile } = params

  const body = {
    recipients: [
      {
        to: [{ email: to.email, name: to.name }],
        variables: {
          customer: {
            property: {
              name: propertyName,
            },
            name: sellerName,
          },
          customer2: {
            name: buyerName,
            email: buyerEmail,
            mobile: buyerMobile,
          },
        },
      },
    ],
    from: {
      email: FROM_EMAIL,
    },
    domain: DOMAIN,
    template_id: SELLER_TEMPLATE_ID,
  }

  try {
    const response = await fetch(MSG91_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok || data.type === 'error') {
      return {
        success: false,
        message: data.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      message: 'Email sent successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Failed to send email. Please try again.',
    }
  }
}

/**
 * Send email to admin when someone expresses interest
 * Template: grihome_notification_admin
 * Variables: customer.property.name, customer.name, customer1.email, customer.email, customer.mobile,
 *            customer2.name, customer2.email, customer2.mobile
 */
async function sendAdminEmail(params: {
  propertyName: string
  sellerName: string
  sellerEmail: string
  sellerMobile: string
  buyerName: string
  buyerEmail: string
  buyerMobile: string
}): Promise<SendEmailResult> {
  const authKey = process.env.MSG91_AUTH_KEY

  if (!authKey) {
    return {
      success: false,
      message: 'MSG91 is not configured. Please set MSG91_AUTH_KEY.',
    }
  }

  const {
    propertyName,
    sellerName,
    sellerEmail,
    sellerMobile,
    buyerName,
    buyerEmail,
    buyerMobile,
  } = params

  const body = {
    recipients: [
      {
        to: [{ email: 'thegrihome@gmail.com', name: 'Grihome Admin' }],
        variables: {
          customer: {
            property: {
              name: propertyName,
            },
            name: sellerName,
            email: sellerEmail,
            mobile: sellerMobile,
          },
          customer1: {
            email: sellerEmail,
          },
          customer2: {
            name: buyerName,
            email: buyerEmail,
            mobile: buyerMobile,
          },
        },
      },
    ],
    from: {
      email: FROM_EMAIL,
    },
    domain: DOMAIN,
    template_id: ADMIN_TEMPLATE_ID,
  }

  try {
    const response = await fetch(MSG91_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok || data.type === 'error') {
      return {
        success: false,
        message: data.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      message: 'Email sent successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Failed to send email. Please try again.',
    }
  }
}

/**
 * Send interest notification emails
 * Sends to seller (if email verified) and admin
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
}): Promise<{ sellerEmailSent: boolean; adminEmailSent: boolean }> {
  const { propertyName, seller, buyer } = params

  const results = {
    sellerEmailSent: false,
    adminEmailSent: false,
  }

  // Prepare buyer info (only show verified details)
  const buyerEmail = buyer.isEmailVerified ? buyer.email : 'Not verified'
  const buyerMobile = buyer.isMobileVerified ? buyer.mobile : 'Not verified'

  // Send email to seller if their email is verified
  if (seller.isEmailVerified && seller.email) {
    const sellerResult = await sendSellerEmail({
      to: { email: seller.email, name: seller.name },
      propertyName,
      sellerName: seller.name,
      buyerName: buyer.name,
      buyerEmail,
      buyerMobile,
    })
    results.sellerEmailSent = sellerResult.success
  }

  // Prepare seller info for admin email (only show verified details)
  const sellerEmail = seller.isEmailVerified ? seller.email : 'Not verified'
  const sellerMobile = seller.isMobileVerified ? seller.mobile : 'Not verified'

  // Always send email to admin with both seller and buyer details
  const adminResult = await sendAdminEmail({
    propertyName,
    sellerName: seller.name,
    sellerEmail,
    sellerMobile,
    buyerName: buyer.name,
    buyerEmail,
    buyerMobile,
  })
  results.adminEmailSent = adminResult.success

  return results
}

/**
 * Send project transaction email
 * Template: grihome_project_transaction
 * Variables: customer.project.name, customer.name, customer.email, customer.mobile,
 *            transaction.type, transaction.duration, transaction.amount
 *
 * Used when:
 * - Agent registers for a project
 * - Property is promoted/added to a project
 */
async function sendProjectTransactionEmail(params: {
  to: EmailRecipient
  projectName: string
  customerName: string
  customerEmail: string
  customerMobile: string
  transactionType: string
  transactionDuration: string
  transactionAmount: string
}): Promise<SendEmailResult> {
  const authKey = process.env.MSG91_AUTH_KEY

  if (!authKey) {
    return {
      success: false,
      message: 'MSG91 is not configured. Please set MSG91_AUTH_KEY.',
    }
  }

  const {
    to,
    projectName,
    customerName,
    customerEmail,
    customerMobile,
    transactionType,
    transactionDuration,
    transactionAmount,
  } = params

  const body = {
    recipients: [
      {
        to: [{ email: to.email, name: to.name }],
        variables: {
          customer: {
            project: {
              name: projectName,
            },
            name: customerName,
            email: customerEmail,
            mobile: customerMobile,
          },
          transaction: {
            type: transactionType,
            duration: transactionDuration,
            amount: transactionAmount,
          },
        },
      },
    ],
    from: {
      email: FROM_EMAIL,
    },
    domain: DOMAIN,
    template_id: PROJECT_TRANSACTION_TEMPLATE_ID,
  }

  try {
    const response = await fetch(MSG91_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok || data.type === 'error') {
      return {
        success: false,
        message: data.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      message: 'Email sent successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Failed to send email. Please try again.',
    }
  }
}

/**
 * Send project transaction notification emails
 * Sends to user (if email verified) and admin
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
}): Promise<{ userEmailSent: boolean; adminEmailSent: boolean }> {
  const { projectName, user, transaction } = params

  const results = {
    userEmailSent: false,
    adminEmailSent: false,
  }

  // Prepare user info (only show verified details)
  const userEmail = user.isEmailVerified ? user.email : 'Not verified'
  const userMobile = user.isMobileVerified ? user.mobile : 'Not verified'

  // Send email to user if their email is verified
  if (user.isEmailVerified && user.email) {
    const userResult = await sendProjectTransactionEmail({
      to: { email: user.email, name: user.name },
      projectName,
      customerName: user.name,
      customerEmail: userEmail,
      customerMobile: userMobile,
      transactionType: transaction.type,
      transactionDuration: transaction.duration,
      transactionAmount: transaction.amount,
    })
    results.userEmailSent = userResult.success
  }

  // Always send email to admin
  const adminResult = await sendProjectTransactionEmail({
    to: { email: 'thegrihome@gmail.com', name: 'Grihome Admin' },
    projectName,
    customerName: user.name,
    customerEmail: userEmail,
    customerMobile: userMobile,
    transactionType: transaction.type,
    transactionDuration: transaction.duration,
    transactionAmount: transaction.amount,
  })
  results.adminEmailSent = adminResult.success

  return results
}
