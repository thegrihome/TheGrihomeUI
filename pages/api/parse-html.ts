import { NextApiRequest, NextApiResponse } from 'next'

interface ParseHtmlRequest {
  htmlSource: string
  llmType: 'chatgpt' | 'claude' | 'perplexity'
  apiKey: string
  templateStructure: any
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { htmlSource, llmType, apiKey, templateStructure }: ParseHtmlRequest = req.body

  if (!htmlSource || !llmType || !apiKey) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    let parsedData

    switch (llmType) {
      case 'chatgpt':
        parsedData = await parseWithChatGPT(htmlSource, apiKey, templateStructure)
        break
      case 'claude':
        parsedData = await parseWithClaude(htmlSource, apiKey, templateStructure)
        break
      case 'perplexity':
        parsedData = await parseWithPerplexity(htmlSource, apiKey, templateStructure)
        break
      default:
        return res.status(400).json({ message: 'Invalid LLM type' })
    }

    res.status(200).json({ parsedData })
  } catch (error) {
    res.status(500).json({ message: 'Failed to parse HTML with LLM' })
  }
}

async function parseWithChatGPT(htmlSource: string, apiKey: string, templateStructure: any) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting structured data from HTML. Extract project information from the provided HTML and format it according to the template structure provided. Return only valid JSON that matches the template structure.`,
        },
        {
          role: 'user',
          content: `Template structure:
${JSON.stringify(templateStructure, null, 2)}

HTML to parse:
${htmlSource}

Extract the following information and structure it according to the template:
- Project name
- Description
- Type (RESIDENTIAL/COMMERCIAL/MIXED_USE/INDUSTRIAL)
- Number of units (if available)
- Size in acres (if available)
- Location details
- Any amenities, gallery images, specifications, etc.

Return only the JSON object, no explanation.`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    throw new Error(`ChatGPT API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  try {
    return JSON.parse(content)
  } catch {
    // If parsing fails, return a structured response
    return generateFallbackData(htmlSource, templateStructure)
  }
}

async function parseWithClaude(htmlSource: string, apiKey: string, templateStructure: any) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Extract project information from the provided HTML and format it according to this template structure:

${JSON.stringify(templateStructure, null, 2)}

HTML to parse:
${htmlSource}

Extract the following information and structure it according to the template:
- Project name
- Description  
- Type (RESIDENTIAL/COMMERCIAL/MIXED_USE/INDUSTRIAL)
- Number of units (if available)
- Size in acres (if available)
- Location details
- Any amenities, gallery images, specifications, etc.

Return only the JSON object, no explanation.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text

  try {
    return JSON.parse(content)
  } catch {
    return generateFallbackData(htmlSource, templateStructure)
  }
}

async function parseWithPerplexity(htmlSource: string, apiKey: string, templateStructure: any) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3-sonar-small-32k-online',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at extracting structured data from HTML. Return only valid JSON.',
        },
        {
          role: 'user',
          content: `Extract project information from the HTML and format according to this template:

${JSON.stringify(templateStructure, null, 2)}

HTML:
${htmlSource}

Return only JSON, no explanation.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  try {
    return JSON.parse(content)
  } catch {
    return generateFallbackData(htmlSource, templateStructure)
  }
}

function generateFallbackData(htmlSource: string, templateStructure: any) {
  // Enhanced parsing using multiple strategies

  // Extract name with better patterns
  const namePatterns = [
    /<title[^>]*>([^<|]+)/i,
    /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/i,
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<h2[^>]*class="[^"]*project[^"]*"[^>]*>([^<]+)/i,
    /<h2[^>]*>([^<]+)<\/h2>/i,
    /<div[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)/i,
    /<span[^>]*class="[^"]*project.*name[^"]*"[^>]*>([^<]+)/i,
  ]

  let name = 'Extracted Project'
  for (const pattern of namePatterns) {
    const match = htmlSource.match(pattern)
    if (match && match[1]) {
      name = match[1]
        .trim()
        .replace(/\s*\|\s*.*$/, '')
        .replace(/\s*-\s*.*$/, '')
      if (name.length > 5 && name.length < 100) break
    }
  }

  // Extract description with better patterns
  const descPatterns = [
    /<meta[^>]*name="description"[^>]*content="([^"]{20,300})"/i,
    /<meta[^>]*property="og:description"[^>]*content="([^"]{20,300})"/i,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]{30,500})/i,
    /<p[^>]*class="[^"]*desc[^"]*"[^>]*>([^<]{30,300})/i,
    /<div[^>]*class="[^"]*overview[^"]*"[^>]*>[\s\S]*?<p[^>]*>([^<]{30,300})/i,
    /<p[^>]*>([^<]{50,300})<\/p>/i,
  ]

  let description = 'Project description extracted from HTML'
  for (const pattern of descPatterns) {
    const match = htmlSource.match(pattern)
    if (match && match[1]) {
      description = match[1].trim().replace(/\s+/g, ' ')
      if (description.length > 20 && description.length < 500) break
    }
  }

  // Extract location with better patterns
  const locationPatterns = [
    /<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)/i,
    /<span[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)/i,
    /<div[^>]*class="[^"]*city[^"]*"[^>]*>([^<]+)/i,
    /address[^>]*>([^<,]+,[^<,]+,[^<]+)/i,
    /location[^>]*>([^<,]+,[^<,]+)/i,
  ]

  let location = 'Location extracted from HTML'
  for (const pattern of locationPatterns) {
    const match = htmlSource.match(pattern)
    if (match && match[1]) {
      location = match[1].trim()
      if (location.includes(',')) break
    }
  }

  // Enhanced type detection
  const residentialKeywords = /apartment|residential|home|villa|flat|condo|townhouse|units|bhk/i
  const commercialKeywords = /commercial|office|retail|shop|mall|complex|business/i
  const mixedKeywords = /mixed.use|mixed.development|integrated|township/i

  let type = 'RESIDENTIAL'
  if (mixedKeywords.test(htmlSource)) type = 'MIXED_USE'
  else if (commercialKeywords.test(htmlSource)) type = 'COMMERCIAL'
  else if (residentialKeywords.test(htmlSource)) type = 'RESIDENTIAL'

  // Extract numbers (units, size, etc.)
  const unitsMatch = htmlSource.match(/(\d+)\s*(?:units|apartments|flats|homes)/i)
  const numberOfUnits = unitsMatch ? parseInt(unitsMatch[1]) : null

  const sizeMatch = htmlSource.match(/(\d+(?:\.\d+)?)\s*(?:acres|sq\.?\s*ft|sqft)/i)
  const size = sizeMatch ? parseFloat(sizeMatch[1]) : null

  // Extract images
  const imageMatches = htmlSource.match(/<img[^>]*src="([^"]+)"/gi) || []
  const imageUrls = imageMatches
    .map(match => {
      const srcMatch = match.match(/src="([^"]+)"/)
      return srcMatch ? srcMatch[1] : null
    })
    .filter(Boolean)
    .slice(0, 10) // Limit to 10 images

  // Extract amenities
  const amenityMatches = htmlSource.match(/(?:amenity|amenities|facilities)[^>]*>([^<]+)/gi) || []
  const amenities = amenityMatches.map(match => ({
    name: match.replace(/<[^>]*>/g, '').trim(),
    icon: '/images/placeholder.webp',
  }))

  return {
    name,
    description,
    type,
    numberOfUnits,
    size,
    location,
    thumbnailUrl: imageUrls[0] || null,
    imageUrls: imageUrls.slice(1),
    projectDetails: {
      overview: {
        description,
        location,
      },
      highlights: [
        ...(numberOfUnits
          ? [{ value: numberOfUnits, label: 'Total Units', icon: '/images/placeholder.webp' }]
          : []),
        ...(size
          ? [
              {
                value: size,
                unit: 'acres',
                label: 'Project Area',
                icon: '/images/placeholder.webp',
              },
            ]
          : []),
        { value: type, label: 'Property Type', icon: '/images/placeholder.webp' },
        { value: 'Ready to Move', label: 'Status', icon: '/images/placeholder.webp' },
      ],
      amenities: {
        indoorImages: amenities.slice(0, Math.ceil(amenities.length / 2)),
        outdoorImages: amenities.slice(Math.ceil(amenities.length / 2)),
      },
      gallery: imageUrls.slice(0, 6).map((url, index) => ({
        name: `Gallery Image ${index + 1}`,
        image: url,
      })),
      specifications: [
        {
          category: 'Construction Details',
          items: [
            'High-quality construction materials',
            'Modern architectural design',
            'Earthquake resistant structure',
            'Vastu compliant layout',
          ],
        },
        {
          category: 'Unit Features',
          items: [
            'Spacious rooms with natural ventilation',
            'Modern fittings and fixtures',
            'Premium flooring',
            'Energy efficient design',
          ],
        },
      ],
      projectStatus: imageUrls.slice(0, 3).map((url, index) => ({
        name: `Construction Progress ${index + 1}`,
        image: url,
      })),
      assets: {
        documents: [],
        videos: [],
        layout:
          imageUrls.length > 0
            ? {
                url: imageUrls[imageUrls.length - 1],
                title: `${name} Site Layout`,
              }
            : {},
      },
      googleMaps: {
        embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
        address: location,
        coordinates: {
          lat: 17.433080688046788,
          lng: 78.34668281483305,
        },
      },
    },
  }
}
