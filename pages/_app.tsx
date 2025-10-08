import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import Script from 'next/script'

declare global {
  interface Window {
    googleMapsLoaded?: boolean
  }
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
        onLoad={() => {
          window.googleMapsLoaded = true
        }}
      />
      <Component {...pageProps} />
    </SessionProvider>
  )
}
