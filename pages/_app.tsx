import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import toast, { Toaster, ToastBar } from 'react-hot-toast'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

function RouteChangeSpinner() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        setLoading(true)
      }
    }
    const handleComplete = () => setLoading(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  if (!loading) return null

  return (
    <div className="route-change-overlay">
      <div className="route-change-spinner" />
    </div>
  )
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <RouteChangeSpinner />
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          },
        }}
      >
        {t => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="toast-close-btn"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </SessionProvider>
  )
}
