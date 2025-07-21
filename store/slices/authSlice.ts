import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { saveUserSession, getUserSession, clearUserSession } from '@/lib/cookies'

export interface User {
  id: string
  username: string
  name?: string
  email: string
  mobileNumber?: string
  isEmailVerified: boolean
  isMobileVerified: boolean
  isAgent: boolean
  role: string
  companyName?: string
  imageLink?: string
  createdAt: string
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
    return {
      user: savedUser,
      isAuthenticated: !!savedUser,
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
      state.user = action.payload
      state.isAuthenticated = true
      // Save to cookies
      saveUserSession(action.payload)
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
