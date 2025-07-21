import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, email, mobileNumber, password, isAgent, imageLink } = req.body

    // Basic validation
    if (!firstName || !lastName || !email || !mobileNumber || !password) {
      return res.status(400).json({ message: 'All required fields must be provided' })
    }

    // Check if user already exists (email or mobile)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: mobileNumber }],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'Email is already registered' })
      }
      if (existingUser.phone === mobileNumber) {
        return res.status(409).json({ message: 'Mobile number is already registered' })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        phone: mobileNumber,
        password: hashedPassword,
        role: isAgent ? 'AGENT' : 'BUYER',
        image: imageLink || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    res.status(201).json({
      message: 'User created successfully',
      user,
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Signup error:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
