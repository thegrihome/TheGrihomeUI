import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function SignupRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/signup')
  }, [router])

  return null
}
