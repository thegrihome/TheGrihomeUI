import React from 'react'

const Features: React.FC = () => {
  return (
    <section id="features" className="py-12">
      <div className="max-w-xl px-4 py-12 mx-auto sm:px-6 lg:max-w-6xl lg:px-8">
        <h1 className="mb-8 text-2xl font-bold tracking-normal text-center text-gray-800 md:leading-tight md:tracking-normal dark:text-gray-200 md:text-4xl">
          Supporting the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r dark:bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500 dark:from-rose-400 dark:via-fuchsia-400 dark:to-indigo-400">
            finest
          </span>{' '}
          and{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r dark:bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-rose-400">
            richest
          </span>{' '}
          features.
        </h1>

        <p className="max-w-md mx-auto mb-10 text-lg text-gray-600 dark:text-gray-400 md:text-lg">
          We&apos;re introducing a new wave of template designs that sky-rocket
          the interaction between users and <b>your</b> app.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="mb-10 space-y-6">
              <h2 className="text-xl font-bold text-center text-rose-600 dark:text-rose-300 md:text-2xl sm:text-left">
                {feature.title}
              </h2>
              <div className="h-auto">
                <a href={feature.link} target="_blank" rel="noreferrer">
                  <img
                    className="transition duration-700 rounded shadow-2xl h-80 hover:shadow-3xl md:hover:transform md:hover:scale-105"
                    src={feature.image}
                    alt={`Placeholder for ${feature.title}`}
                  />
                </a>
              </div>
              <ul className="mx-2 mr-0 font-normal text-gray-500 dark:text-gray-400 text-md md:mr-10">
                {feature.points.map((point, i) => (
                  <li key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: point }} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features

interface Feature {
  title: string
  link: string
  image: string
  points: string[]
}

const features: Feature[] = [
  {
    title: 'Next.js 11',
    link: 'https://unsplash.com/photos/ymVslcVAzg8',
    image: '/images/placeholder-2.webp',
    points: [
      '<span class="font-semibold">Conformance</span>: A system that provides carefully crafted solutions to support optimal UX.',
      '<span class="font-semibold">Improved Performance</span>: Further optimizations to improve cold startup time.',
      '<span class="text-purple-500 dark:text-purple-400 px-1 py-0.75 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-100 dark:bg-gray-900">`next/script`</span> updates',
      '<span class="text-purple-500 dark:text-purple-400 px-1 py-0.75 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-100 dark:bg-gray-900">`next/image`</span> updates',
    ],
  },
  {
    title: 'TailwindCSS JIT',
    link: 'https://unsplash.com/photos/qOEiV-8w-MQ',
    image: '/images/placeholder-3.webp',
    points: [
      '<span class="font-semibold">Just-in-Time Mode</span>: A faster, more powerful engine for Tailwind CSS v2.1+.',
      '<span class="font-semibold">Lightning fast build times</span>',
      '<span class="font-semibold">Identical CSS in development and production</span>',
      '<span class="font-semibold">Better browser performance in development</span>',
      '<span class="text-purple-500 dark:text-purple-400 px-1 py-0.75 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-100 dark:bg-gray-900">`mode: \'jit\'`</span>',
    ],
  },
  {
    title: 'Dark Mode',
    link: 'https://unsplash.com/photos/p7o0qrl8hv8',
    image: '/images/placeholder-4.webp',
    points: [
      '<a href="https://github.com/pacocoursey/next-themes" target="_blank" rel="noreferrer" class="font-semibold">next-themes</a>: An abstraction for themes in your Next.js app.',
      '<span class="font-semibold">System settings</span>: Uses system settings to activate dark mode/light mode.',
      '<span class="font-semibold">No flash</span>: No flash on switching themes or load in both SSG and SSR.',
      '<span class="text-purple-500 dark:text-purple-400 px-1 py-0.75 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-100 dark:bg-gray-900">`useTheme`</span> hook',
    ],
  },
  {
    title: 'Next-SEO',
    link: 'https://unsplash.com/photos/_CrD1UmfWqc',
    image: '/images/placeholder-5.webp',
    points: [
      '<a href="https://github.com/garmeeh/next-seo" target="_blank" rel="noreferrer" class="font-semibold">next-seo</a>: A plugin that makes managing your SEO easier.',
      '<span class="font-semibold">Renders to head</span>: Props passed into <span class="text-purple-500 dark:text-purple-400 px-1 py-0.75 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-100 dark:bg-gray-900">`next-seo`</span> render tags into <span class="text-purple-500 dark:text-purple-400 px-1 py-0.75 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-100 dark:bg-gray-900">`&lt;head&gt;`</span>.',
      '<span class="font-semibold">Bare minimum</span>: Should at least have access to a description & a title.',
    ],
  },
]
