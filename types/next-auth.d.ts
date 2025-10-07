import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      username?: string
      mobileNumber?: string | null
      isEmailVerified?: boolean
      isMobileVerified?: boolean
      isAgent?: boolean
      companyName?: string | null
      imageLink?: string | null
    }
  }

  interface User {
    role?: string
    image?: string | null
    username?: string
    mobileNumber?: string | null
    isEmailVerified?: boolean
    isMobileVerified?: boolean
    isAgent?: boolean
    companyName?: string | null
    imageLink?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    image?: string | null
    username?: string
    mobileNumber?: string | null
    isEmailVerified?: boolean
    isMobileVerified?: boolean
    isAgent?: boolean
    companyName?: string | null
    imageLink?: string | null
  }
}
