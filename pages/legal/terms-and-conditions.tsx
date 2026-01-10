import Head from 'next/head'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const TermsAndConditions = () => {
  return (
    <>
      <Head>
        <title>Terms and Conditions | Grihome</title>
        <meta
          name="description"
          content="Terms and Conditions for using Grihome - India's trusted real estate platform"
        />
      </Head>

      <Header />

      <main className="terms-page">
        <div className="terms-container">
          <h1 className="terms-title">
            <span className="terms-title-black">Terms and </span>
            <span className="terms-title-gradient">Conditions</span>
          </h1>
          <p className="terms-updated">Last Updated: January 2025</p>

          <section className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              Welcome to Grihome. By accessing or using our website, mobile application, or any of
              our services, you agree to be bound by these Terms and Conditions. If you do not agree
              to these terms, please do not use our services.
            </p>
            <p>
              Grihome reserves the right to modify these terms at any time. Continued use of the
              platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Description of Services</h2>
            <p>
              Grihome is an online real estate platform that enables users to list, search, and
              discover properties for sale or rent. Our services include:
            </p>
            <ul>
              <li>Property listings for sale and rent</li>
              <li>Builder and project information</li>
              <li>Agent directory and contact services</li>
              <li>Community forum for real estate discussions</li>
              <li>Property search and filtering tools</li>
              <li>Saved searches and property alerts</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>3. User Registration and Accounts</h2>
            <p>
              To access certain features, you must register for an account. When registering, you
              agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Not share your account credentials with third parties</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms or
              engage in fraudulent activities.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Property Listings</h2>
            <p>Users who list properties on Grihome represent and warrant that:</p>
            <ul>
              <li>They have the legal right to list the property</li>
              <li>All information provided is accurate and not misleading</li>
              <li>Images and descriptions represent the actual property</li>
              <li>Pricing information is current and accurate</li>
              <li>The property complies with all applicable laws and regulations</li>
              <li>RERA registration details (where applicable) are valid and current</li>
            </ul>
            <p>
              Grihome reserves the right to remove any listing that violates these terms, contains
              inaccurate information, or is deemed inappropriate.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. User Conduct</h2>
            <p>Users agree not to:</p>
            <ul>
              <li>Post false, misleading, or fraudulent information</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Use the platform for illegal activities</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Scrape, crawl, or use automated tools to extract data</li>
              <li>Interfere with the proper functioning of the platform</li>
              <li>Upload viruses, malware, or harmful code</li>
              <li>Spam or send unsolicited communications</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. Intellectual Property</h2>
            <p>
              All content on Grihome, including but not limited to text, graphics, logos, images,
              and software, is the property of Grihome or its content suppliers and is protected by
              intellectual property laws.
            </p>
            <p>
              Users may not reproduce, distribute, modify, or create derivative works from any
              content without prior written consent from Grihome.
            </p>
            <p>
              By posting content on Grihome, users grant us a non-exclusive, royalty-free license to
              use, display, and distribute such content on our platform.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Privacy and Data Protection</h2>
            <p>
              Your use of Grihome is also governed by our Privacy Policy. By using our services, you
              consent to our collection and use of personal information as described in the Privacy
              Policy.
            </p>
            <p>We are committed to:</p>
            <ul>
              <li>Protecting your personal information</li>
              <li>Using data only for legitimate business purposes</li>
              <li>Not selling your personal information to third parties</li>
              <li>Implementing appropriate security measures</li>
              <li>Complying with applicable data protection laws</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>8. Third-Party Links and Services</h2>
            <p>
              Grihome may contain links to third-party websites or services. We are not responsible
              for the content, privacy policies, or practices of these third parties. Users access
              third-party sites at their own risk.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. Disclaimer of Warranties</h2>
            <p>
              Grihome provides its services on an &quot;as is&quot; and &quot;as available&quot;
              basis. We make no warranties, express or implied, regarding:
            </p>
            <ul>
              <li>The accuracy or completeness of property listings</li>
              <li>The reliability of information provided by users or agents</li>
              <li>The uninterrupted or error-free operation of our services</li>
              <li>The suitability of any property for your needs</li>
            </ul>
            <p>
              Users are advised to independently verify all property information before making any
              decisions.
            </p>
          </section>

          <section className="terms-section">
            <h2>10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Grihome and its affiliates, officers,
              directors, employees, and agents shall not be liable for:
            </p>
            <ul>
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages arising from your use of the platform</li>
              <li>Actions or omissions of third parties, including agents and builders</li>
              <li>Any disputes between users</li>
            </ul>
            <p>
              Grihome acts solely as an intermediary platform and is not a party to any transaction
              between users.
            </p>
          </section>

          <section className="terms-section">
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Grihome, its affiliates, and their respective
              officers, directors, employees, and agents from any claims, damages, losses, or
              expenses arising from:
            </p>
            <ul>
              <li>Your use of the platform</li>
              <li>Your violation of these terms</li>
              <li>Your violation of any rights of third parties</li>
              <li>Content you post on the platform</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>12. Dispute Resolution</h2>
            <p>
              Any disputes arising from or relating to these terms or your use of Grihome shall be
              resolved through:
            </p>
            <ul>
              <li>Initial good-faith negotiation between parties</li>
              <li>Mediation if negotiation fails</li>
              <li>Binding arbitration as a final resort</li>
            </ul>
            <p>
              These terms shall be governed by and construed in accordance with the laws of India,
              and the courts in Hyderabad shall have exclusive jurisdiction.
            </p>
          </section>

          <section className="terms-section">
            <h2>13. Termination</h2>
            <p>
              Grihome may terminate or suspend your access to our services at any time, without
              prior notice, for any reason including breach of these terms. Upon termination:
            </p>
            <ul>
              <li>Your right to use the platform ceases immediately</li>
              <li>We may delete your account and associated data</li>
              <li>Any pending transactions may be cancelled</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>14. Contact Information</h2>
            <p>For questions about these Terms and Conditions, please contact us at:</p>
            <div className="terms-contact">
              <p>
                <strong>Grihome</strong>
              </p>
              <p>Email: thegrihome@gmail.com</p>
            </div>
          </section>

          <section className="terms-section">
            <h2>15. Severability</h2>
            <p>
              If any provision of these terms is found to be invalid or unenforceable, the remaining
              provisions shall continue in full force and effect.
            </p>
          </section>

          <section className="terms-section">
            <h2>16. Entire Agreement</h2>
            <p>
              These Terms and Conditions, together with our Privacy Policy, constitute the entire
              agreement between you and Grihome regarding your use of our services and supersede any
              prior agreements.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default TermsAndConditions
