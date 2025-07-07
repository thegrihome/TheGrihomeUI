import { useRouter } from 'next/router'
import Link from 'next/link'
import type { NextPage } from 'next'

const Footer: NextPage = () => {
  const router = useRouter()
  const githubEditLink =
    router.pathname === '/'
      ? 'https://github.com/minor/plutonium/edit/main/pages/index.js'
      : `https://github.com/minor/plutonium/edit/main/pages${router.pathname}.js`

  return (
    <footer className="text-black dark:text-gray-300 body-font">
      <div className="container flex flex-col items-center px-10 pb-8 mx-auto border-t border-purple-600 dark:border-purple-300 sm:flex-row">
        <Link href="/" passHref>
          <a className="flex items-center justify-center mt-3 text-xl font-medium title-font md:ml-3 md:justify-start">
            PLUTONIUM
          </a>
        </Link>

        <div className="invisible h-5 mt-3 ml-4 border-l border-black md:visible dark:border-gray-300" />

        <a
          className="flex items-center justify-center mt-3 font-medium title-font md:justify-start"
          href={githubEditLink}
          target="_blank"
          rel="noreferrer"
        >
          <span className="text-sm md:ml-5">Edit on GitHub</span>
        </a>

        <span className="inline-flex justify-center mt-4 sm:ml-auto sm:mt-3 sm:justify-start">
          <a
            aria-label="mail"
            href="mailto:me@saurish.com?subject=From Plutonium!"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </a>
          <a
            aria-label="twitter"
            className="ml-3"
            href="https://twitter.com/saurishhh"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </a>
          <a
            aria-label="instagram"
            className="ml-3"
            href="https://instagram.com/saurishhh"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01" />
            </svg>
          </a>
          <a aria-label="linkedin" className="ml-3" href="#" target="_blank" rel="noreferrer">
            <svg
              fill="currentColor"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={0}
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path
                stroke="none"
                d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"
              />
              <circle cx="4" cy="4" r="2" stroke="none" />
            </svg>
          </a>
          <a
            aria-label="github"
            className="ml-3"
            href="https://github.com/minor/plutonium/"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              width="30"
              height="20"
              viewBox="0 0 25 24"
              fill="none"
              className="w-5 h-5"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.3 0C5.5 0 0 5.5 0 12.3c0 5.4 3.5 10 8.4 11.6.6.1.8-.3.8-.6 0-.3 0-1.1 0-2.1-3.4.8-4.1-1.5-4.1-1.5-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.9 1.4 3.6 1.1.1-.8.5-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.3 1.3-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.4 1.3 1-.3 2.1-.5 3.1-.5s2.1.2 3.1.5c2.4-1.6 3.4-1.3 3.4-1.3.6 1.6.2 2.9.1 3.2.8.8 1.3 1.8 1.3 3.1 0 4.6-2.9 5.6-5.6 5.9.4.3.8 1 .8 2v3c0 .3.2.7.8.6 4.9-1.6 8.4-6.2 8.4-11.6C24.6 5.5 19.1 0 12.3 0z"
              />
            </svg>
          </a>
        </span>
      </div>
    </footer>
  )
}

export default Footer
