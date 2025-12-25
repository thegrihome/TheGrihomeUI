import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#9333ea" />
      </Head>
      <body>
        <Main />
        <NextScript />
        {/* MSG91 OTP Widget */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var configuration = {
                widgetId: "356c6970364a393730313130",
                tokenAuth: "480266TyctAMdwlC6938d6e3P1",
                exposeMethods: true,
                success: function(data) {
                  // OTP sent successfully
                },
                failure: function(error) {
                  // OTP sending failed
                }
              };
              (function loadOtpScript(urls) {
                var i = 0;
                function attempt() {
                  var s = document.createElement('script');
                  s.src = urls[i];
                  s.async = true;
                  s.onload = function() {
                    if (typeof window.initSendOTP === 'function') {
                      window.initSendOTP(configuration);
                    }
                  };
                  s.onerror = function() {
                    i++;
                    if (i < urls.length) {
                      attempt();
                    }
                  };
                  document.head.appendChild(s);
                }
                attempt();
              })([
                'https://verify.msg91.com/otp-provider.js',
                'https://verify.phone91.com/otp-provider.js'
              ]);
            `,
          }}
        />
      </body>
    </Html>
  )
}
