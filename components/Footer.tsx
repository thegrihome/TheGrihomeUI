import Link from 'next/link'
import type { NextPage } from 'next'

const Footer: NextPage = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-copyright">Copyright: © Grihome. All rights reserved</div>

        <div className="footer-links">
          <Link
            href="/legal/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Terms & Conditions
          </Link>
        </div>

        <div className="footer-social-links">
          <a
            aria-label="mail"
            href="mailto:thegrihome@gmail.com?subject=From Grihome!"
            className="footer-social-link"
          >
            <svg
              className="footer-social-icon"
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
            aria-label="X"
            href="https://x.com/grihome"
            target="_blank"
            rel="noreferrer"
            className="footer-social-link"
          >
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              className="footer-social-icon"
              viewBox="0 0 24 24"
            >
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </a>
          <a
            aria-label="instagram"
            href="https://instagram.com/gri.home"
            target="_blank"
            rel="noreferrer"
            className="footer-social-link"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              className="footer-social-icon"
              viewBox="0 0 24 24"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01" />
            </svg>
          </a>
          <a
            aria-label="facebook"
            href="https://www.facebook.com/profile.php?id=61579380794505"
            target="_blank"
            rel="noreferrer"
            className="footer-social-link"
          >
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              className="footer-social-icon"
              viewBox="0 0 24 24"
            >
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
