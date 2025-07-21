import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

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

  try {
    let whereClause: any

    switch (field) {
      case 'username':
        whereClause = { username: value }
        break
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

    res.status(200).json({ isUnique: !existingUser })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Uniqueness check error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
