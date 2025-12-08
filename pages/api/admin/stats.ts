/**
 * Admin Statistics API
 *
 * Returns user statistics for the admin dashboard.
 * Protected endpoint - only accessible to authorized admins.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { checkAdminAccess } from '@/lib/utils/admin-access'

interface AdminStats {
  totalUsers: number
  users24h: number
  users7d: number
  users30d: number
  totalAgents: number
}

interface ErrorResponse {
  message: string
  reason?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminStats | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    // Server-side access control
    const accessResult = checkAdminAccess(session?.user?.email)
    if (!accessResult.canAccessAdmin) {
      return res.status(403).json({
        message: 'Forbidden: Admin access required',
        reason: accessResult.reason,
      })
    }

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Execute all queries in parallel for performance
    const [totalUsers, users24h, users7d, users30d, totalAgents] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last24h } } }),
      prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      prisma.user.count({ where: { createdAt: { gte: last30d } } }),
      prisma.user.count({ where: { role: 'AGENT' } }),
    ])

    return res.status(200).json({
      totalUsers,
      users24h,
      users7d,
      users30d,
      totalAgents,
    })
  } catch {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
