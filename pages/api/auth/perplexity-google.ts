import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const mockToken = `perplexity_google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    res.setHeader('Content-Type', 'text/html')
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Perplexity AI Google Authentication</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            .checkmark {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            .loading {
              display: inline-block;
              width: 20px;
              height: 20px;
              border: 3px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top-color: #fff;
              animation: spin 1s ease-in-out infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">🔮</div>
            <h2>Successfully connected to Perplexity AI via Google!</h2>
            <p>You can now close this window and return to the main page.</p>
            <div class="loading"></div>
          </div>
          <script>
            localStorage.setItem('perplexity_oauth_token', '${mockToken}');
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
