import { NextApiRequest, NextApiResponse } from 'next'
import { sendContactEmail } from '@/lib/resend/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, email, phone, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({
        message: 'Name, email, and message are required',
      })
    }

    const result = await sendContactEmail({
      name,
      email,
      phone,
      message,
    })

    if (!result.success) {
      return res.status(500).json({
        message: result.message,
      })
    }

    return res.status(200).json({
      message: 'Email sent successfully',
      id: result.id,
    })
  } catch {
    return res.status(500).json({
      message: 'Failed to send email',
    })
  }
}
