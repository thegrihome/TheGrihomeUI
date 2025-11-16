import { countryCodes, Country } from '@/lib/countryCodes'

describe('Country Codes', () => {
  describe('Data Structure', () => {
    it('exports countryCodes array', () => {
      expect(countryCodes).toBeDefined()
      expect(Array.isArray(countryCodes)).toBe(true)
    })

    it('contains country entries', () => {
      expect(countryCodes.length).toBeGreaterThan(0)
    })

    it('each country has required properties', () => {
      countryCodes.forEach(country => {
        expect(country).toHaveProperty('code')
        expect(country).toHaveProperty('code3')
        expect(country).toHaveProperty('name')
        expect(country).toHaveProperty('dialCode')
        expect(country).toHaveProperty('flag')
      })
    })

    it('code is 2-letter uppercase string', () => {
      countryCodes.forEach(country => {
        expect(country.code).toMatch(/^[A-Z]{2}$/)
      })
    })

    it('code3 is 3-letter uppercase string', () => {
      countryCodes.forEach(country => {
        expect(country.code3).toMatch(/^[A-Z]{3}$/)
      })
    })

    it('dialCode starts with +', () => {
      countryCodes.forEach(country => {
        expect(country.dialCode).toMatch(/^\+\d+/)
      })
    })

    it('name is non-empty string', () => {
      countryCodes.forEach(country => {
        expect(country.name).toBeTruthy()
        expect(typeof country.name).toBe('string')
        expect(country.name.length).toBeGreaterThan(0)
      })
    })

    it('flag is emoji string', () => {
      countryCodes.forEach(country => {
        expect(country.flag).toBeTruthy()
        expect(typeof country.flag).toBe('string')
      })
    })
  })

  describe('Priority Countries', () => {
    it('has India as first country', () => {
      expect(countryCodes[0].code).toBe('IN')
      expect(countryCodes[0].name).toBe('India')
      expect(countryCodes[0].dialCode).toBe('+91')
    })

    it('has United States as second country', () => {
      expect(countryCodes[1].code).toBe('US')
      expect(countryCodes[1].name).toBe('United States of America')
      expect(countryCodes[1].dialCode).toBe('+1')
    })
  })

  describe('Specific Countries', () => {
    it('contains India', () => {
      const india = countryCodes.find(c => c.code === 'IN')
      expect(india).toBeDefined()
      expect(india?.code3).toBe('IND')
      expect(india?.name).toBe('India')
      expect(india?.dialCode).toBe('+91')
      expect(india?.flag).toBe('🇮🇳')
    })

    it('contains United States', () => {
      const usa = countryCodes.find(c => c.code === 'US')
      expect(usa).toBeDefined()
      expect(usa?.code3).toBe('USA')
      expect(usa?.name).toBe('United States of America')
      expect(usa?.dialCode).toBe('+1')
      expect(usa?.flag).toBe('🇺🇸')
    })

    it('contains United Kingdom', () => {
      const uk = countryCodes.find(c => c.code === 'GB')
      expect(uk).toBeDefined()
      expect(uk?.code3).toBe('GBR')
      expect(uk?.name).toBe('United Kingdom')
      expect(uk?.dialCode).toBe('+44')
      expect(uk?.flag).toBe('🇬🇧')
    })

    it('contains Canada', () => {
      const canada = countryCodes.find(c => c.code === 'CA')
      expect(canada).toBeDefined()
      expect(canada?.code3).toBe('CAN')
      expect(canada?.name).toBe('Canada')
      expect(canada?.dialCode).toBe('+1')
      expect(canada?.flag).toBe('🇨🇦')
    })

    it('contains Australia', () => {
      const australia = countryCodes.find(c => c.code === 'AU')
      expect(australia).toBeDefined()
      expect(australia?.code3).toBe('AUS')
      expect(australia?.name).toBe('Australia')
      expect(australia?.dialCode).toBe('+61')
      expect(australia?.flag).toBe('🇦🇺')
    })

    it('contains China', () => {
      const china = countryCodes.find(c => c.code === 'CN')
      expect(china).toBeDefined()
      expect(china?.code3).toBe('CHN')
      expect(china?.name).toBe('China')
      expect(china?.dialCode).toBe('+86')
      expect(china?.flag).toBe('🇨🇳')
    })

    it('contains Japan', () => {
      const japan = countryCodes.find(c => c.code === 'JP')
      expect(japan).toBeDefined()
      expect(japan?.code3).toBe('JPN')
      expect(japan?.name).toBe('Japan')
      expect(japan?.dialCode).toBe('+81')
      expect(japan?.flag).toBe('🇯🇵')
    })

    it('contains Germany', () => {
      const germany = countryCodes.find(c => c.code === 'DE')
      expect(germany).toBeDefined()
      expect(germany?.code3).toBe('DEU')
      expect(germany?.name).toBe('Germany')
      expect(germany?.dialCode).toBe('+49')
      expect(germany?.flag).toBe('🇩🇪')
    })

    it('contains France', () => {
      const france = countryCodes.find(c => c.code === 'FR')
      expect(france).toBeDefined()
      expect(france?.code3).toBe('FRA')
      expect(france?.name).toBe('France')
      expect(france?.dialCode).toBe('+33')
      expect(france?.flag).toBe('🇫🇷')
    })

    it('contains Brazil', () => {
      const brazil = countryCodes.find(c => c.code === 'BR')
      expect(brazil).toBeDefined()
      expect(brazil?.code3).toBe('BRA')
      expect(brazil?.name).toBe('Brazil')
      expect(brazil?.dialCode).toBe('+55')
      expect(brazil?.flag).toBe('🇧🇷')
    })
  })

  describe('Code Uniqueness', () => {
    it('has unique 2-letter codes', () => {
      const codes = countryCodes.map(c => c.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })

    it('has unique 3-letter codes', () => {
      const code3s = countryCodes.map(c => c.code3)
      const uniqueCode3s = new Set(code3s)
      expect(uniqueCode3s.size).toBe(code3s.length)
    })

    it('country names are mostly unique', () => {
      const names = countryCodes.map(c => c.name)
      const uniqueNames = new Set(names)
      // Most names should be unique (allowing for very few duplicates if any)
      expect(uniqueNames.size).toBeGreaterThan(names.length * 0.95)
    })
  })

  describe('Dial Codes', () => {
    it('all dial codes are numeric after +', () => {
      countryCodes.forEach(country => {
        const dialCodeNumber = country.dialCode.substring(1)
        expect(dialCodeNumber).toMatch(/^\d+$/)
      })
    })

    it('dial codes are reasonable lengths', () => {
      countryCodes.forEach(country => {
        // Dial codes typically range from +1 to +9999
        const dialCodeLength = country.dialCode.length
        expect(dialCodeLength).toBeGreaterThanOrEqual(2) // At least +X
        expect(dialCodeLength).toBeLessThanOrEqual(6) // At most +XXXXX
      })
    })

    it('USA and Canada share dial code +1', () => {
      const usa = countryCodes.find(c => c.code === 'US')
      const canada = countryCodes.find(c => c.code === 'CA')
      expect(usa?.dialCode).toBe('+1')
      expect(canada?.dialCode).toBe('+1')
    })

    it('Russia and Kazakhstan share dial code +7', () => {
      const russia = countryCodes.find(c => c.code === 'RU')
      const kazakhstan = countryCodes.find(c => c.code === 'KZ')
      expect(russia?.dialCode).toBe('+7')
      expect(kazakhstan?.dialCode).toBe('+7')
    })
  })

  describe('Country Coverage', () => {
    it('contains major Asian countries', () => {
      const asianCountries = ['IN', 'CN', 'JP', 'KR', 'TH', 'VN', 'SG', 'MY', 'ID', 'PH']
      asianCountries.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })

    it('contains major European countries', () => {
      const europeanCountries = ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'NO', 'PL', 'CH']
      europeanCountries.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })

    it('contains major American countries', () => {
      const americanCountries = ['US', 'CA', 'MX', 'BR', 'AR', 'CL']
      americanCountries.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })

    it('contains major African countries', () => {
      const africanCountries = ['ZA', 'EG', 'NG', 'KE', 'GH', 'MA']
      africanCountries.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })

    it('contains major Oceania countries', () => {
      const oceaniaCountries = ['AU', 'NZ', 'FJ']
      oceaniaCountries.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })

    it('contains Middle Eastern countries', () => {
      const middleEastCountries = ['SA', 'AE', 'IL', 'TR', 'IR', 'IQ', 'JO', 'KW', 'QA']
      middleEastCountries.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })
  })

  describe('Alphabetical Order (after priority countries)', () => {
    it('countries after first two are in alphabetical order by name', () => {
      const remainingCountries = countryCodes.slice(2)
      const names = remainingCountries.map(c => c.name)

      for (let i = 1; i < names.length; i++) {
        // Afghanistan should come before Albania, etc.
        expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0)
      }
    })
  })

  describe('Type Safety', () => {
    it('matches Country interface', () => {
      const country: Country = countryCodes[0]
      expect(country.code).toBeDefined()
      expect(country.code3).toBeDefined()
      expect(country.name).toBeDefined()
      expect(country.dialCode).toBeDefined()
      expect(country.flag).toBeDefined()
    })

    it('code is string', () => {
      countryCodes.forEach(country => {
        expect(typeof country.code).toBe('string')
      })
    })

    it('code3 is string', () => {
      countryCodes.forEach(country => {
        expect(typeof country.code3).toBe('string')
      })
    })

    it('name is string', () => {
      countryCodes.forEach(country => {
        expect(typeof country.name).toBe('string')
      })
    })

    it('dialCode is string', () => {
      countryCodes.forEach(country => {
        expect(typeof country.dialCode).toBe('string')
      })
    })

    it('flag is string', () => {
      countryCodes.forEach(country => {
        expect(typeof country.flag).toBe('string')
      })
    })
  })

  describe('Utility Functions', () => {
    it('can find country by code', () => {
      const findByCode = (code: string) => countryCodes.find(c => c.code === code)

      expect(findByCode('IN')).toBeDefined()
      expect(findByCode('US')).toBeDefined()
      expect(findByCode('XX')).toBeUndefined()
    })

    it('can find country by code3', () => {
      const findByCode3 = (code3: string) => countryCodes.find(c => c.code3 === code3)

      expect(findByCode3('IND')).toBeDefined()
      expect(findByCode3('USA')).toBeDefined()
      expect(findByCode3('XXX')).toBeUndefined()
    })

    it('can find country by dial code', () => {
      const findByDialCode = (dialCode: string) => countryCodes.filter(c => c.dialCode === dialCode)

      expect(findByDialCode('+91').length).toBeGreaterThan(0)
      expect(findByDialCode('+1').length).toBeGreaterThan(0) // Multiple countries
      expect(findByDialCode('+999999').length).toBe(0)
    })

    it('can find country by name', () => {
      const findByName = (name: string) => countryCodes.find(c => c.name === name)

      expect(findByName('India')).toBeDefined()
      expect(findByName('United States of America')).toBeDefined()
      expect(findByName('NonExistent Country')).toBeUndefined()
    })

    it('can search countries by partial name', () => {
      const searchByName = (query: string) =>
        countryCodes.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))

      const unitedResults = searchByName('united')
      expect(unitedResults.length).toBeGreaterThan(0)
      expect(unitedResults.some(c => c.code === 'US')).toBe(true)
      expect(unitedResults.some(c => c.code === 'GB')).toBe(true)
      expect(unitedResults.some(c => c.code === 'AE')).toBe(true)
    })
  })

  describe('Data Integrity', () => {
    it('has reasonable total number of countries', () => {
      // There are approximately 195 countries in the world
      expect(countryCodes.length).toBeGreaterThan(150)
      expect(countryCodes.length).toBeLessThan(250)
    })

    it('no duplicate codes', () => {
      const seen = new Set<string>()
      countryCodes.forEach(country => {
        expect(seen.has(country.code)).toBe(false)
        seen.add(country.code)
      })
    })

    it('no duplicate code3', () => {
      const seen = new Set<string>()
      countryCodes.forEach(country => {
        expect(seen.has(country.code3)).toBe(false)
        seen.add(country.code3)
      })
    })

    it('no empty values', () => {
      countryCodes.forEach(country => {
        expect(country.code.trim()).toBeTruthy()
        expect(country.code3.trim()).toBeTruthy()
        expect(country.name.trim()).toBeTruthy()
        expect(country.dialCode.trim()).toBeTruthy()
        expect(country.flag.trim()).toBeTruthy()
      })
    })
  })

  describe('Specific Edge Cases', () => {
    it('handles countries with long names', () => {
      const longNames = countryCodes.filter(c => c.name.length > 20)
      expect(longNames.length).toBeGreaterThan(0)

      longNames.forEach(country => {
        expect(country.code).toBeTruthy()
        expect(country.dialCode).toBeTruthy()
      })
    })

    it('handles countries with special characters in names', () => {
      const specialChars = countryCodes.filter(c => /['-]/.test(c.name))
      expect(specialChars.length).toBeGreaterThan(0)
    })

    it('handles island nations', () => {
      const islands = ['FJ', 'MV', 'MU', 'SC', 'SG']
      islands.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })

    it('handles landlocked countries', () => {
      const landlocked = ['NP', 'BT', 'AF', 'MN', 'KZ']
      landlocked.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country).toBeDefined()
      })
    })
  })

  describe('Regional Dial Code Patterns', () => {
    it('most African countries use +2XX dial codes', () => {
      const africaCountries = countryCodes.filter(
        c => c.dialCode.startsWith('+2') && c.dialCode.length === 4
      )
      expect(africaCountries.length).toBeGreaterThan(10)
    })

    it('European countries have varied dial codes', () => {
      const europeanCodes = ['GB', 'FR', 'DE', 'IT', 'ES']
      europeanCodes.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        expect(country?.dialCode).toBeTruthy()
        expect(country?.dialCode.startsWith('+')).toBe(true)
      })
    })

    it('Asian countries have dial codes starting with +6, +8, or +9', () => {
      const asianCountries = ['IN', 'CN', 'JP', 'TH', 'SG']
      asianCountries.forEach(code => {
        const country = countryCodes.find(c => c.code === code)
        const firstDigit = country?.dialCode.charAt(1)
        expect(['6', '8', '9']).toContain(firstDigit)
      })
    })
  })
})
