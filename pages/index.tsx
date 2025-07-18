import Head from 'next/head'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sponsors from '@/components/Sponsors'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'

export default function Home() {
  return (
    <div className="bg-white dark:bg-black min-h-screen flex flex-col">
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

      <section className="relative flex-1 flex items-start justify-center pt-16">
        <div className="px-4 mx-auto max-w-7xl">
          <div className="w-full mx-auto text-center md:w-11/12">
            <h1 className="mb-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              <span className="whitespace-nowrap block">Redefining Real Estate</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r dark:bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 dark:from-pink-500 dark:via-purple-400 dark:to-indigo-500 block">with you.</span>
            </h1>
            <p className="max-w-xl pt-5 mx-auto text-lg text-gray-600 dark:text-gray-400 md:text-lg">
              Grihome is a next-generation real estate platform that empowers realtors, buyers, and companies to connect seamlessly without boundaries
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-6 mt-8 mb-8">
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-3xl mb-2">🏛️</div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Hyderabad</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-3xl mb-2">🏖️</div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Chennai</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-3xl mb-2">🌆</div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Bengaluru</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-3xl mb-2">🏙️</div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Mumbai</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-3xl mb-2">🏛️</div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Delhi</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-3xl mb-2">🌉</div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Kolkata</span>
              </div>
            </div>
            
            <div className="relative max-w-2xl mx-auto mt-8">
              <div className="flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter a property, locality or ZIP code"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
