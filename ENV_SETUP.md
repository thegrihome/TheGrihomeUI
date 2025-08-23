# Environment Variables Setup Guide

This document explains how to set up environment variables for local development and deployment.

## Quick Setup

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values** in `.env.local` (see sections below for how to get each key)

## Required Environment Variables

### 🔐 Database (CockroachDB)

**Development Database:**

```env
DATABASE_URL="postgresql://username:password@cluster-host:26257/defaultdb?sslmode=verify-full&connection_limit=5&pool_timeout=20&statement_timeout=30s"
```

**How to get it:**

1. Go to [CockroachDB Cloud Console](https://cockroachlabs.cloud/)
2. Create a cluster or use existing one
3. Go to **Connect** → **General connection string**
4. Copy the connection string and replace in `.env.local`

### 🔑 NextAuth

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here
```

**How to get NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 📧 Resend (Email Service)

```env
RESEND_API_KEY=re_xxxxxxxxxx
```

**How to get it:**

1. Go to [Resend.com](https://resend.com)
2. Sign up/login
3. Go to **API Keys** → **Create API Key**
4. Copy the key starting with `re_`

### 🗺️ Google Maps API

```env
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxx
```

**How to get it:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project or select existing
3. Enable **Places API** and **Maps JavaScript API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Restrict the key to your domains for security

### 🔍 Google OAuth (Optional)

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**How to get it:**

1. In Google Cloud Console, go to **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client IDs**
3. Set application type to **Web application**
4. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

## Deployment (Vercel)

### Environment Variables to Add in Vercel:

1. Go to your Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Add each variable:

**Required for all deployments:**

- `NEXTAUTH_URL` → `https://yourdomain.com`
- `NEXTAUTH_SECRET` → (same as local)
- `DATABASE_URL` → (your production database URL)
- `RESEND_API_KEY` → (same as local)
- `GOOGLE_MAPS_API_KEY` → (same as local, or restricted for production domain)

**Optional:**

- `GOOGLE_CLIENT_ID` → (update redirect URIs for production domain)
- `GOOGLE_CLIENT_SECRET` → (same as local)

### Security Notes:

⚠️ **Never commit `.env.local` or `.env` files to git**
⚠️ **Use different database clusters for development and production**
⚠️ **Restrict API keys to specific domains in production**
⚠️ **Rotate secrets regularly**

## Testing Your Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Check for missing variables in the console
3. Test features that require external services:
   - Maps loading
   - Email sending (contact form)
   - Database connections
   - Authentication

## Troubleshooting

**"Missing environment variable" errors:**

- Ensure all required variables are in `.env.local`
- Restart the dev server after adding variables

**Database connection issues:**

- Check your CockroachDB cluster is running
- Verify the connection string format
- Check firewall/network settings

**API key issues:**

- Verify keys are active and not expired
- Check API quotas and usage limits
- Ensure correct permissions/scopes are enabled
