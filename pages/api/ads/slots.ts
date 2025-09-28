import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getSession({ req })
    const userId = session?.user?.email
      ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id
      : null

    // Get all ad slots with their current active ads
    const slots = await prisma.adSlotConfig.findMany({
      orderBy: {
        slotNumber: 'asc',
      },
      include: {
        ads: {
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(),
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            property: {
              select: {
                id: true,
                project: {
                  select: {
                    name: true,
                  },
                },
                propertyDetails: true,
                propertyType: true,
                sqFt: true,
                thumbnailUrl: true,
                imageUrls: true,
                location: {
                  select: {
                    city: true,
                    state: true,
                    locality: true,
                  },
                },
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                thumbnailUrl: true,
                imageUrls: true,
                location: {
                  select: {
                    city: true,
                    state: true,
                    locality: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    // Transform the data for frontend
    const adSlots = slots.map(slot => {
      const currentAd = slot.ads[0] || null
      const isExpiringSoon = currentAd
        ? new Date(currentAd.endDate).getTime() - new Date().getTime() <= 3 * 24 * 60 * 60 * 1000
        : false
      const isUserAd = currentAd && userId ? currentAd.userId === userId : false

      return {
        slotNumber: slot.slotNumber,
        basePrice: slot.basePrice,
        isActive: slot.isActive,
        hasAd: !!currentAd,
        isExpiringSoon,
        isUserAd,
        ad: currentAd
          ? {
              id: currentAd.id,
              endDate: currentAd.endDate,
              totalDays: currentAd.totalDays,
              totalAmount: currentAd.totalAmount,
              user: {
                id: currentAd.user.id,
                name: currentAd.user.name || currentAd.user.username,
              },
              property: currentAd.property
                ? {
                    id: currentAd.property.id,
                    title: currentAd.property.project?.name || 'Individual Property',
                    type: currentAd.property.propertyType,
                    sqFt: currentAd.property.sqFt,
                    details: currentAd.property.propertyDetails as any,
                    thumbnail: currentAd.property.thumbnailUrl || currentAd.property.imageUrls[0],
                    location: {
                      locality: currentAd.property.location.locality,
                      city: currentAd.property.location.city,
                      state: currentAd.property.location.state,
                    },
                  }
                : null,
              project: currentAd.project
                ? {
                    id: currentAd.project.id,
                    name: currentAd.project.name,
                    description: currentAd.project.description,
                    thumbnail: currentAd.project.thumbnailUrl || currentAd.project.imageUrls[0],
                    location: {
                      locality: currentAd.project.location.locality,
                      city: currentAd.project.location.city,
                      state: currentAd.project.location.state,
                    },
                  }
                : null,
            }
          : null,
      }
    })

    res.status(200).json({ adSlots })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
