import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function UserinfoRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/userinfo')
  }, [router])

  return null
}
