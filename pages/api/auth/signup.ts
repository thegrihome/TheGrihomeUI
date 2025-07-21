import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const {
    firstName,
    lastName,
    username,
    email,
    mobileNumber,
    password,
    isAgent = false,
    companyName,
    imageLink,
  } = req.body

  if (!firstName || !lastName || !username || !email || !mobileNumber || !password) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  if (isAgent && !companyName?.trim()) {
    return res.status(400).json({ message: 'Company name is required for agents' })
  }

  try {
    // Check if user already exists (email or username or mobile)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }, { mobileNumber }],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' })
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' })
      }
      if (existingUser.mobileNumber === mobileNumber) {
        return res.status(400).json({ message: 'Mobile number already exists' })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with new schema
    const user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        username,
        email,
        mobileNumber,
        password: hashedPassword,
        isAgent,
        role: isAgent ? 'AGENT' : 'BUYER',
        companyName: isAgent ? companyName : null,
        imageLink: imageLink || null,
        isEmailVerified: false,
        isMobileVerified: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        mobileNumber: true,
        isAgent: true,
        role: true,
        companyName: true,
        imageLink: true,
        isEmailVerified: true,
        isMobileVerified: true,
        createdAt: true,
      },
    })

    res.status(201).json({ user, message: 'User created successfully' })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Signup error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
