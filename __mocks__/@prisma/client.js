// Mock for @prisma/client
module.exports = {
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
  // Enums
  PropertyType: {
    SINGLE_FAMILY: 'SINGLE_FAMILY',
    CONDO: 'CONDO',
    TOWNHOUSE: 'TOWNHOUSE',
    MULTI_FAMILY: 'MULTI_FAMILY',
    LAND: 'LAND',
    APARTMENT: 'APARTMENT',
    VILLA: 'VILLA',
    FARM_HOUSE: 'FARM_HOUSE',
    COMMERCIAL: 'COMMERCIAL',
  },
  ListingType: {
    SALE: 'SALE',
    RENT: 'RENT',
  },
  ListingStatus: {
    ACTIVE: 'ACTIVE',
    PENDING: 'PENDING',
    SOLD: 'SOLD',
    INACTIVE: 'INACTIVE',
    ARCHIVED: 'ARCHIVED',
  },
  UserRole: {
    BUYER: 'BUYER',
    SELLER: 'SELLER',
    AGENT: 'AGENT',
    ADMIN: 'ADMIN',
  },
  AdStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
  },
  ForumCategory: {
    GENERAL_DISCUSSIONS: 'GENERAL_DISCUSSIONS',
    BUYING_SELLING: 'BUYING_SELLING',
    RENTING: 'RENTING',
    HOME_IMPROVEMENT: 'HOME_IMPROVEMENT',
    LEGAL_FINANCIAL: 'LEGAL_FINANCIAL',
    NEIGHBORHOOD_REVIEWS: 'NEIGHBORHOOD_REVIEWS',
  },
}
