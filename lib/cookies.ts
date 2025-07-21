export const setCookie = (name: string, value: string, days: number = 30) => {
  if (typeof window === 'undefined') return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null

  const nameEQ = name + '='
  const cookies = document.cookie.split(';')

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length))
    }
  }
  return null
}

export const removeCookie = (name: string) => {
  if (typeof window === 'undefined') return

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

// Auth-specific cookie functions
export const AUTH_COOKIE_NAME = 'grihome_user_session'

export const saveUserSession = (user: any) => {
  try {
    const userJson = JSON.stringify(user)
    setCookie(AUTH_COOKIE_NAME, userJson, 30) // 30 days
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save user session:', error)
  }
}

export const getUserSession = () => {
  try {
    const userJson = getCookie(AUTH_COOKIE_NAME)
    return userJson ? JSON.parse(userJson) : null
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to retrieve user session:', error)
    return null
  }
}

export const clearUserSession = () => {
  removeCookie(AUTH_COOKIE_NAME)
}
