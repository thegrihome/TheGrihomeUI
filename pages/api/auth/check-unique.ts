import { NextApiRequest, NextApiResponse } from 'next'
import validator from 'validator'
import { parsePhoneNumber } from 'libphonenumber-js'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { field, value } = req.body

  if (!field || !value) {
    return res.status(400).json({ message: 'Field and value are required' })
  }

  if (!['username', 'email', 'mobile'].includes(field)) {
    return res.status(400).json({ message: 'Invalid field' })
  }

  // Validate email format
  if (field === 'email' && !validator.isEmail(value.trim())) {
    return res.status(400).json({ message: 'Invalid email format', isUnique: false })
  }

  // Validate mobile format using libphonenumber-js
  if (field === 'mobile') {
    try {
      const phoneNumber = parsePhoneNumber(value)
      if (!phoneNumber || !phoneNumber.isValid()) {
        return res.status(400).json({ message: 'Invalid mobile number format', isUnique: false })
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid mobile number format', isUnique: false })
    }
  }

  try {
    let whereClause: any

    switch (field) {
      case 'username':
        // Username must always be unique
        whereClause = { username: value }
        break
      case 'email':
        // Only check for VERIFIED emails (emailVerified is not null)
        whereClause = { email: value, emailVerified: { not: null } }
        break
      case 'mobile':
        // Only check for VERIFIED mobile numbers (mobileVerified is not null)
        whereClause = { phone: value, mobileVerified: { not: null } }
        break
    }

    // Use findFirst with select to only fetch the id field for efficiency
    const existingUser = await prisma.user.findFirst({
      where: whereClause,
      select: { id: true },
    })

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Query result:', { field, value, existingUser, isUnique: !existingUser })
    }

    res.status(200).json({ isUnique: !existingUser })
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
