import { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const emailData = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'thegrihome@gmail.com',
      subject: `[Grihome.com Contact Request] ${name}`,
      html: message.replace(/\n/g, '<br>'),
    })

    return res.status(200).json({
      message: 'Email sent successfully',
      id: emailData.data?.id,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to send email',
    })
  }
}
