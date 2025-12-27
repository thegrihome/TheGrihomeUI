import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get distinct company names from agents
    const users = await prisma.user.findMany({
      where: {
        role: 'AGENT',
        companyName: {
          not: null,
        },
      },
      select: {
        companyName: true,
      },
      distinct: ['companyName'],
      orderBy: {
        companyName: 'asc',
      },
    })

    // Extract unique company names and filter out null/empty values
    const companyNames = users
      .map(user => user.companyName)
      .filter((name): name is string => name !== null && name.trim() !== '')

    return res.status(200).json({ companyNames })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
