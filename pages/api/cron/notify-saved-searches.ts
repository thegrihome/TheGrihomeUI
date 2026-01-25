import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { Resend } from 'resend'
import { sendSellerInterestWhatsApp } from '@/lib/msg91/whatsapp'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'Zillfin <no-reply@zillfin.com>'

interface PropertyMatch {
  id: string
  streetAddress: string
  propertyType: string
  listingType: string
  sqFt: number | null
  thumbnailUrl: string | null
  propertyDetails: {
    title?: string
    price?: number
    bedrooms?: number
    bathrooms?: number
  }
  location: {
    city: string
    state: string
    locality: string | null
  }
}

interface SavedSearchWithUser {
  id: string
  name: string
  searchQuery: {
    propertyType?: string
    listingType?: string
    bedrooms?: string
    bathrooms?: string
    location?: string
    priceMin?: string
    priceMax?: string
    sizeMin?: string
    sizeMax?: string
  }
  lastNotified: Date | null
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
    emailVerified: Date | null
    mobileVerified: Date | null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET or POST requests (Vercel Cron uses GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Find all active saved searches
    const savedSearches = await prisma.savedSearch.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            mobileVerified: true,
          },
        },
      },
    })

    const results = {
      processed: 0,
      emailsSent: 0,
      whatsAppSent: 0,
      errors: [] as string[],
    }

    for (const savedSearch of savedSearches as SavedSearchWithUser[]) {
      try {
        // Calculate the date threshold (24 hours ago, or from lastNotified)
        const dateThreshold = savedSearch.lastNotified
          ? new Date(savedSearch.lastNotified)
          : new Date(Date.now() - 24 * 60 * 60 * 1000) // Default to 24 hours ago

        // Build query conditions based on saved search filters
        const whereConditions: any = {
          createdAt: { gt: dateThreshold },
          listingStatus: 'ACTIVE',
        }

        if (savedSearch.searchQuery.propertyType) {
          whereConditions.propertyType = savedSearch.searchQuery.propertyType
        }

        if (savedSearch.searchQuery.listingType) {
          whereConditions.listingType = savedSearch.searchQuery.listingType
        }

        if (savedSearch.searchQuery.location) {
          whereConditions.OR = [
            { searchText: { contains: savedSearch.searchQuery.location, mode: 'insensitive' } },
            {
              location: {
                OR: [
                  { city: { contains: savedSearch.searchQuery.location, mode: 'insensitive' } },
                  { locality: { contains: savedSearch.searchQuery.location, mode: 'insensitive' } },
                  { state: { contains: savedSearch.searchQuery.location, mode: 'insensitive' } },
                ],
              },
            },
          ]
        }

        // Handle price filters via propertyDetails JSON
        // Note: JSON field filtering in Prisma is limited, so we'll do post-filtering
        const properties = await prisma.property.findMany({
          where: whereConditions,
          include: {
            location: {
              select: {
                city: true,
                state: true,
                locality: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20, // Limit to 20 most recent matching properties
        })

        // Post-filter for additional criteria
        const matchingProperties = properties.filter((property: any) => {
          const details = property.propertyDetails as any

          // Filter by bedrooms
          if (savedSearch.searchQuery.bedrooms) {
            const searchBeds = savedSearch.searchQuery.bedrooms.replace('+', '')
            const propBeds = details?.bedrooms?.toString() || '0'
            if (savedSearch.searchQuery.bedrooms.includes('+')) {
              if (parseInt(propBeds) < parseInt(searchBeds)) return false
            } else {
              if (propBeds !== searchBeds) return false
            }
          }

          // Filter by bathrooms
          if (savedSearch.searchQuery.bathrooms) {
            const searchBaths = savedSearch.searchQuery.bathrooms.replace('+', '')
            const propBaths = details?.bathrooms?.toString() || '0'
            if (savedSearch.searchQuery.bathrooms.includes('+')) {
              if (parseInt(propBaths) < parseInt(searchBaths)) return false
            } else {
              if (propBaths !== searchBaths) return false
            }
          }

          // Filter by price
          const price = details?.price || 0
          if (savedSearch.searchQuery.priceMin) {
            if (price < parseFloat(savedSearch.searchQuery.priceMin)) return false
          }
          if (savedSearch.searchQuery.priceMax) {
            if (price > parseFloat(savedSearch.searchQuery.priceMax)) return false
          }

          // Filter by size
          const sqFt = property.sqFt || 0
          if (savedSearch.searchQuery.sizeMin) {
            if (sqFt < parseFloat(savedSearch.searchQuery.sizeMin)) return false
          }
          if (savedSearch.searchQuery.sizeMax) {
            if (sqFt > parseFloat(savedSearch.searchQuery.sizeMax)) return false
          }

          return true
        }) as PropertyMatch[]

        results.processed++

        // If there are matching properties, send notifications
        if (matchingProperties.length > 0) {
          const { user } = savedSearch
          const baseUrl = process.env.NEXTAUTH_URL || 'https://grihome.com'

          // Send email if verified
          if (user.emailVerified && user.email) {
            const propertyListHtml = matchingProperties
              .map(p => {
                const details = p.propertyDetails as any
                return `
                <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937;">${details?.title || p.streetAddress}</h3>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                    ${p.location?.locality ? p.location.locality + ', ' : ''}${p.location?.city || ''}, ${p.location?.state || ''}
                  </p>
                  ${details?.price ? `<p style="margin: 0; color: #2563eb; font-weight: 600;">₹${formatPrice(details.price)}</p>` : ''}
                  <a href="${baseUrl}/properties/${p.id}" style="display: inline-block; margin-top: 8px; color: #2563eb; text-decoration: none;">View Property →</a>
                </div>
              `
              })
              .join('')

            const emailHtml = `
              <h2>New Properties Matching "${savedSearch.name}"</h2>

              <p>Hello ${user.name || 'there'},</p>

              <p>We found <strong>${matchingProperties.length}</strong> new ${matchingProperties.length === 1 ? 'property' : 'properties'} matching your saved search!</p>

              ${propertyListHtml}

              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af;">
                You're receiving this because you have saved searches enabled on Zillfin.
                <a href="${baseUrl}/saved-searches">Manage your saved searches</a>
              </p>
            `

            try {
              const emailResult = await resend.emails.send({
                from: FROM_EMAIL,
                to: [user.email],
                subject: `${matchingProperties.length} new ${matchingProperties.length === 1 ? 'property' : 'properties'} matching "${savedSearch.name}"`,
                html: emailHtml,
              })

              if (!emailResult.error) {
                results.emailsSent++
              }
            } catch (emailError) {
              results.errors.push(`Email to ${user.email}: ${emailError}`)
            }
          }

          // Send WhatsApp if mobile is verified
          if (user.mobileVerified && user.phone) {
            try {
              // Reuse grihome_notification template
              // body_1: Search name, body_2: User name, body_3: Property count, body_4: Sample property, body_5: Link
              const firstProperty = matchingProperties[0]
              const details = firstProperty?.propertyDetails as any

              const whatsAppResult = await sendSellerInterestWhatsApp({
                sellerPhone: user.phone,
                propertyName: savedSearch.name, // body_1
                sellerName: user.name || 'there', // body_2
                buyerName: `${matchingProperties.length} new listing${matchingProperties.length > 1 ? 's' : ''}`, // body_3
                buyerEmail: details?.title || firstProperty?.streetAddress || 'New property', // body_4
                buyerMobile: `${baseUrl}/properties`, // body_5
              })

              if (whatsAppResult.success) {
                results.whatsAppSent++
              }
            } catch (whatsAppError) {
              results.errors.push(`WhatsApp to ${user.phone}: ${whatsAppError}`)
            }
          }
        }

        // Update lastNotified timestamp
        await prisma.savedSearch.update({
          where: { id: savedSearch.id },
          data: { lastNotified: new Date() },
        })
      } catch (searchError) {
        results.errors.push(`Search ${savedSearch.id}: ${searchError}`)
      }
    }

    return res.status(200).json({
      message: 'Saved search notifications processed',
      results,
      totalSearches: savedSearches.length,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error processing saved search notifications:', error)
    }
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Helper function to format price
function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `${(price / 10000000).toFixed(price % 10000000 === 0 ? 0 : 2)} Cr`
  }
  if (price >= 100000) {
    return `${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 2)} Lac`
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`
  }
  return price.toString()
}
