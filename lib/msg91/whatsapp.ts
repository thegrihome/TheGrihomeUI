/**
 * MSG91 WhatsApp Service
 * Server-side utility for sending WhatsApp messages via MSG91
 */

const MSG91_WHATSAPP_ENDPOINT =
  'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/'
const INTEGRATED_NUMBER = '919704786931'
const TEMPLATE_NAMESPACE = '381882fb_9ccc_4f69_a228_110a1bd8d51a'
const ADMIN_PHONE = '919704786931' // Admin WhatsApp number

export interface WhatsAppResult {
  success: boolean
  message: string
}

interface TemplateComponent {
  type: 'text'
  value: string
}

interface ToAndComponents {
  to: string[]
  components: Record<string, TemplateComponent>
}

/**
 * Send WhatsApp message using MSG91 template
 */
async function sendWhatsAppTemplate(params: {
  templateName: string
  recipients: ToAndComponents[]
}): Promise<WhatsAppResult> {
  const authKey = process.env.MSG91_AUTH_KEY

  if (!authKey) {
    return {
      success: false,
      message: 'MSG91 is not configured. Please set MSG91_AUTH_KEY.',
    }
  }

  const { templateName, recipients } = params

  const body = {
    integrated_number: INTEGRATED_NUMBER,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en',
          policy: 'deterministic',
        },
        namespace: TEMPLATE_NAMESPACE,
        to_and_components: recipients,
      },
    },
  }

  try {
    const response = await fetch(MSG91_WHATSAPP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok || data.type === 'error') {
      return {
        success: false,
        message: data.message || 'Failed to send WhatsApp message',
      }
    }

    return {
      success: true,
      message: 'WhatsApp message sent successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Failed to send WhatsApp message. Please try again.',
    }
  }
}

/**
 * Format phone number for WhatsApp (must include country code, no + sign)
 * Example: +91 9876543210 -> 919876543210
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')

  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }

  // If it's a 10-digit Indian number, add 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }

  return cleaned
}

/**
 * Send interest notification to seller via WhatsApp
 * Template: grihome_notification
 * Variables: body_1 to body_5
 * - body_1: Property name
 * - body_2: Seller name
 * - body_3: Buyer name
 * - body_4: Buyer email
 * - body_5: Buyer mobile
 */
export async function sendSellerInterestWhatsApp(params: {
  sellerPhone: string
  propertyName: string
  sellerName: string
  buyerName: string
  buyerEmail: string
  buyerMobile: string
}): Promise<WhatsAppResult> {
  const { sellerPhone, propertyName, sellerName, buyerName, buyerEmail, buyerMobile } = params

  const formattedPhone = formatPhoneNumber(sellerPhone)

  return sendWhatsAppTemplate({
    templateName: 'grihome_notification',
    recipients: [
      {
        to: [formattedPhone],
        components: {
          body_1: { type: 'text', value: propertyName },
          body_2: { type: 'text', value: sellerName },
          body_3: { type: 'text', value: buyerName },
          body_4: { type: 'text', value: buyerEmail },
          body_5: { type: 'text', value: buyerMobile },
        },
      },
    ],
  })
}

/**
 * Send admin notification via WhatsApp
 * Template: grihome_admin_notification
 * Variables: body_1 to body_7
 * - body_1: Property/Project name
 * - body_2: Seller name
 * - body_3: Seller email
 * - body_4: Seller mobile
 * - body_5: Buyer name
 * - body_6: Buyer email
 * - body_7: Buyer mobile
 */
export async function sendAdminNotificationWhatsApp(params: {
  propertyName: string
  sellerName: string
  sellerEmail: string
  sellerMobile: string
  buyerName: string
  buyerEmail: string
  buyerMobile: string
}): Promise<WhatsAppResult> {
  const {
    propertyName,
    sellerName,
    sellerEmail,
    sellerMobile,
    buyerName,
    buyerEmail,
    buyerMobile,
  } = params

  return sendWhatsAppTemplate({
    templateName: 'grihome_admin_notification',
    recipients: [
      {
        to: [ADMIN_PHONE],
        components: {
          body_1: { type: 'text', value: propertyName },
          body_2: { type: 'text', value: sellerName },
          body_3: { type: 'text', value: sellerEmail },
          body_4: { type: 'text', value: sellerMobile },
          body_5: { type: 'text', value: buyerName },
          body_6: { type: 'text', value: buyerEmail },
          body_7: { type: 'text', value: buyerMobile },
        },
      },
    ],
  })
}

/**
 * Send project transaction notification via WhatsApp
 * Template: grihome_project_transaction
 * Variables: body_1 to body_7
 * - body_1: Project name
 * - body_2: Customer name
 * - body_3: Customer email
 * - body_4: Customer mobile
 * - body_5: Transaction type (Agent Registration / Property Promotion)
 * - body_6: Duration
 * - body_7: Amount
 */
export async function sendProjectTransactionWhatsApp(params: {
  recipientPhone: string
  projectName: string
  customerName: string
  customerEmail: string
  customerMobile: string
  transactionType: string
  duration: string
  amount: string
}): Promise<WhatsAppResult> {
  const {
    recipientPhone,
    projectName,
    customerName,
    customerEmail,
    customerMobile,
    transactionType,
    duration,
    amount,
  } = params

  const formattedPhone = formatPhoneNumber(recipientPhone)

  return sendWhatsAppTemplate({
    templateName: 'grihome_project_transaction',
    recipients: [
      {
        to: [formattedPhone],
        components: {
          body_1: { type: 'text', value: projectName },
          body_2: { type: 'text', value: customerName },
          body_3: { type: 'text', value: customerEmail },
          body_4: { type: 'text', value: customerMobile },
          body_5: { type: 'text', value: transactionType },
          body_6: { type: 'text', value: duration },
          body_7: { type: 'text', value: amount },
        },
      },
    ],
  })
}

/**
 * Send interest notification via WhatsApp (to seller only)
 * Note: Admin receives email only to avoid WhatsApp rate limiting
 */
export async function sendInterestNotificationWhatsApp(params: {
  propertyName: string
  seller: {
    name: string
    email: string
    mobile: string
    isMobileVerified: boolean
  }
  buyer: {
    name: string
    email: string
    mobile: string
    isEmailVerified: boolean
    isMobileVerified: boolean
  }
}): Promise<{ sellerWhatsAppSent: boolean }> {
  const { propertyName, seller, buyer } = params

  const results = {
    sellerWhatsAppSent: false,
  }

  // Prepare buyer info (only show verified details)
  const buyerEmail = buyer.isEmailVerified ? buyer.email : 'Not verified'
  const buyerMobile = buyer.isMobileVerified ? buyer.mobile : 'Not verified'

  // Send to seller if mobile is verified
  if (seller.isMobileVerified && seller.mobile) {
    const sellerResult = await sendSellerInterestWhatsApp({
      sellerPhone: seller.mobile,
      propertyName,
      sellerName: seller.name,
      buyerName: buyer.name,
      buyerEmail,
      buyerMobile,
    })
    results.sellerWhatsAppSent = sellerResult.success
  }

  // Admin receives email only (no WhatsApp to avoid rate limiting)

  return results
}

/**
 * Send project transaction notification via WhatsApp (to user only)
 * Note: Admin receives email only to avoid WhatsApp rate limiting
 */
export async function sendProjectTransactionNotificationWhatsApp(params: {
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
}): Promise<{ userWhatsAppSent: boolean }> {
  const { projectName, user, transaction } = params

  const results = {
    userWhatsAppSent: false,
  }

  // Prepare user info (only show verified details)
  const userEmail = user.isEmailVerified ? user.email : 'Not verified'
  const userMobile = user.isMobileVerified ? user.mobile : 'Not verified'

  // Send to user if mobile is verified
  if (user.isMobileVerified && user.mobile) {
    const userResult = await sendProjectTransactionWhatsApp({
      recipientPhone: user.mobile,
      projectName,
      customerName: user.name,
      customerEmail: userEmail,
      customerMobile: userMobile,
      transactionType: transaction.type,
      duration: transaction.duration,
      amount: transaction.amount,
    })
    results.userWhatsAppSent = userResult.success
  }

  // Admin receives email only (no WhatsApp to avoid rate limiting)

  return results
}

/**
 * Send expiry reminder notification via WhatsApp
 * Reuses grihome_project_transaction template
 * - body_5 will be "Expiring in X days" instead of transaction type
 */
export async function sendExpiryReminderWhatsApp(params: {
  recipientPhone: string
  projectName: string
  customerName: string
  customerEmail: string
  customerMobile: string
  expiryType: 'Agent Registration' | 'Property Promotion'
  daysRemaining: number
  expiryDate: string
}): Promise<WhatsAppResult> {
  const {
    recipientPhone,
    projectName,
    customerName,
    customerEmail,
    customerMobile,
    expiryType,
    daysRemaining,
    expiryDate,
  } = params

  const formattedPhone = formatPhoneNumber(recipientPhone)

  return sendWhatsAppTemplate({
    templateName: 'grihome_project_transaction',
    recipients: [
      {
        to: [formattedPhone],
        components: {
          body_1: { type: 'text', value: projectName },
          body_2: { type: 'text', value: customerName },
          body_3: { type: 'text', value: customerEmail },
          body_4: { type: 'text', value: customerMobile },
          body_5: {
            type: 'text',
            value: `${expiryType} - Expiring in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
          },
          body_6: { type: 'text', value: expiryDate },
          body_7: { type: 'text', value: 'Please renew to continue' },
        },
      },
    ],
  })
}

/**
 * Send project interest notification to admin via WhatsApp
 * Uses grihome_notification template (5 params)
 * - body_1: Project name
 * - body_2: "Grihome Admin"
 * - body_3: User name
 * - body_4: User email
 * - body_5: User mobile
 */
export async function sendProjectInterestWhatsApp(params: {
  projectName: string
  userName: string
  userEmail: string
  userMobile: string
}): Promise<WhatsAppResult> {
  const { projectName, userName, userEmail, userMobile } = params

  return sendWhatsAppTemplate({
    templateName: 'grihome_notification',
    recipients: [
      {
        to: [ADMIN_PHONE],
        components: {
          body_1: { type: 'text', value: projectName },
          body_2: { type: 'text', value: 'Grihome Admin' },
          body_3: { type: 'text', value: userName },
          body_4: { type: 'text', value: userEmail },
          body_5: { type: 'text', value: userMobile },
        },
      },
    ],
  })
}

/**
 * Send agent contact notification via WhatsApp
 * Uses grihome_notification template (5 params)
 * - body_1: Project name
 * - body_2: Recipient name (agent name)
 * - body_3: User name
 * - body_4: User email
 * - body_5: User mobile
 */
export async function sendAgentContactWhatsApp(params: {
  agentPhone: string
  projectName: string
  agentName: string
  userName: string
  userEmail: string
  userMobile: string
}): Promise<WhatsAppResult> {
  const { agentPhone, projectName, agentName, userName, userEmail, userMobile } = params

  const formattedPhone = formatPhoneNumber(agentPhone)

  return sendWhatsAppTemplate({
    templateName: 'grihome_notification',
    recipients: [
      {
        to: [formattedPhone],
        components: {
          body_1: { type: 'text', value: projectName },
          body_2: { type: 'text', value: agentName },
          body_3: { type: 'text', value: userName },
          body_4: { type: 'text', value: userEmail },
          body_5: { type: 'text', value: userMobile },
        },
      },
    ],
  })
}

/**
 * Send agent contact notifications via WhatsApp (to agent only)
 * Note: Admin receives email only to avoid WhatsApp rate limiting
 */
export async function sendAgentContactNotificationWhatsApp(params: {
  projectName: string
  agent: {
    name: string
    phone: string
    isMobileVerified: boolean
  }
  user: {
    name: string
    email: string
    mobile: string
    isEmailVerified: boolean
    isMobileVerified: boolean
  }
}): Promise<{ agentWhatsAppSent: boolean }> {
  const { projectName, agent, user } = params

  const results = {
    agentWhatsAppSent: false,
  }

  // Prepare user info (only show verified details)
  const userEmail = user.isEmailVerified ? user.email : 'Not verified'
  const userMobile = user.isMobileVerified ? user.mobile : 'Not verified'

  // Send to agent if mobile is verified
  if (agent.isMobileVerified && agent.phone) {
    const agentResult = await sendAgentContactWhatsApp({
      agentPhone: agent.phone,
      projectName,
      agentName: agent.name,
      userName: user.name,
      userEmail,
      userMobile,
    })
    results.agentWhatsAppSent = agentResult.success
  }

  // Admin receives email only (no WhatsApp to avoid rate limiting)

  return results
}
