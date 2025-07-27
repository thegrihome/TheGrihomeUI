import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import validator from 'validator'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      firstName,
      lastName,
      username,
      email,
      mobileNumber,
      password,
      isAgent,
      companyName,
      imageLink,
    } = req.body

    // Basic validation
    if (!firstName || !lastName || !username || !email || !mobileNumber || !password) {
      return res.status(400).json({ message: 'All required fields must be provided' })
    }

    // Validate company name for agents
    if (isAgent && !companyName?.trim()) {
      return res.status(400).json({ message: 'Company name is required for agents' })
    }

    // Validate username
    if (!username.trim() || username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' })
    }

    // Validate email format
    if (!validator.isEmail(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Validate mobile format
    const cleanedMobile = mobileNumber.replace(/\D/g, '')
    if (cleanedMobile.length < 7 || cleanedMobile.length > 15) {
      return res.status(400).json({ message: 'Invalid mobile number format' })
    }
    if (/^0+$/.test(cleanedMobile)) {
      return res.status(400).json({ message: 'Invalid mobile number format' })
    }
    // Basic mobile number validation - ensure it looks like a reasonable mobile number
    // Don't be too strict as different countries have different formats
    if (!/^[1-9]\d*$/.test(cleanedMobile)) {
      return res.status(400).json({ message: 'Invalid mobile number format' })
    }

    // Check if user already exists (username, email or mobile)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { phone: mobileNumber }],
      },
    })

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({ message: 'Username is already taken' })
      }
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
        username,
        name: `${firstName} ${lastName}`,
        email,
        phone: mobileNumber,
        password: hashedPassword,
        role: isAgent ? 'AGENT' : 'BUYER',
        companyName: isAgent ? companyName : null,
        image: imageLink || null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyName: true,
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
