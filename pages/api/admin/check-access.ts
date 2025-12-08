/**
 * Admin Access Check API
 *
 * Returns whether the current user can access admin features.
 * Used by Header component to show/hide admin link.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { checkAdminAccess } from '@/lib/utils/admin-access'

interface AdminAccessResponse {
  canAccessAdmin: boolean
  isProduction: boolean
  isAuthenticated: boolean
}

interface ErrorResponse {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminAccessResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const userEmail = session?.user?.email
    const accessResult = checkAdminAccess(userEmail)

    // eslint-disable-next-line no-console
    console.log('[Admin Check API]', {
      isAuthenticated: !!session?.user,
      canAccessAdmin: accessResult.canAccessAdmin,
      isProduction: accessResult.isProduction,
      reason: accessResult.reason,
    })

    return res.status(200).json({
      canAccessAdmin: accessResult.canAccessAdmin,
      isProduction: accessResult.isProduction,
      isAuthenticated: !!session?.user,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Admin Check API Error]', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
