import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { otp } = req.body

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' })
    }

    // Check if OTP is valid (123456 for development)
    if (otp !== '123456') {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    // Update mobile verification
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mobileVerified: new Date() },
    })

    return res.status(200).json({ message: 'Mobile verified successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
