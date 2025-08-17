import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateMyHomeApasImages() {
  try {
    // New working image URLs for gallery
    const newImageUrls = [
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/logo.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/my-home-apas-mobile.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-01.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-02.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-03.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-04.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-05.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-06.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-07.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/highlights-08.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/My-Home-apas-ClubHouse.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/site-layout.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_bridge-cam.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_central-land-scape.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_reading-lounge.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_lake-view.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_central-land-scape-lower-angle.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/galllery_kids-cam.webp',
      'https://www.myhomeconstructions.com/my-home-apas/assets-avali/hero-img.webp',
    ]

    // Updated project details with working URLs
    const updatedProjectDetails = {
      overview: {
        projectType: 'Residential Apartment Complex',
        pinCode: '500081',
      },
      projectSize: {
        landArea: {
          total: '47.5 acres',
          openSpace: '75% green space',
        },
        construction: {
          towers: '15 towers',
          totalUnits: '1338 apartments',
        },
      },
      pricing: {
        range: '₹85 Lakhs - ₹1.8 Crores',
        perSqFt: '₹4,200 - ₹5,800 per sq.ft',
      },
      amenities: {
        clubhouse: {
          size: '50,000 sq.ft',
          facilities: [
            'Swimming Pool',
            'Gymnasium',
            'Indoor Games',
            'Banquet Hall',
            'Library',
            'Kids Play Area',
            'Spa & Wellness',
            'Business Center',
          ],
        },
        additional: [
          'Tennis Court',
          'Basketball Court',
          'Jogging Track',
          'Cycling Track',
          'Yoga Deck',
          'Meditation Garden',
          'Senior Citizens Area',
          'Amphitheatre',
          'Food Court',
          'Convenience Store',
          '24/7 Security',
          'Power Backup',
          'Rainwater Harvesting',
          'Waste Management',
          'Fire Safety Systems',
        ],
      },
      technicalSpecs: {
        structure: {
          type: 'RCC Frame Structure',
          safety: 'Earthquake Resistant Design',
        },
        finishes: {
          flooring: {
            main: 'Vitrified tiles in living areas, Anti-skid tiles in bathrooms',
          },
          walls: {
            interior: 'Premium emulsion paint on smooth plaster',
          },
        },
      },
      connectivity: {
        itHubs: {
          hitechCity: '8 km',
          gachibowli: '12 km',
          madhapur: '15 km',
          cyberTowers: '10 km',
          financialDistrict: '20 km',
        },
        transportation: {
          nearestMetro: 'Miyapur Metro - 5 km',
          busStops: 'Multiple bus stops within 500m',
          airport: 'Rajiv Gandhi International Airport - 35 km',
          railwayStation: 'Secunderabad Railway Station - 25 km',
        },
      },
      assets: {
        images: newImageUrls.map((url, index) => ({
          url,
          alt: `My Home Apas - Image ${index + 1}`,
          type: 'gallery',
        })),
        floorPlans: [
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-01.webp',
            title: '2 BHK - Type A',
            area: '1050 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-02.webp',
            title: '2 BHK - Type B',
            area: '1125 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-03.webp',
            title: '2 BHK - Type C',
            area: '1200 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-04.webp',
            title: '3 BHK - Type A',
            area: '1450 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-05.webp',
            title: '3 BHK - Type B',
            area: '1520 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-06.webp',
            title: '3 BHK - Type C',
            area: '1650 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-07.webp',
            title: '3 BHK - Duplex',
            area: '1800 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-08.webp',
            title: '4 BHK - Type A',
            area: '2100 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-09.webp',
            title: '4 BHK - Type B',
            area: '2250 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-10.webp',
            title: '4 BHK - Penthouse',
            area: '2800 sq.ft',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-11.webp',
            title: 'Site Layout Plan',
            area: '47.5 acres',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-12.webp',
            title: 'Amenities Layout',
            area: '50,000 sq.ft clubhouse',
          },
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-13.webp',
            title: 'Landscape Plan',
            area: '75% green space',
          },
        ],
        documents: [
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assests/brochure/my-home-apas-brochure.pdf',
            title: 'Project Brochure',
            type: 'pdf',
          },
        ],
        videos: [
          {
            url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/video/Testimonia3.mp4',
            title: 'Project Walkthrough',
            type: 'mp4',
          },
        ],
      },
    }

    // Find the My Home Apas project
    const project = await prisma.project.findFirst({
      where: {
        name: 'My Home Apas',
      },
    })

    if (!project) {
      console.log('❌ My Home Apas project not found')
      return
    }

    // Update the project with new image URLs and project details
    const updatedProject = await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        imageUrls: newImageUrls,
        thumbnailUrl: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/logo.webp',
        projectDetails: updatedProjectDetails,
      },
    })

    console.log('✅ Successfully updated My Home Apas project with new working image URLs')
    console.log(`📊 Updated ${newImageUrls.length} gallery images`)
    console.log(`🏗️ Updated project details with new structure`)
    console.log(`🔗 New thumbnail URL: ${updatedProject.thumbnailUrl}`)
  } catch (error) {
    console.error('❌ Error updating My Home Apas images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateMyHomeApasImages()
