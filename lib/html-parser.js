/**
 * Enhanced HTML Parser for Real Estate Websites
 * Detects common patterns and extracts project data intelligently
 */

export class RealEstateHTMLParser {
  constructor() {
    // Known real estate website patterns
    this.sitePatterns = {
      '99acres': {
        name: ['.projectName', 'h1.heading', '.project-title'],
        description: ['.projectDesc', '.project-overview', '.description'],
        location: ['.addressDiv', '.locName', '.address'],
        price: ['.priceInfo', '.price', '.cost'],
        features: ['.amenities', '.features', '.facilities'],
        images: ['img[src*="project"]', '.gallery img', '.slider img'],
      },
      housing: {
        name: ['h1.heading', '.projectName', '.title'],
        description: ['.projectDesc', '.overview', '.about'],
        location: ['.locName', '.address', '.location'],
        price: ['.priceRange', '.price', '.cost'],
        features: ['.amenities', '.features'],
        images: ['.gallery img', '.project-images img'],
      },
      magicbricks: {
        name: ['.mb-srpL__title', 'h1', '.project-name'],
        description: ['.mb-srpL__desc', '.description'],
        location: ['.mb-srpL__locality', '.address'],
        price: ['.mb-srpL__price', '.price'],
        features: ['.amenities', '.features'],
        images: ['.gallery img', '.project-gallery img'],
      },
      generic: {
        name: ['h1', 'h2.title', '.project-name', '.property-title', 'title'],
        description: ['.description', '.overview', '.about', 'meta[name="description"]'],
        location: ['.address', '.location', '.locality', '.city'],
        price: ['.price', '.cost', '.pricing'],
        features: ['.amenities', '.features', '.facilities'],
        images: ['img[alt*="project"]', '.gallery img', '.property-images img'],
      },
    }

    // Property type keywords
    this.typeKeywords = {
      RESIDENTIAL: [
        'apartment',
        'residential',
        'home',
        'villa',
        'flat',
        'condo',
        'townhouse',
        'bhk',
      ],
      COMMERCIAL: ['commercial', 'office', 'retail', 'shop', 'mall', 'complex', 'business'],
      MIXED_USE: ['mixed', 'integrated', 'township', 'development'],
      INDUSTRIAL: ['industrial', 'warehouse', 'factory', 'manufacturing'],
    }
  }

  parse(htmlString, templateStructure, manualBaseUrl = '') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlString, 'text/html')

      // Use manual base URL if provided, otherwise extract from HTML
      const baseUrl = manualBaseUrl || this.extractBaseUrl(htmlString, doc)

      // Detect website type
      const siteType = this.detectSiteType(htmlString)
      const patterns = this.sitePatterns[siteType] || this.sitePatterns.generic

      return {
        name: this.extractName(doc, patterns.name),
        description: this.extractDescription(doc, patterns.description),
        location: this.extractLocation(doc, patterns.location),
        type: this.detectPropertyType(htmlString),
        price: this.extractPrice(doc, patterns.price),
        numberOfUnits: this.extractUnits(htmlString),
        size: this.extractSize(htmlString),
        thumbnailUrl: this.extractThumbnail(doc, patterns.images, baseUrl, htmlString),
        imageUrls: this.extractImages(doc, patterns.images, baseUrl, htmlString),
        amenities: this.extractAmenities(doc, patterns.features),
        confidence: this.calculateConfidence(doc, patterns),
      }
    } catch (error) {
      const baseUrl = manualBaseUrl || this.extractBaseUrl(htmlString, null)
      return this.generateFallback(htmlString, baseUrl)
    }
  }

  detectSiteType(html) {
    const lowerHtml = html.toLowerCase()
    if (lowerHtml.includes('99acres')) return '99acres'
    if (lowerHtml.includes('housing.com')) return 'housing'
    if (lowerHtml.includes('magicbricks')) return 'magicbricks'
    return 'generic'
  }

  extractName(doc, selectors) {
    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        let name = element.textContent || element.getAttribute('content') || ''
        name = name
          .trim()
          .replace(/\s*\|\s*.*$/, '')
          .replace(/\s*-\s*.*$/, '')
        if (name.length > 5 && name.length < 100) {
          return name
        }
      }
    }

    // Fallback to title tag
    const title = doc.querySelector('title')
    if (title) {
      const name = title.textContent.split('|')[0].split('-')[0].trim()
      return name || 'Project Name Not Found'
    }

    return 'Project Name Not Found'
  }

  extractDescription(doc, selectors) {
    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        let desc = element.textContent || element.getAttribute('content') || ''
        desc = desc.trim().replace(/\s+/g, ' ')
        if (desc.length > 20 && desc.length < 500) {
          return desc
        }
      }
    }

    // Fallback to meta description
    const metaDesc = doc.querySelector('meta[name="description"]')
    if (metaDesc) {
      return metaDesc.getAttribute('content') || 'No description available'
    }

    return 'No description available'
  }

  extractLocation(doc, selectors) {
    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        const location = element.textContent.trim()
        if (location.includes(',') || location.length > 10) {
          return location
        }
      }
    }
    return 'Location not specified'
  }

  detectPropertyType(html) {
    const lowerHtml = html.toLowerCase()

    for (const [type, keywords] of Object.entries(this.typeKeywords)) {
      for (const keyword of keywords) {
        if (lowerHtml.includes(keyword)) {
          return type
        }
      }
    }

    return 'RESIDENTIAL' // Default
  }

  extractPrice(doc, selectors) {
    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        const price = element.textContent.trim()
        const priceMatch = price.match(/[\d,.]+(?: cr| crore| lakh| lakhs)?/i)
        if (priceMatch) {
          return priceMatch[0]
        }
      }
    }
    return null
  }

  extractUnits(html) {
    const unitsMatch = html.match(/(\d+)\s*(?:units|apartments|flats|homes|villas)/i)
    return unitsMatch ? parseInt(unitsMatch[1]) : null
  }

  extractSize(html) {
    const sizeMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:acres|sq\.?\s*ft|sqft|hectares)/i)
    return sizeMatch ? parseFloat(sizeMatch[1]) : null
  }

  extractThumbnail(doc, selectors, baseUrl, htmlString) {
    // First try extracting from HTML string to avoid DOMParser URL conversion
    const imgMatches = htmlString.match(/<img[^>]*src="([^"]+)"/gi) || []
    for (const match of imgMatches) {
      const srcMatch = match.match(/src="([^"]+)"/)
      if (srcMatch) {
        const srcUrl = srcMatch[1]
        if (
          srcUrl &&
          !srcUrl.includes('icon') &&
          !srcUrl.includes('logo') &&
          !srcUrl.includes('localhost')
        ) {
          const normalizedUrl = this.normalizeImageUrl(srcUrl, baseUrl)
          // eslint-disable-next-line no-console
          console.log(`Thumbnail: ${srcUrl} -> ${normalizedUrl}`)
          return normalizedUrl
        }
      }
    }

    // Fallback to DOM extraction
    for (const selector of selectors) {
      const img = doc.querySelector(selector)
      if (img && img.getAttribute('src')) {
        const srcUrl = img.getAttribute('src')
        if (!srcUrl.includes('localhost')) {
          return this.normalizeImageUrl(srcUrl, baseUrl)
        }
      }
    }

    return null
  }

  extractImages(doc, selectors, baseUrl, htmlString) {
    const images = new Set()

    // Extract images from HTML string using regex to avoid DOMParser URL conversion
    const imgMatches = htmlString.match(/<img[^>]*src="([^"]+)"/gi) || []
    imgMatches.forEach(match => {
      const srcMatch = match.match(/src="([^"]+)"/)
      if (srcMatch) {
        const srcUrl = srcMatch[1]
        if (
          srcUrl &&
          !srcUrl.includes('icon') &&
          !srcUrl.includes('logo') &&
          !srcUrl.includes('localhost')
        ) {
          const normalizedUrl = this.normalizeImageUrl(srcUrl, baseUrl)
          // eslint-disable-next-line no-console
          console.log(`Normalizing image: ${srcUrl} -> ${normalizedUrl}`)
          images.add(normalizedUrl)
        }
      }
    })

    // Also try DOM extraction as backup
    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector)
      elements.forEach(img => {
        const srcUrl = img.getAttribute('src') // Use getAttribute to get original value
        if (
          srcUrl &&
          !srcUrl.includes('icon') &&
          !srcUrl.includes('logo') &&
          !srcUrl.includes('localhost')
        ) {
          const normalizedUrl = this.normalizeImageUrl(srcUrl, baseUrl)
          // eslint-disable-next-line no-console
          console.log(`DOM Normalizing image: ${srcUrl} -> ${normalizedUrl}`)
          images.add(normalizedUrl)
        }
      })
    }

    return Array.from(images).slice(0, 10)
  }

  extractAmenities(doc, selectors) {
    const amenities = []

    for (const selector of selectors) {
      const container = doc.querySelector(selector)
      if (container) {
        const items = container.querySelectorAll('li, .amenity, .feature')
        items.forEach(item => {
          const text = item.textContent.trim()
          if (text && text.length > 3 && text.length < 50) {
            amenities.push({
              name: text,
              icon: '/images/placeholder.webp',
            })
          }
        })
      }
    }

    return amenities.slice(0, 20)
  }

  calculateConfidence(doc, patterns) {
    let score = 0
    let total = 0

    // Check if we found data for each field
    Object.values(patterns).forEach(selectors => {
      total++
      for (const selector of selectors) {
        if (doc.querySelector(selector)) {
          score++
          break
        }
      }
    })

    return Math.round((score / total) * 100)
  }

  generateFallback(html, baseUrl) {
    // Basic regex-based extraction as last resort
    const nameMatch = html.match(/<title[^>]*>([^<|]+)/i)
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]{20,300})"/i)

    // Extract images with base URL conversion
    const imageMatches = html.match(/<img[^>]*src="([^"]+)"/gi) || []
    const imageUrls = imageMatches
      .map(match => {
        const srcMatch = match.match(/src="([^"]+)"/)
        return srcMatch ? srcMatch[1] : null
      })
      .filter(Boolean)
      .slice(0, 10)
      .map(url => this.normalizeImageUrl(url, baseUrl))

    return {
      name: nameMatch ? nameMatch[1].trim() : 'Extracted Project',
      description: descMatch ? descMatch[1].trim() : 'Project description extracted from HTML',
      location: 'Location not found',
      type: 'RESIDENTIAL',
      thumbnailUrl: imageUrls[0] || null,
      imageUrls: imageUrls.slice(1),
      confidence: 20,
    }
  }

  extractBaseUrl(htmlString, doc) {
    // Try to extract base URL from various sources

    // 1. Check for <base> tag
    const baseTag = doc.querySelector('base[href]')
    if (baseTag) {
      return baseTag.href
    }

    // 2. Extract from canonical URL
    const canonicalLink = doc.querySelector('link[rel="canonical"]')
    if (canonicalLink && canonicalLink.href) {
      const url = new URL(canonicalLink.href)
      return `${url.protocol}//${url.host}`
    }

    // 3. Extract from og:url meta tag
    const ogUrl = doc.querySelector('meta[property="og:url"]')
    if (ogUrl && ogUrl.content) {
      const url = new URL(ogUrl.content)
      return `${url.protocol}//${url.host}`
    }

    // 4. Try to extract from common patterns in HTML
    const urlMatch = htmlString.match(/https?:\/\/([^\/\s"']+)/i)
    if (urlMatch) {
      return `${urlMatch[0].split('/')[0]}//${urlMatch[1]}`
    }

    // 5. For myhomeconstructions.com specifically
    if (htmlString.includes('myhomeconstructions.com')) {
      return 'https://www.myhomeconstructions.com'
    }

    // 6. Default fallback
    return 'https://example.com'
  }

  normalizeImageUrl(imageSrc, baseUrl) {
    // eslint-disable-next-line no-console
    console.log(`🔧 normalizeImageUrl called with:`, { imageSrc, baseUrl })

    // Skip data URLs and empty sources
    if (!imageSrc || imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) {
      // eslint-disable-next-line no-console
      console.log(`⏭️ Skipping data/blob URL:`, imageSrc)
      return imageSrc
    }

    // If already absolute URL, return as is
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      // eslint-disable-next-line no-console
      console.log(`✅ Already absolute URL:`, imageSrc)
      return imageSrc
    }

    // If protocol-relative URL
    if (imageSrc.startsWith('//')) {
      const result = `https:${imageSrc}`
      // eslint-disable-next-line no-console
      console.log(`🔗 Protocol-relative URL converted:`, imageSrc, '→', result)
      return result
    }

    // Ensure we have a baseUrl
    if (!baseUrl) {
      // eslint-disable-next-line no-console
      console.warn('❌ No base URL provided for relative image:', imageSrc)
      return imageSrc
    }

    // Clean up baseUrl (remove trailing slash)
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '')

    // If root-relative URL (starts with /)
    if (imageSrc.startsWith('/')) {
      const result = `${cleanBaseUrl}${imageSrc}`
      // eslint-disable-next-line no-console
      console.log(`📁 Root-relative URL converted:`, imageSrc, '→', result)
      return result
    }

    // If relative URL (doesn't start with /)
    const result = `${cleanBaseUrl}/${imageSrc}`
    // eslint-disable-next-line no-console
    console.log(`📂 Relative URL converted:`, imageSrc, '→', result)
    return result
  }
}

// Usage example:
// const parser = new RealEstateHTMLParser();
// const result = parser.parse(htmlString, templateStructure)
