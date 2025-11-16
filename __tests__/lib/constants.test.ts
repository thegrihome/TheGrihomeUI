import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  PROPERTY_TYPE_OPTIONS,
  LISTING_STATUS,
  LISTING_STATUS_LABELS,
  LISTING_STATUS_COLORS,
  FACING_DIRECTIONS,
  SIZE_UNITS,
  SIZE_UNIT_LABELS,
  SIZE_UNIT_OPTIONS,
  USER_ROLES,
  USER_ROLE_LABELS,
} from '@/lib/constants'

describe('lib/constants', () => {
  describe('PROPERTY_TYPES', () => {
    it('should have all property types defined', () => {
      expect(PROPERTY_TYPES.SINGLE_FAMILY).toBe('SINGLE_FAMILY')
      expect(PROPERTY_TYPES.CONDO).toBe('CONDO')
      expect(PROPERTY_TYPES.TOWNHOUSE).toBe('TOWNHOUSE')
      expect(PROPERTY_TYPES.LAND).toBe('LAND')
      expect(PROPERTY_TYPES.LAND_RESIDENTIAL).toBe('LAND_RESIDENTIAL')
      expect(PROPERTY_TYPES.LAND_AGRICULTURE).toBe('LAND_AGRICULTURE')
      expect(PROPERTY_TYPES.COMMERCIAL).toBe('COMMERCIAL')
    })

    it('should have 7 property types', () => {
      expect(Object.keys(PROPERTY_TYPES).length).toBe(7)
    })
  })

  describe('PROPERTY_TYPE_LABELS', () => {
    it('should have labels for all property types', () => {
      expect(PROPERTY_TYPE_LABELS[PROPERTY_TYPES.SINGLE_FAMILY]).toBe('Villa')
      expect(PROPERTY_TYPE_LABELS[PROPERTY_TYPES.CONDO]).toBe('Apartment')
      expect(PROPERTY_TYPE_LABELS[PROPERTY_TYPES.TOWNHOUSE]).toBe('House')
      expect(PROPERTY_TYPE_LABELS[PROPERTY_TYPES.LAND]).toBe('Land')
      expect(PROPERTY_TYPE_LABELS[PROPERTY_TYPES.LAND_RESIDENTIAL]).toBe('Residential Land')
      expect(PROPERTY_TYPE_LABELS[PROPERTY_TYPES.LAND_AGRICULTURE]).toBe('Agriculture Land')
      expect(PROPERTY_TYPE_LABELS[PROPERTY_TYPES.COMMERCIAL]).toBe('Commercial')
    })

    it('should have same number of labels as property types', () => {
      expect(Object.keys(PROPERTY_TYPE_LABELS).length).toBe(Object.keys(PROPERTY_TYPES).length)
    })
  })

  describe('PROPERTY_TYPE_ICONS', () => {
    it('should have icons for all property types', () => {
      expect(PROPERTY_TYPE_ICONS[PROPERTY_TYPES.SINGLE_FAMILY]).toBe('🏡')
      expect(PROPERTY_TYPE_ICONS[PROPERTY_TYPES.CONDO]).toBe('🏢')
      expect(PROPERTY_TYPE_ICONS[PROPERTY_TYPES.TOWNHOUSE]).toBe('🏘️')
      expect(PROPERTY_TYPE_ICONS[PROPERTY_TYPES.LAND]).toBe('🏞️')
      expect(PROPERTY_TYPE_ICONS[PROPERTY_TYPES.LAND_RESIDENTIAL]).toBe('🏞️')
      expect(PROPERTY_TYPE_ICONS[PROPERTY_TYPES.LAND_AGRICULTURE]).toBe('🌾')
      expect(PROPERTY_TYPE_ICONS[PROPERTY_TYPES.COMMERCIAL]).toBe('🏬')
    })
  })

  describe('PROPERTY_TYPE_OPTIONS', () => {
    it('should have 5 property type options', () => {
      expect(PROPERTY_TYPE_OPTIONS.length).toBe(5)
    })

    it('should have correct structure for each option', () => {
      PROPERTY_TYPE_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('icon')
      })
    })

    it('should include SINGLE_FAMILY option', () => {
      const singleFamilyOption = PROPERTY_TYPE_OPTIONS.find(
        opt => opt.value === PROPERTY_TYPES.SINGLE_FAMILY
      )
      expect(singleFamilyOption).toBeDefined()
      expect(singleFamilyOption?.label).toBe('Villa')
      expect(singleFamilyOption?.icon).toBe('🏡')
    })

    it('should include CONDO option', () => {
      const condoOption = PROPERTY_TYPE_OPTIONS.find(opt => opt.value === PROPERTY_TYPES.CONDO)
      expect(condoOption).toBeDefined()
      expect(condoOption?.label).toBe('Apartment')
      expect(condoOption?.icon).toBe('🏢')
    })

    it('should include TOWNHOUSE option', () => {
      const townhouseOption = PROPERTY_TYPE_OPTIONS.find(
        opt => opt.value === PROPERTY_TYPES.TOWNHOUSE
      )
      expect(townhouseOption).toBeDefined()
      expect(townhouseOption?.label).toBe('House')
    })

    it('should include LAND option', () => {
      const landOption = PROPERTY_TYPE_OPTIONS.find(opt => opt.value === PROPERTY_TYPES.LAND)
      expect(landOption).toBeDefined()
      expect(landOption?.label).toBe('Land')
    })

    it('should include COMMERCIAL option', () => {
      const commercialOption = PROPERTY_TYPE_OPTIONS.find(
        opt => opt.value === PROPERTY_TYPES.COMMERCIAL
      )
      expect(commercialOption).toBeDefined()
      expect(commercialOption?.label).toBe('Commercial')
    })
  })

  describe('LISTING_STATUS', () => {
    it('should have all listing statuses defined', () => {
      expect(LISTING_STATUS.ACTIVE).toBe('ACTIVE')
      expect(LISTING_STATUS.PENDING).toBe('PENDING')
      expect(LISTING_STATUS.SOLD).toBe('SOLD')
      expect(LISTING_STATUS.OFF_MARKET).toBe('OFF_MARKET')
      expect(LISTING_STATUS.DRAFT).toBe('DRAFT')
      expect(LISTING_STATUS.ARCHIVED).toBe('ARCHIVED')
    })

    it('should have 6 listing statuses', () => {
      expect(Object.keys(LISTING_STATUS).length).toBe(6)
    })
  })

  describe('LISTING_STATUS_LABELS', () => {
    it('should have labels for all listing statuses', () => {
      expect(LISTING_STATUS_LABELS[LISTING_STATUS.ACTIVE]).toBe('Active')
      expect(LISTING_STATUS_LABELS[LISTING_STATUS.PENDING]).toBe('Pending')
      expect(LISTING_STATUS_LABELS[LISTING_STATUS.SOLD]).toBe('Sold')
      expect(LISTING_STATUS_LABELS[LISTING_STATUS.OFF_MARKET]).toBe('Off Market')
      expect(LISTING_STATUS_LABELS[LISTING_STATUS.DRAFT]).toBe('Draft')
      expect(LISTING_STATUS_LABELS[LISTING_STATUS.ARCHIVED]).toBe('Archived')
    })
  })

  describe('LISTING_STATUS_COLORS', () => {
    it('should have colors for all listing statuses', () => {
      expect(LISTING_STATUS_COLORS[LISTING_STATUS.ACTIVE]).toBe('bg-green-600')
      expect(LISTING_STATUS_COLORS[LISTING_STATUS.PENDING]).toBe('bg-yellow-600')
      expect(LISTING_STATUS_COLORS[LISTING_STATUS.SOLD]).toBe('bg-red-600')
      expect(LISTING_STATUS_COLORS[LISTING_STATUS.OFF_MARKET]).toBe('bg-gray-600')
      expect(LISTING_STATUS_COLORS[LISTING_STATUS.DRAFT]).toBe('bg-gray-600')
      expect(LISTING_STATUS_COLORS[LISTING_STATUS.ARCHIVED]).toBe('bg-gray-600')
    })
  })

  describe('FACING_DIRECTIONS', () => {
    it('should have 8 facing directions', () => {
      expect(FACING_DIRECTIONS.length).toBe(8)
    })

    it('should include all cardinal directions', () => {
      expect(FACING_DIRECTIONS).toContain('East')
      expect(FACING_DIRECTIONS).toContain('West')
      expect(FACING_DIRECTIONS).toContain('North')
      expect(FACING_DIRECTIONS).toContain('South')
    })

    it('should include all inter-cardinal directions', () => {
      expect(FACING_DIRECTIONS).toContain('North East')
      expect(FACING_DIRECTIONS).toContain('North West')
      expect(FACING_DIRECTIONS).toContain('South East')
      expect(FACING_DIRECTIONS).toContain('South West')
    })
  })

  describe('SIZE_UNITS', () => {
    it('should have all size units defined', () => {
      expect(SIZE_UNITS.SQ_FT).toBe('SQ_FT')
      expect(SIZE_UNITS.SQ_YARDS).toBe('SQ_YARDS')
      expect(SIZE_UNITS.ACRES).toBe('ACRES')
    })

    it('should have 3 size units', () => {
      expect(Object.keys(SIZE_UNITS).length).toBe(3)
    })
  })

  describe('SIZE_UNIT_LABELS', () => {
    it('should have labels for all size units', () => {
      expect(SIZE_UNIT_LABELS[SIZE_UNITS.SQ_FT]).toBe('Sq Ft')
      expect(SIZE_UNIT_LABELS[SIZE_UNITS.SQ_YARDS]).toBe('Sq Yards')
      expect(SIZE_UNIT_LABELS[SIZE_UNITS.ACRES]).toBe('Acres')
    })
  })

  describe('SIZE_UNIT_OPTIONS', () => {
    it('should have 3 size unit options', () => {
      expect(SIZE_UNIT_OPTIONS.length).toBe(3)
    })

    it('should have correct structure for each option', () => {
      SIZE_UNIT_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
      })
    })

    it('should include SQ_FT option', () => {
      const sqFtOption = SIZE_UNIT_OPTIONS.find(opt => opt.value === SIZE_UNITS.SQ_FT)
      expect(sqFtOption).toBeDefined()
      expect(sqFtOption?.label).toBe('Sq Ft')
    })

    it('should include SQ_YARDS option', () => {
      const sqYardsOption = SIZE_UNIT_OPTIONS.find(opt => opt.value === SIZE_UNITS.SQ_YARDS)
      expect(sqYardsOption).toBeDefined()
      expect(sqYardsOption?.label).toBe('Sq Yards')
    })

    it('should include ACRES option', () => {
      const acresOption = SIZE_UNIT_OPTIONS.find(opt => opt.value === SIZE_UNITS.ACRES)
      expect(acresOption).toBeDefined()
      expect(acresOption?.label).toBe('Acres')
    })
  })

  describe('USER_ROLES', () => {
    it('should have all user roles defined', () => {
      expect(USER_ROLES.BUYER).toBe('BUYER')
      expect(USER_ROLES.AGENT).toBe('AGENT')
      expect(USER_ROLES.ADMIN).toBe('ADMIN')
    })

    it('should have 3 user roles', () => {
      expect(Object.keys(USER_ROLES).length).toBe(3)
    })
  })

  describe('USER_ROLE_LABELS', () => {
    it('should have labels for all user roles', () => {
      expect(USER_ROLE_LABELS[USER_ROLES.BUYER]).toBe('Buyer')
      expect(USER_ROLE_LABELS[USER_ROLES.AGENT]).toBe('Real Estate Agent')
      expect(USER_ROLE_LABELS[USER_ROLES.ADMIN]).toBe('Admin')
    })

    it('should have same number of labels as user roles', () => {
      expect(Object.keys(USER_ROLE_LABELS).length).toBe(Object.keys(USER_ROLES).length)
    })
  })
})
