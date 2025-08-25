import '@/styles/globals.css'
import '@/styles/rich-text-editor.css'
import '@/styles/components/auth/AuthModal.css'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { store } from '@/store/store'
import { initializeAuth } from '@/store/slices/authSlice'

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()

  useEffect(() => {
    // Initialize auth state from cookies on app start
    dispatch(initializeAuth())
  }, [dispatch])

  return <>{children}</>
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <AuthInitializer>
          <Component {...pageProps} />
        </AuthInitializer>
      </Provider>
    </SessionProvider>
  )
}
