# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

### 1. Never Cause Regressions

- **ALWAYS** verify that existing functionality still works after making changes
- **NEVER** delete code or files without understanding their dependencies
- **ALWAYS** check if deleted/moved files are imported elsewhere
- **NEVER** assume a file is unused without searching for all references
- **NEVER** create tsx files with inline css styling
- **ALWAYS** ensure that the dev and prod schemas are in sync with each other
- **ALWAYS** create css code in styles and make sure it works across all screens like mobile, ipad, desktop and ultra wide monitor
- **NEVER** waste tokens to run the build or start the dev server. Ask the user to do it.
- Common regression areas: navigation links, API endpoints, component imports, route redirects

### 2. File Organization - Use Appropriate Subfolders

**DO NOT** create files directly in root folders. Always use proper subdirectories:

**Pages:**

- ❌ `/pages/new-page.tsx`
- ✅ `/pages/properties/new-page.tsx`
- ✅ `/pages/auth/new-page.tsx`
- ✅ `/pages/forum/new-page.tsx`

**Components:**

- ❌ `/components/NewComponent.tsx`
- ✅ `/components/auth/NewComponent.tsx`
- ✅ `/components/properties/NewComponent.tsx`
- ✅ `/components/forum/NewComponent.tsx`

**Lib:**

- ❌ `/lib/new-utility.ts`
- ✅ `/lib/cockroachDB/new-utility.ts`
- ✅ `/lib/utils/new-utility.ts`

**API Routes:**

- ❌ `/pages/api/new-endpoint.ts`
- ✅ `/pages/api/user/new-endpoint.ts`
- ✅ `/pages/api/properties/new-endpoint.ts`
- ✅ `/pages/api/auth/new-endpoint.ts`

Existing subdirectories to use:

- Pages: `auth/`, `properties/`, `projects/`, `forum/`, `ads/`, `agents/`, `builders/`, `contactUs/`
- Components: `auth/`, `properties/`, `forum/`, `projects/`
- Lib: `cockroachDB/`, `utils/`
- API: `user/`, `properties/`, `projects/`, `auth/`, `forum/`, `ads/`, `agents/`, `builders/`, `interests/`, `project-requests/`, `cron/`

## Development Commands

### Run Development Server

```bash
npm run dev
```

Development server runs on http://localhost:3000 (or 3001 if 3000 is occupied).

### Build

```bash
npm run build
```

Runs type-check, lint, format-check, prisma generate, and Next.js build.

### Type Checking

```bash
npm run type-check
```

Runs TypeScript compiler without emitting files.

### Linting & Formatting

```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run format        # Format all files
npm run format:check  # Check formatting without changes
npm run check-all     # Run type-check, lint, and format-check
```

### Testing

```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci       # Run tests in CI mode
```

**Jest Configuration:**

- Test environment: jsdom (for React component testing)
- Module alias: `@/*` resolves to project root
- Test files: `**/__tests__/**/*.[jt]s?(x)` or `**/?(*.)+(spec|test).[jt]s?(x)`
- Coverage targets: pages, components, and lib directories
- Setup file: `jest.setup.js` (configures testing-library)

**Testing Stack:**

- Jest + React Testing Library
- Support for Next.js features (routing, API routes, etc.)
- 10-second timeout for tests
- Coverage collection from pages, components, and lib

### Database

```bash
npx prisma generate              # Generate Prisma Client
npx prisma db push              # Push schema changes to database
npx prisma studio               # Open Prisma Studio GUI
```

The project uses CockroachDB (distributed SQL). Two database environments:

- **Dev**: `grihome-dev-13513` - Development/testing database
- **Production**: `grihome-main-13512` - Production database

Database configuration is handled automatically in `lib/cockroachDB/database-config.ts` based on `NODE_ENV` and `VERCEL_ENV`.

## Architecture Overview

### Authentication System (NextAuth.js)

**Core Configuration**: `/pages/api/auth/[...nextauth].ts`

The authentication system supports three login methods:

1. **Password-based**: Email/username + password
2. **OTP-based**: Email/mobile + OTP (uses `123456` for development)
3. **Google OAuth**: OAuth provider

**Important Session Management:**

- JWT strategy (not database sessions)
- Session data enrichment happens in JWT callback
- User data is fetched from database when `!token.username` (first login or missing data)
- Session update via `update()` from `useSession()` triggers JWT refresh

**NextAuth Type Extensions**: `/types/next-auth.d.ts`
Extended session/user types include: `username`, `mobileNumber`, `isEmailVerified`, `isMobileVerified`, `isAgent`, `companyName`, `imageLink`

**Protected Routes Pattern:**

```typescript
const { data: session, status } = useSession()
useEffect(() => {
  if (status === 'authenticated') {
    router.push('/auth/userinfo') // Redirect if already logged in
  }
}, [status, router])
```

Login/signup pages redirect authenticated users to `/auth/userinfo`.

### Database Architecture

**Prisma Client Location**: `@/lib/cockroachDB/prisma`

- Environment-aware connection pooling (5 connections max for dev, 50 for prod)
- RU (Request Unit) monitoring middleware in development
- Custom connection timeout settings for CockroachDB optimization

**Key Models:**

- `User`: Authentication, roles (BUYER, SELLER, AGENT, ADMIN), verification status
- `Property`: Real estate listings with location relationship
- `PropertyImage`: Property images with display order
- `Project`: Builder projects (apartments, villas, etc.)
- `Builder`: Builder/developer profiles with logo, contact info, and website
- `Location`: Normalized location data with geocoding (lat/lng, locality, neighborhood)
- `ForumPost` / `ForumReply`: Community forum with reactions
- `PostReaction` / `ReplyReaction`: Like/dislike reactions on forum content
- `Ad`: Advertising slots system (6 slots for featured properties)
- `Interest`: Property/project interest tracking
- `ProjectRequest`: User requests for new projects
- `SavedProperty`: User-saved properties for later viewing
- `SavedSearch`: User-saved search queries with filters
- `ProjectAgent`: Many-to-many relationship between projects and agents
- `ProjectProperty`: Links properties to their parent projects

### Styling System

**CSS Organization**: All styles are imported through `styles/globals.css`

Structure:

```
styles/
├── components/
│   ├── Header.css
│   └── Footer.css
└── pages/
    ├── index.css
    ├── auth/
    │   ├── login.css
    │   ├── signup.css
    │   └── userinfo.css
    └── properties/
        ├── detail.css
        └── add-property.css
```

**Styling Approach:**

- Tailwind CSS for utility classes
- Component-specific CSS files for complex layouts
- Global CSS imports all component/page styles
- No CSS Modules (uses direct `.css` files)

### Page Structure Patterns

**Redirect Pages**: `/pages/login.tsx`, `/pages/signup.tsx`
These are redirect stubs that immediately redirect to `/auth/login` and `/auth/signup`.

**Authentication Pages**: `/pages/auth/*`

- `login.tsx`: Multi-method login (email/mobile OTP, password)
- `signup.tsx`: Registration with role selection (buyer/agent)
- `userinfo.tsx`: User profile management (NextAuth session-based)

**Main Features**:

- Properties: Listing, search, detail pages, add/edit, save properties
- Projects: Builder projects listing and detail, project requests
- Builders: Builder directory, profiles, and builder page management
- Forum: Category-based discussion system with reactions, user profiles, search
- Ads: 6-slot advertising system for featured properties (automated expiration)
- Agents: Agent directory and profiles
- Interests: Track user interest in properties/projects
- Saved Searches: Save and reuse search criteria

### API Route Patterns

**Standard Response Format:**

```typescript
return res.status(200).json({ user, properties, ... })  // Success
return res.status(400).json({ message: 'Error description' })  // Error
```

**Authentication in API Routes:**

```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const session = await getServerSession(req, res, authOptions)
if (!session?.user?.email) {
  return res.status(401).json({ message: 'Unauthorized' })
}
```

**Database Queries**: Always import from `@/lib/cockroachDB/prisma`

### Image Upload System

**Avatar/Image Upload**: Uses Vercel Blob storage

- Base64 images sent from frontend
- `/api/user/update-avatar` handles upload
- Converts base64 → buffer → Vercel Blob
- Returns public URL, stored in user.image
- Utility functions in `/lib/utils/vercel-blob.ts`

**Next.js Image Configuration**: Remote image patterns configured in `next.config.js`

Allowed domains:
- `jeczfxlhtp0pv0xq.public.blob.vercel-storage.com` (Vercel Blob)
- `myhomeconstructions.com` and `www.myhomeconstructions.com`
- `images.99acres.com`, `img.housing.com`, `images.magicbricks.com`
- `*.squareyards.com`

### Geocoding & Location Services

**Geocoding Utility**: `/lib/utils/geocoding.ts`

- Converts addresses to coordinates using Google Maps Geocoding API
- Returns structured location data: latitude, longitude, formatted address
- Extracts normalized address components (city, state, country, zipcode, locality, neighborhood)
- Used when creating/updating properties and projects
- Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Location Model**:
- All properties and projects linked to Location table
- Supports geocoded coordinates for map display
- Indexed by country/state/city, zipcode, lat/lng, locality, and neighborhood
- Enables efficient location-based queries

### Cron Jobs & Automation

**Ad Expiration Cron**: `/pages/api/cron/expire-ads.ts`

- Automatically expires ads that have exceeded their duration
- Should be triggered periodically (e.g., via Vercel Cron or external scheduler)
- Updates ad status from ACTIVE to EXPIRED
- Keeps advertising slots available for new listings

### Reusable Components

**Projects Components** (`/components/projects/`):
- `BuilderSelector.tsx`: Searchable builder selection dropdown
- `DynamicList.tsx`: Dynamic form list management (amenities, highlights)
- `ImageUploader.tsx`: Multi-image upload with preview and reordering

**Properties Components** (`/components/properties/`):
- `PropertyCard.tsx`: Property listing card with image, details, and actions
- `PropertyMap.tsx`: Google Maps integration for property location
- `ExpressInterestButton.tsx`: Button to track user interest in properties

**Forum Components** (`/components/forum/`):
- Category management, post creation, reply threads
- Reaction system (likes/dislikes)
- User profile integration

### Forum System

**Forum Structure**:
- Categories: Organize discussions by topic
- Posts: Top-level forum threads with title, content, and reactions
- Replies: Nested responses to posts with reaction support
- User Profiles: Per-user forum activity pages (`/forum/user/[userId]`)

**Forum Search** (`/pages/forum/search.tsx`):
- Full-text search across forum posts and replies
- Search by keywords in title, content, and author
- Results display with excerpts and highlighting
- Username highlighting in search results
- Proper avatar sizing and responsive layout

**Reactions System**:
- Like/dislike functionality on posts and replies
- Stored in `PostReaction` and `ReplyReaction` tables
- Real-time reaction count updates
- User can only react once per post/reply

### Builder Management

**Builder Features**:
- Builder directory listing (`/pages/builders/index.tsx`)
- Individual builder pages (`/pages/builders/[id].tsx`)
- Builder creation and editing (`/pages/builders/add-builder.tsx`)
- Logo upload via Vercel Blob
- Contact information management (email, phone, website)
- Associated projects and properties

**Builder-Project Relationship**:
- Each project must be associated with a builder
- Builders can have multiple projects
- Builder details displayed on project pages
- `BuilderSelector` component for easy builder selection in forms

### Common Patterns & Conventions

**File Imports:**

- Use `@/` alias for root imports: `@/lib/cockroachDB/prisma`, `@/components/Header`
- NextAuth imports: `next-auth/react` (client), `next-auth/next` (server)

**Form Validation:**

- Real-time validation with debounced API checks for uniqueness (email, username, mobile)
- Validation errors stored in component state
- Toast notifications via `react-hot-toast`

**Country Code Handling:**

- Component: `@/components/auth/CountryCodeDropdown`
- Country codes stored in `lib/countryCodes.ts`
- Mobile numbers stored with country code prefix (e.g., `+911234567890`)

**State Management:**

- Redux is being phased out - DO NOT USE for new features
- Use NextAuth session for auth state
- Use React hooks (useState, useEffect) for component state
- Server state fetched via API routes

### Development Notes

**Husky & Git Hooks:**

- Pre-commit: Runs lint-staged (ESLint + Prettier on staged files)
- Configured in `.husky/` directory

**OTP Development:**

- All OTP inputs accept `123456` for testing
- No actual SMS/email sending in development

**Google Maps:**

- API key required: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Used for location autocomplete and search
- Loader in `/pages/index.tsx` initializes Places API

**Environment Variables:**

Required environment variables (see `.env.example` for full list):

- `NEXTAUTH_URL`: Application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js
- `DATABASE_URL`: Development database connection string (CockroachDB)
- `DATABASE_URL_PROD`: Production database connection string
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key (Places + Geocoding APIs enabled)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials (optional)
- `RESEND_API_KEY`: Resend API key for email notifications
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token (auto-configured on Vercel)

**CockroachDB SSL Certificate:**
```bash
curl --create-dirs -o $HOME/.postgresql/root.crt 'https://cockroachlabs.cloud/clusters/67af60ef-fa9e-4e81-8e1c-544336573e5e/cert'
```

### Anti-Patterns to Avoid

1. **DO NOT** use Redux for new features (being phased out)
2. **DO NOT** create new inline styles - use Tailwind or CSS files
3. **DO NOT** import from `@/lib/prisma` - use `@/lib/cockroachDB/prisma`
4. **DO NOT** modify NextAuth session without updating type definitions in `/types/next-auth.d.ts`
5. **DO NOT** create new CSS Modules - use direct `.css` imports in `styles/globals.css`
6. **DO NOT** forget to call `await update()` after updating user data to refresh NextAuth session
7. **DO NOT** create files in root component/page folders - always use appropriate subdirectories
8. **DO NOT** add remote image domains to next.config.js without security review
9. **DO NOT** forget to add database indexes for frequently queried fields
10. **DO NOT** use geocoding API without the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable

### Key File Locations

**Core Configuration:**
- Next.js config: `/next.config.js`
- TypeScript config: `/tsconfig.json`
- Jest config: `/jest.config.js`
- Environment variables: `/.env.example`

**Database:**
- Prisma schema: `/prisma/schema.prisma`
- Database client: `/lib/cockroachDB/prisma.ts`
- Database config: `/lib/cockroachDB/database-config.ts`

**Authentication:**
- NextAuth config: `/pages/api/auth/[...nextauth].ts`
- Type extensions: `/types/next-auth.d.ts`

**Utilities:**
- Geocoding: `/lib/utils/geocoding.ts`
- Vercel Blob: `/lib/utils/vercel-blob.ts`
- Country codes: `/lib/countryCodes.ts`

**Styling:**
- Global styles: `/styles/globals.css`
- Component styles: `/styles/components/`
- Page styles: `/styles/pages/`

**Testing:**
- Test setup: `/jest.setup.js`
- Test suites: `/__tests__/`

## Deployment & Vercel Configuration

**Deployment Platform**: Vercel

**Environment-Specific Behavior**:
- Database selection automatically switches based on `NODE_ENV` and `VERCEL_ENV`
- Development: Uses `grihome-dev-13513` database (5 connection pool)
- Production: Uses `grihome-main-13512` database (50 connection pool)
- Connection pooling configured in `/lib/cockroachDB/database-config.ts`

**Vercel-Specific Features**:
- Blob storage for images (automatic token configuration)
- Cron jobs for automated tasks (ad expiration)
- Environment variables managed through Vercel dashboard
- Automatic SSL/TLS for all deployments

**Build Process**:
1. Prisma client generation (`npm run prisma:generate`)
2. Type checking (`npm run type-check`)
3. Linting (`npm run lint`)
4. Format checking (`npm run format:check`)
5. Next.js build (`next build`)

**Common Deployment Issues**:
- 404s on dynamic routes: Ensure pages use proper Next.js routing conventions
- Database connection errors: Verify `DATABASE_URL` and SSL certificate
- Image loading failures: Check remote patterns in `next.config.js`
- Search result rendering: HTML tags should be properly sanitized/stripped

## Recent Enhancements

**Forum Search Improvements**:
- Fixed HTML tags displaying in search result excerpts
- Added username highlighting in search results
- Improved avatar sizing and layout
- Enhanced search relevance scoring

**Routing Fixes**:
- Resolved forum search page 404 errors on Vercel deployments
- Fixed user profile page 404 issues
- Improved dynamic route handling

**UI/UX Improvements**:
- Reduced height of search results header and search box
- Better responsive design across mobile, tablet, and desktop
- Improved search result presentation
