import Head from 'next/head'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <NextSeo
        title="Grihome"
        description="Grihome — Redefining Real Estate with you."
        canonical="https://grihome.vercel.app/"
        openGraph={{
          url: 'https://grihome.vercel.app/',
          title: 'Grihome',
          description: 'Grihome — Redefining Real Estate with you.',
          images: [
            {
              url: 'blob:https://og-playground.vercel.app/8baff750-c782-4a04-b198-7ee3dd1e1974',
            },
          ],
          site_name: 'Grihome',
        }}
        twitter={{
          handle: '@urstrulymahesh',
          site: 'https://grihome.vercel.app/',
          cardType: 'summary_large_image',
        }}
      />
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <section className="relative flex-1 flex items-start justify-center pt-8">
        <div className="px-4 mx-auto max-w-7xl">
          <div className="w-full mx-auto text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                <span className="whitespace-nowrap block">Redefining Real Estate</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 block pb-1">with you.</span>
              </h1>
              
              
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 lg:gap-10 mt-8 mb-8">
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-3xl mb-2">🏛️</div>
                  <span className="text-sm text-gray-600 font-medium">Hyderabad</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-3xl mb-2">🏖️</div>
                  <span className="text-sm text-gray-600 font-medium">Chennai</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-3xl mb-2">🌆</div>
                  <span className="text-sm text-gray-600 font-medium">Bengaluru</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-3xl mb-2">🏙️</div>
                  <span className="text-sm text-gray-600 font-medium">Mumbai</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-3xl mb-2">🏛️</div>
                  <span className="text-sm text-gray-600 font-medium">Delhi</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-3xl mb-2">🌉</div>
                  <span className="text-sm text-gray-600 font-medium">Kolkata</span>
                </div>
              </div>
              
              <div className="relative mt-8">
                <div className="flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                    placeholder="Enter a property, locality or zip code"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
