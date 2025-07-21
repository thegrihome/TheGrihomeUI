import { User } from '@/store/slices/authSlice'

export interface SignupData {
  firstName: string
  lastName: string
  username: string
  email: string
  mobile: string
  password: string
  isAgent?: boolean
}

export interface LoginData {
  email?: string
  mobile?: string
  password?: string
}

export interface OTPData {
  email?: string
  mobile?: string
  otp: string
}

// Mock API functions - replace with actual API calls
export const authService = {
  signup: async (data: SignupData): Promise<{ user: User; tempId: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${data.firstName} ${data.lastName}`,
      username: data.username,
      email: data.email,
      mobileNumber: data.mobile,
      isEmailVerified: false,
      isMobileVerified: false,
      isAgent: data.isAgent || false,
      role: data.isAgent ? 'AGENT' : 'BUYER',
      createdAt: new Date().toISOString(),
    }

    return { user, tempId: 'temp-' + user.id }
  },

  sendEmailOTP: async (email: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log(`Email OTP sent to ${email}`)
  },

  sendMobileOTP: async (mobile: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log(`Mobile OTP sent to ${mobile}`)
  },

  verifyEmailOTP: async (data: OTPData): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Mock validation - in real app, verify with backend
    return data.otp === '123456'
  },

  verifyMobileOTP: async (data: OTPData): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Mock validation - in real app, verify with backend
    return data.otp === '123456'
  },

  loginWithEmailPassword: async (data: LoginData): Promise<User> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock user data - replace with actual API response
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'John Doe',
      username: 'johndoe',
      email: data.email || '',
      mobileNumber: '+1234567890',
      isEmailVerified: true,
      isMobileVerified: true,
      isAgent: false,
      role: 'BUYER',
      createdAt: new Date().toISOString(),
    }
  },

  loginWithEmailOTP: async (data: OTPData): Promise<User> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (data.otp !== '123456') {
      throw new Error('Invalid OTP')
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'John Doe',
      username: 'johndoe',
      email: data.email || '',
      mobileNumber: '+1234567890',
      isEmailVerified: true,
      isMobileVerified: true,
      isAgent: false,
      role: 'BUYER',
      createdAt: new Date().toISOString(),
    }
  },

  loginWithMobileOTP: async (data: OTPData): Promise<User> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (data.otp !== '123456') {
      throw new Error('Invalid OTP')
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      mobileNumber: data.mobile || '',
      isEmailVerified: true,
      isMobileVerified: true,
      isAgent: false,
      role: 'BUYER',
      createdAt: new Date().toISOString(),
    }
  },
}
