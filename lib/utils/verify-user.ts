import { prisma } from '@/lib/cockroachDB/prisma'

export interface VerificationResult {
  isVerified: boolean
  message?: string
}

export async function checkUserVerification(userId: string): Promise<VerificationResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, mobileVerified: true },
  })

  if (!user) {
    return { isVerified: false, message: 'User not found' }
  }

  if (!user.emailVerified && !user.mobileVerified) {
    return {
      isVerified: false,
      message: 'Please verify your email or mobile number to perform this action',
    }
  }

  return { isVerified: true }
}
