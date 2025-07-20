import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../pages/api/auth/[...nextauth]'

export async function getServerAuthSession(req: NextApiRequest, res: NextApiResponse) {
  return await getServerSession(req, res, authOptions)
}

// Client-side auth utilities
export { useSession, signIn, signOut } from 'next-auth/react'
