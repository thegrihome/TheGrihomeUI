import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { userId, testPassword } = req.body

  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' })
  }

  try {
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // If testPassword is provided, validate it
    let isValidPassword = false
    if (testPassword && user.password) {
      isValidPassword = await bcrypt.compare(testPassword, user.password)
    }

    // Return password info without exposing the actual password
    // For security, we show dots representing the password length
    const passwordLength = user.password ? 12 : 0 // Assume typical password length
    const passwordDisplay = '•'.repeat(passwordLength)

    res.status(200).json({
      passwordDisplay,
      hasPassword: !!user.password,
      isValidPassword: testPassword ? isValidPassword : undefined,
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Password validation error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
