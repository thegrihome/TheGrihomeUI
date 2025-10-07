import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AddPropertyRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/properties/add-property')
  }, [router])

  return null
}
