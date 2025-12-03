# 🚀 Secure Deployment Guide

This guide explains how to deploy TheGrihomeUI securely with automatic environment-based database selection.

## 🔒 Security Architecture

- **No secrets in code**: All database credentials are stored in Vercel environment variables
- **Environment-based routing**: Main branch → Production DB, Other branches → Development DB
- **SSL certificates**: Automatically downloaded and configured for CockroachDB

## 📋 Vercel Environment Variables Setup

### Required for ALL environments:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Database Configuration:

```bash
# Production Database (main branch deployments)
DATABASE_URL_PROD=postgresql://grihome:yjN9G8KchKviOFDC4T897A@grihome-main-13512.j77.aws-us-west-2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

# Development Database (preview/feature branches)
DATABASE_URL_DEV=postgresql://grihome:RMPz8t3iklLiLp3W57-WXA@grihome-dev-13513.j77.aws-us-west-2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
```

## 🛠 Setup Steps

### 1. Add Environment Variables to Vercel

**CRITICAL: You must add these environment variables in the Vercel Dashboard**

Go to your Vercel project dashboard → Settings → Environment Variables and add:

#### Required for ALL environments:

```
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
```

#### Database Configuration:

```
# For Production environment (main branch only):
DATABASE_URL_PROD=postgresql://grihome:yjN9G8KchKviOFDC4T897A@grihome-main-13512.j77.aws-us-west-2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

# For Preview/Development environments:
DATABASE_URL_DEV=postgresql://grihome:RMPz8t3iklLiLp3W57-WXA@grihome-dev-13513.j77.aws-us-west-2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
```

**Environment Scope Settings:**

- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`: All environments
- `DATABASE_URL_PROD`: Production only
- `DATABASE_URL_DEV`: Preview and Development

### 2. SSL Certificate Setup

The system automatically handles SSL certificates, but for local development:

```bash
# Download dev environment certificate
curl --create-dirs -o $HOME/.postgresql/root.crt 'https://cockroachlabs.cloud/clusters/67af60ef-fa9e-4e81-8e1c-544336573e5e/cert'
```

### 3. Database Migration

After deployment, run database migrations:

```bash
# For production
npx prisma db push --preview-feature

# For development
npx prisma db push
```

## 🔄 How It Works

### Environment Detection Logic

```typescript
// lib/database-config.ts automatically selects:

if (VERCEL_ENV === 'production' && VERCEL_GIT_COMMIT_REF === 'main') {
  // Use DATABASE_URL_PROD
} else {
  // Use DATABASE_URL_DEV
}
```

### Branch-based Routing

- **Main branch** → Vercel Production → Production CockroachDB
- **Feature branches** → Vercel Preview → Development CockroachDB
- **Local development** → Development CockroachDB

## 📊 Database Clusters

### Production Cluster

- **Host**: `grihome-main-13512.j77.aws-us-west-2.cockroachlabs.cloud`
- **Usage**: Main branch deployments only
- **SSL**: `verify-full` mode required

### Development Cluster

- **Host**: `grihome-dev-13513.j77.aws-us-west-2.cockroachlabs.cloud`
- **Usage**: All non-main branch deployments and local development
- **SSL**: `verify-full` mode required

## 🔍 Troubleshooting

### Database Connection Issues

```bash
# Check which database is being used
npm run dev
# Look for: 🗃️ Database Environment: production/development
```

### SSL Certificate Issues

```bash
# Re-download certificate for development
curl --create-dirs -o $HOME/.postgresql/root.crt 'https://cockroachlabs.cloud/clusters/67af60ef-fa9e-4e81-8e1c-544336573e5e/cert'
```

### Environment Variable Issues

```bash
# List Vercel environment variables
vercel env ls

# Test database connection
npx prisma db pull --preview-feature
```

## ⚠️ Security Best Practices

1. **Never commit** `.env.local` or any files containing credentials
2. **Rotate secrets** regularly via Vercel dashboard
3. **Use separate databases** for each environment
4. **Monitor database access** via CockroachDB Cloud console
5. **Enable audit logging** for production database

## 🎯 Quick Checklist

- [ ] SSL certificates downloaded for development
- [ ] Environment variables added to Vercel
- [ ] Database schemas migrated to both clusters
- [ ] Main branch deploys to production database
- [ ] Feature branches deploy to development database
- [ ] No secrets committed to repository
