# TheGrihomeUI - Real Estate Platform

A modern real estate platform built with Next.js, NextAuth.js, and CockroachDB.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [CockroachDB](https://cockroachlabs.com/) - Distributed SQL database
- [Prisma](https://prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 🛠 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

The `.env.example` already contains working development database credentials that point to our shared dev CockroachDB cluster. No additional setup required!

### 3. SSL Certificate (Development)

```bash
curl --create-dirs -o $HOME/.postgresql/root.crt 'https://cockroachlabs.cloud/clusters/67af60ef-fa9e-4e81-8e1c-544336573e5e/cert'
```

### 4. Database Setup

The database schema is already deployed to the dev cluster. You can optionally generate Prisma client:

```bash
npx prisma generate
```

### 5. Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## 🎯 Quick Test

After setup, you can test the signup functionality:

1. Go to `/signup`
2. Fill in the form with first name, last name, email, etc.
3. Optionally check "Do you want to signup as an agent?" to test logo upload
4. Submit and verify the user is created in the dev database

## 🔒 Secure Deployment

For production deployment with automatic environment-based database routing, see [docs/setup/DEPLOYMENT.md](./docs/setup/DEPLOYMENT.md).

## 🚀 Features

- **Authentication**: NextAuth.js with Google OAuth and email/password
- **Database**: CockroachDB with Prisma ORM for scalability
- **Real Estate Schema**: Properties, users, saved searches, images
- **User Roles**: Buyer, Seller, Agent, Admin
- **Image Management**: CDN URLs stored in database
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 📊 Database Schema

- **Users**: Authentication and profile data with role-based access
- **Properties**: Real estate listings with geolocation support
- **PropertyImages**: CDN URLs for property photos
- **SavedProperties**: User favorites and watchlists
- **SavedSearches**: Stored search criteria for notifications

## 🌐 Deploy to Vercel

1. Push this code to a GitHub repo
2. Import it in [Vercel](https://vercel.com/import/git)
3. Add environment variables in Vercel dashboard
4. Deploy instantly with automatic CI/CD
