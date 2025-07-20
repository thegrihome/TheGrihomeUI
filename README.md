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
# Edit .env.local with your development credentials
```

### 3. SSL Certificate (Development)

```bash
curl --create-dirs -o $HOME/.postgresql/root.crt 'https://cockroachlabs.cloud/clusters/67af60ef-fa9e-4e81-8e1c-544336573e5e/cert'
```

### 4. Database Migration

```bash
npx prisma db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## 🔒 Secure Deployment

For production deployment with automatic environment-based database routing, see [DEPLOYMENT.md](./DEPLOYMENT.md).

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
