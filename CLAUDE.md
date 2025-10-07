# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

### 1. Never Cause Regressions

- **ALWAYS** verify that existing functionality still works after making changes
- **NEVER** delete code or files without understanding their dependencies
- **ALWAYS** check if deleted/moved files are imported elsewhere
- **NEVER** assume a file is unused without searching for all references
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
- Components: `auth/`, `properties/`, `forum/`
- Lib: `cockroachDB/`, `utils/`
- API: `user/`, `properties/`, `projects/`, `auth/`, `forum/`, `ads/`, `agents/`

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
- `Project`: Builder projects (apartments, villas, etc.)
- `ForumPost` / `ForumReply`: Community forum with reactions
- `Ad`: Advertising slots system (6 slots for featured properties)
- `Interest`: Property/project interest tracking
- `ProjectRequest`: User requests for new projects

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

- Properties: Listing, search, detail pages, add/edit
- Projects: Builder projects listing and detail
- Forum: Category-based discussion system with reactions
- Ads: 6-slot advertising system for featured properties
- Agents: Agent directory and profiles

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

- Development database credentials are in `.env.example`
- SSL certificate required for CockroachDB:
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

### Key File Locations

- Prisma schema: `/prisma/schema.prisma`
- Database client: `/lib/cockroachDB/prisma.ts`
- Database config: `/lib/cockroachDB/database-config.ts`
- NextAuth config: `/pages/api/auth/[...nextauth].ts`
- Type extensions: `/types/next-auth.d.ts`
- Global styles: `/styles/globals.css`
- Country codes: `/lib/countryCodes.ts`
