/**
 * Admin Transactions API
 *
 * Returns transaction history for the admin dashboard.
 * Aggregates data from:
 * - Ad model (ad purchases)
 * - ProjectProperty model (properties added to projects)
 * - ProjectAgent model (agents registered to projects)
 *
 * Protected endpoint - only accessible to authorized admins.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { checkAdminAccess } from '@/lib/utils/admin-access'

interface TransactionItem {
  id: string
  date: string
  type: 'Ad Purchase' | 'Property Added to Project' | 'Agent Registered to Project'
  userName: string | null
  userEmail: string
  duration: number | null
  amount: number
  details: string | null
}

interface TransactionsResponse {
  transactions: TransactionItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

interface ErrorResponse {
  message: string
  reason?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TransactionsResponse | ErrorResponse>
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

    // Parse pagination params
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    // Fetch data from all three sources
    const [ads, projectProperties, projectAgents] = await Promise.all([
      prisma.ad.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          totalDays: true,
          totalAmount: true,
          slotNumber: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          property: {
            select: {
              streetAddress: true,
            },
          },
          project: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.projectProperty.findMany({
        orderBy: { addedAt: 'desc' },
        select: {
          id: true,
          addedAt: true,
          promotionPaymentAmount: true,
          project: {
            select: {
              name: true,
            },
          },
          property: {
            select: {
              streetAddress: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.projectAgent.findMany({
        orderBy: { registeredAt: 'desc' },
        select: {
          id: true,
          registeredAt: true,
          promotionPaymentAmount: true,
          project: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ])

    // Transform and combine all transactions
    const allTransactions: TransactionItem[] = [
      // Ad purchases
      ...ads.map(ad => ({
        id: `ad-${ad.id}`,
        date: ad.createdAt.toISOString(),
        type: 'Ad Purchase' as const,
        userName: ad.user.name,
        userEmail: ad.user.email,
        duration: ad.totalDays,
        amount: ad.totalAmount,
        details: ad.property?.streetAddress || ad.project?.name || `Slot ${ad.slotNumber}`,
      })),
      // Property additions to projects
      ...projectProperties.map(pp => ({
        id: `pp-${pp.id}`,
        date: pp.addedAt.toISOString(),
        type: 'Property Added to Project' as const,
        userName: pp.property.user.name,
        userEmail: pp.property.user.email,
        duration: null,
        amount: pp.promotionPaymentAmount,
        details: `${pp.property.streetAddress} -> ${pp.project.name}`,
      })),
      // Agent registrations to projects
      ...projectAgents.map(pa => ({
        id: `pa-${pa.id}`,
        date: pa.registeredAt.toISOString(),
        type: 'Agent Registered to Project' as const,
        userName: pa.user.name,
        userEmail: pa.user.email,
        duration: null,
        amount: pa.promotionPaymentAmount,
        details: pa.project.name,
      })),
    ]

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Apply pagination
    const totalCount = allTransactions.length
    const totalPages = Math.ceil(totalCount / limit)
    const skip = (page - 1) * limit
    const paginatedTransactions = allTransactions.slice(skip, skip + limit)

    return res.status(200).json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    })
  } catch {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
