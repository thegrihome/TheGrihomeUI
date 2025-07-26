import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { saveUserSession, getUserSession, clearUserSession } from '@/lib/cookies'

// Helper function to ensure user object has all required computed fields
const normalizeUser = (user: any): User => {
  if (!user) return user

  return {
    ...user,
    // Add backward compatibility for mobileNumber
    mobileNumber: user.mobileNumber || user.phone,
    // Compute isEmailVerified from emailVerified
    isEmailVerified: !!user.emailVerified,
    // Compute isMobileVerified from mobileVerified field
    isMobileVerified: !!user.mobileVerified,
    // Compute isAgent from role
    isAgent: user.role === 'AGENT',
    // Add backward compatibility for imageLink
    imageLink: user.imageLink || user.image,
    // Keep existing companyName if present
    companyName: user.companyName,
  }
}

export interface User {
  id: string
  username: string
  name?: string
  email: string
  phone?: string
  emailVerified?: Date | string | null
  mobileVerified?: Date | string | null
  role: string
  image?: string
  createdAt: string
  // Computed fields
  mobileNumber?: string // For backward compatibility
  isEmailVerified?: boolean // Computed from emailVerified
  isMobileVerified?: boolean // Computed from phone verification status
  isAgent?: boolean // Computed from role === 'AGENT'
  imageLink?: string // For backward compatibility with image
  companyName?: string // For agent company names (stored elsewhere or computed)
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signupStep: 'form' | 'email-otp' | 'mobile-otp' | 'completed'
  loginMethod: 'username-password' | 'email-otp' | 'mobile-otp' | null
  signupFormData: {
    firstName: string
    lastName: string
    username: string
    email: string
    mobile: string
    password: string
    isAgent: boolean
  } | null
}

// Load user from cookies on initialization
const loadUserFromCookies = (): { user: User | null; isAuthenticated: boolean } => {
  try {
    const savedUser = getUserSession()
    const normalizedUser = savedUser ? normalizeUser(savedUser) : null
    return {
      user: normalizedUser,
      isAuthenticated: !!normalizedUser,
    }
  } catch (error) {
    return {
      user: null,
      isAuthenticated: false,
    }
  }
}

const initialUserState = loadUserFromCookies()

const initialState: AuthState = {
  user: initialUserState.user,
  isAuthenticated: initialUserState.isAuthenticated,
  isLoading: false,
  error: null,
  signupStep: 'form',
  loginMethod: null,
  signupFormData: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSignupStep: (state, action: PayloadAction<AuthState['signupStep']>) => {
      state.signupStep = action.payload
    },
    setLoginMethod: (state, action: PayloadAction<AuthState['loginMethod']>) => {
      state.loginMethod = action.payload
    },
    setUser: (state, action: PayloadAction<User>) => {
      const normalizedUser = normalizeUser(action.payload)
      state.user = normalizedUser
      state.isAuthenticated = true
      // Save to cookies
      saveUserSession(normalizedUser)
    },
    setSignupFormData: (state, action: PayloadAction<AuthState['signupFormData']>) => {
      state.signupFormData = action.payload
    },
    resetSignupForm: state => {
      state.signupStep = 'form'
      state.signupFormData = null
      state.error = null
    },
    logout: state => {
      state.user = null
      state.isAuthenticated = false
      state.signupStep = 'form'
      state.loginMethod = null
      state.signupFormData = null
      state.error = null
      // Clear cookies
      clearUserSession()
    },
    verifyEmail: state => {
      if (state.user) {
        state.user.isEmailVerified = true
      }
    },
    verifyMobile: state => {
      if (state.user) {
        state.user.isMobileVerified = true
      }
    },
    initializeAuth: state => {
      const sessionData = loadUserFromCookies()
      state.user = sessionData.user
      state.isAuthenticated = sessionData.isAuthenticated
    },
  },
})

export const {
  setLoading,
  setError,
  setSignupStep,
  setLoginMethod,
  setUser,
  setSignupFormData,
  resetSignupForm,
  logout,
  verifyEmail,
  verifyMobile,
  initializeAuth,
} = authSlice.actions

export default authSlice.reducer
