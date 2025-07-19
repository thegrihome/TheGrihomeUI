import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  mobile: string
  isEmailVerified: boolean
  isMobileVerified: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signupStep: 'form' | 'email-otp' | 'mobile-otp' | 'completed'
  loginMethod: 'email-password' | 'email-otp' | 'mobile-otp' | null
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

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
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
    },
    setSignupFormData: (state, action: PayloadAction<AuthState['signupFormData']>) => {
      state.signupFormData = action.payload
    },
    resetSignupForm: (state) => {
      state.signupStep = 'form'
      state.signupFormData = null
      state.error = null
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.signupStep = 'form'
      state.loginMethod = null
      state.signupFormData = null
      state.error = null
    },
    verifyEmail: (state) => {
      if (state.user) {
        state.user.isEmailVerified = true
      }
    },
    verifyMobile: (state) => {
      if (state.user) {
        state.user.isMobileVerified = true
      }
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
} = authSlice.actions

export default authSlice.reducer