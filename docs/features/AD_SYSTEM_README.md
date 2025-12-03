# Advertisement System Implementation

## Overview

The advertisement system allows users to purchase ad slots on the home page to feature their properties or projects. The system includes dynamic pricing, expiry notifications, and renewal functionality.

## Features Implemented

### 1. **Database Schema**

- `AdSlotConfig`: Configuration for each ad slot (21 total slots)
- `Ad`: Individual ad records with payment and status tracking
- Pricing tiers: Slot 1 = ₹1500/day, Slot 21 = ₹500/day (decreasing by ₹50)

### 2. **Home Page Integration**

- Dynamic ad slots replace hardcoded property listings
- Shows purchased ads or "Purchase Ad" placeholders
- Expiry warning banners for logged-in users
- "No active properties" banner for users without listings

### 3. **Ad Purchase System**

- Dynamic routing: `/purchase-ad-slot-{number}`
- Property/project selection from user's active listings
- Duration selection (7, 14, 30, 60, 90 days)
- Mock payment methods (UPI, Credit Card, Debit Card, Bank Account)
- Real-time pricing calculation

### 4. **Expiry & Renewal System**

- 3-day expiry warning notifications
- Renewal functionality with automatic property pre-population
- Ad status management (ACTIVE, EXPIRED, CANCELLED)

### 5. **API Endpoints**

- `GET /api/ads/slots` - Fetch all ad slots with current ads
- `POST /api/ads/purchase` - Purchase or renew an ad
- `POST /api/ads/init-slots` - Initialize ad slot configurations
- `GET /api/user/active-listings` - Get user's active properties/projects

## Installation & Setup

### 1. **Initialize Ad Slots**

Run the initialization script to create 21 ad slots:

```bash
node scripts/init-ad-slots.js
```

Or call the API endpoint:

```bash
curl -X POST http://localhost:3000/api/ads/init-slots
```

### 2. **Database Schema Applied**

The Prisma schema has been updated with ad-related models. Run:

```bash
npx prisma db push
npx prisma generate
```

### 3. **Dependencies**

All required dependencies are already in the project:

- NextAuth for authentication
- Prisma for database management
- React Hot Toast for notifications

## Usage

### For Property Owners

1. **Prerequisites**: Must have active properties listed
2. **Purchase Process**:
   - Visit home page and click "Purchase Ad" on any available slot
   - Select property/project to advertise
   - Choose duration (7-90 days)
   - Select payment method
   - Complete purchase (demo payment)

### For Advertisers

1. **Ad Display**: Featured properties show on home page with "Featured Ad" badge
2. **Expiry Management**: Receive warnings 3 days before expiry
3. **Renewal**: One-click renewal with pre-populated property selection

### For Visitors

1. **View Ads**: See featured properties on home page
2. **Click Through**: Click "View Details" to go to property detail page
3. **Contact Info**: See "Posted by" information for each ad

## Technical Details

### Pricing Structure

```
Slot 1:  ₹1500/day (premium position)
Slot 2:  ₹1450/day
...
Slot 20: ₹550/day
Slot 21: ₹500/day (economy position)
```

### Payment Processing

- **Demo Mode**: All payments auto-complete
- **Integration Ready**: PaymentMethod enum supports real gateways
- **Tracking**: Payment IDs generated for audit trails

### Status Management

- **ACTIVE**: Currently displayed ads
- **EXPIRED**: Past end date
- **CANCELLED**: User cancelled before expiry

## File Structure

### New Files Created

```
pages/
├── purchase-ad-slot-[slot].tsx     # Dynamic ad purchase pages
├── api/
│   ├── ads/
│   │   ├── slots.ts                # Get ad slots
│   │   ├── purchase.ts             # Purchase/renew ads
│   │   └── init-slots.ts           # Initialize configurations
│   └── user/
│       └── active-listings.ts      # Get user's properties/projects

scripts/
└── init-ad-slots.js                # Database initialization script

prisma/
└── schema.prisma                   # Updated with ad models
```

### Modified Files

```
pages/
├── index.tsx                       # Home page with ad slots
└── api/
    └── user/
        └── active-listings.ts      # User property/project API
```

## Future Enhancements

1. **Payment Integration**: Replace demo payments with real gateway
2. **Analytics**: Track ad performance and click-through rates
3. **Admin Panel**: Manage ad slots and pricing
4. **Bulk Operations**: Purchase multiple slots at once
5. **Targeting**: Location-based or category-based ad targeting

## Security Considerations

- **Authentication**: All ad operations require valid user sessions
- **Authorization**: Users can only advertise their own properties
- **Validation**: Strict input validation on all API endpoints
- **Ownership Checks**: Properties/projects verified before ad creation

## Monitoring

- **Database**: Monitor ad slot occupancy rates
- **Revenue**: Track total ad spend and popular slots
- **User Behavior**: Analyze which properties get most ad purchases
- **Performance**: Monitor API response times for ad-related endpoints
