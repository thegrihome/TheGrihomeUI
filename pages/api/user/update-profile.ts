/**
 * Update User Profile API
 *
 * Updates user profile information including:
 * - First name and last name (combined into `name` field)
 * - Email (only if verified)
 * - Mobile number (only if verified)
 *
 * Name changes don't require verification.
 * Email/mobile changes require prior OTP verification.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  newEmail?: string
  emailVerified?: boolean
  newMobile?: string
  mobileVerified?: boolean
}

interface UpdateProfileResponse {
  success: boolean
  message: string
  updatedFields: string[]
  skippedFields?: string[]
}

interface ErrorResponse {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateProfileResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const {
      firstName,
      lastName,
      newEmail,
      emailVerified,
      newMobile,
      mobileVerified,
    }: UpdateProfileRequest = req.body

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    const updateData: {
      name?: string
      email?: string
      emailVerified?: Date
      phone?: string
      mobileVerified?: Date
    } = {}
    const updatedFields: string[] = []
    const skippedFields: string[] = []

    // Handle name changes (no verification required)
    if (firstName !== undefined || lastName !== undefined) {
      const currentNameParts = currentUser.name?.split(' ') || ['', '']
      const currentFirst = currentNameParts[0] || ''
      const currentLast = currentNameParts.slice(1).join(' ') || ''

      const newFirst = firstName !== undefined ? firstName.trim() : currentFirst
      const newLast = lastName !== undefined ? lastName.trim() : currentLast
      const newName = `${newFirst} ${newLast}`.trim()

      if (newName !== currentUser.name) {
        updateData.name = newName
        updatedFields.push('name')
      }
    }

    // Handle email changes (requires verification)
    if (newEmail && newEmail !== currentUser.email) {
      if (!emailVerified) {
        skippedFields.push('email (not verified)')
      } else {
        // Check if new email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email: newEmail },
        })

        if (existingUser && existingUser.id !== currentUser.id) {
          return res.status(400).json({ message: 'Email is already in use' })
        }

        updateData.email = newEmail
        updateData.emailVerified = new Date()
        updatedFields.push('email')
      }
    }

    // Handle mobile changes (requires verification)
    if (newMobile && newMobile !== currentUser.phone) {
      if (!mobileVerified) {
        skippedFields.push('mobile (not verified)')
      } else {
        // Check if new mobile is already taken
        const existingUser = await prisma.user.findFirst({
          where: { phone: newMobile },
        })

        if (existingUser && existingUser.id !== currentUser.id) {
          return res.status(400).json({ message: 'Mobile number is already in use' })
        }

        updateData.phone = newMobile
        updateData.mobileVerified = new Date()
        updatedFields.push('mobile')
      }
    }

    // If there are fields to update, perform the update
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: updateData,
      })
    }

    // Build response message
    let message = ''
    if (updatedFields.length > 0) {
      message = `Successfully updated: ${updatedFields.join(', ')}`
      if (skippedFields.length > 0) {
        message += `. Skipped: ${skippedFields.join(', ')}`
      }
    } else if (skippedFields.length > 0) {
      message = `No changes saved. Skipped: ${skippedFields.join(', ')}`
    } else {
      message = 'No changes to update'
    }

    return res.status(200).json({
      success: updatedFields.length > 0,
      message,
      updatedFields,
      skippedFields: skippedFields.length > 0 ? skippedFields : undefined,
    })
  } catch {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
