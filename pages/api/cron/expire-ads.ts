import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron job request (you can add authorization header check here)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const now = new Date()

    // Find all active ads that have expired
    const expiredAds = await prisma.ad.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: now,
        },
      },
    })

    // Update expired ads to EXPIRED status
    if (expiredAds.length > 0) {
      await prisma.ad.updateMany({
        where: {
          id: {
            in: expiredAds.map(ad => ad.id),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      })
    }

    res.status(200).json({
      message: 'Ads expired successfully',
      expiredCount: expiredAds.length,
      expiredAdIds: expiredAds.map(ad => ad.id),
    })
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error expiring ads:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
