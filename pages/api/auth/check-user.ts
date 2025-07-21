import { NextApiRequest, NextApiResponse } from 'next'
import validator from 'validator'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { type, value } = req.body

  if (!type || !value) {
    return res.status(400).json({ message: 'Type and value are required' })
  }

  if (!['email', 'mobile'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type' })
  }

  // Validate email format
  if (type === 'email' && !validator.isEmail(value.trim())) {
    return res.status(400).json({ message: 'Invalid email format', exists: false })
  }

  // Validate mobile format
  if (type === 'mobile') {
    const cleanedMobile = value.replace(/\D/g, '')

    // Check length first
    if (cleanedMobile.length < 7 || cleanedMobile.length > 15) {
      return res.status(400).json({ message: 'Invalid mobile number format', exists: false })
    }

    // Only reject completely invalid patterns (all zeros)
    if (/^0+$/.test(cleanedMobile)) {
      return res.status(400).json({ message: 'Invalid mobile number format', exists: false })
    }

    // Use validator.js as final check
    if (!validator.isMobilePhone(cleanedMobile, 'any', { strictMode: false })) {
      return res.status(400).json({ message: 'Invalid mobile number format', exists: false })
    }
  }

  try {
    let whereClause: any

    switch (type) {
      case 'email':
        whereClause = { email: value }
        break
      case 'mobile':
        whereClause = { phone: value }
        break
    }

    // Use findFirst with select to only fetch the id field for efficiency
    const existingUser = await prisma.user.findFirst({
      where: whereClause,
      select: { id: true },
    })

    res.status(200).json({ exists: !!existingUser })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('User check error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
