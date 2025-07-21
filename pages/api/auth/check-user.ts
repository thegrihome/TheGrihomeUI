import { NextApiRequest, NextApiResponse } from 'next'
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

  try {
    let whereClause: any

    switch (type) {
      case 'email':
        whereClause = { email: value }
        break
      case 'mobile':
        whereClause = { mobileNumber: value }
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
