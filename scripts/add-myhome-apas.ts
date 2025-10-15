import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Creating My Home APAS project...')

    // First, check if builder exists or create it
    let builder = await prisma.builder.findFirst({
      where: { name: 'My Home Constructions' },
    })

    if (!builder) {
      builder = await prisma.builder.create({
        data: {
          name: 'My Home Constructions',
          description:
            'My Home Constructions is a leading real estate developer in Hyderabad, known for creating quality residential projects.',
          logoUrl:
            'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/builder-logo.webp',
          website: 'https://www.myhomeconstructions.com',
          contactInfo: {
            email: 'thegrihome@gmail.com',
            phone: '+91 40 1234 5678',
          },
        },
      })
      console.log('Created builder: My Home Constructions')
    } else {
      console.log('Builder already exists: My Home Constructions')
    }

    // Check if location exists or create it
    let location = await prisma.location.findFirst({
      where: {
        city: 'Hyderabad',
        state: 'Telangana',
        locality: 'Kokapet',
      },
    })

    if (!location) {
      location = await prisma.location.create({
        data: {
          country: 'India',
          state: 'Telangana',
          city: 'Hyderabad',
          locality: 'Kokapet',
          zipcode: '500075',
        },
      })
      console.log('Created location: Kokapet, Hyderabad')
    } else {
      console.log('Location already exists: Kokapet, Hyderabad')
    }

    // Check if project already exists
    const existingProject = await prisma.project.findFirst({
      where: {
        name: 'My Home APAS',
        builderId: builder.id,
      },
    })

    if (existingProject) {
      console.log('Project already exists! Deleting and recreating...')
      await prisma.project.delete({
        where: { id: existingProject.id },
      })
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        builderId: builder.id,
        locationId: location.id,
        name: 'My Home APAS',
        description: `3 BHK Flats for Sale in Kokapet, Apartments in Hyderabad

Taking inspiration from the revitalising power of water My Home Apas aims to strike a symmetry in living well - for oneself, and the environment around them. A sustainable, comfortable and healthy way of living. A home that doesn't just welcome you, but refreshes you, like cool water on a hot summer's day. An oasis of tranquillity in the hustle-bustle of modern life, My Home Apas is a community overlooking the calming vistas of lakes Kokapet and Osman Sagar.

TS RERA Regn No. P02400006812

Nestled in the charming neighborhood of Kokapet, My Home Apas is a residential haven that promises an exceptional living experience. Serene and thoughtfully designed, Kokapet offers easy connectivity to the vibrant hubs of Hyderabad, including the bustling Wipro Junction and Gachibowli, through its well-connected wide roads. Moreover, the Outer Ring Road (ORR) facilitates a convenient route to the airport.

If you seek a prestigious address that places you at the heart of luxury, with access to top-tier shopping malls, upscale restaurants, renowned educational institutions, and global corporate offices, then My Home Apas in Kokapet is the ideal destination to embrace the elevated lifestyle you desire. Experience the essence of opulence and comfort at My Home Apas.`,
        type: 'RESIDENTIAL',
        numberOfUnits: 1338,
        size: 13.52,
        thumbnailUrl:
          'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/banner.png',
        imageUrls: [],
        googlePin:
          'https://maps.google.com/maps?q=My+Home+APAS+Kokapet+Hyderabad&t=&z=15&ie=UTF8&iwloc=&output=embed',
        builderPageUrl: 'https://www.myhomeconstructions.com/my-home-apas/',
        builderProspectusUrl:
          'https://www.myhomeconstructions.com/my-home-apas/assests/brochure/my-home-apas-brochure.pdf',
        projectDetails: {
          overview: {
            description:
              'An oasis of tranquillity in the hustle-bustle of modern life, My Home Apas is a community overlooking the calming vistas of lakes Kokapet and Osman Sagar.',
            reraNumber: 'P02400006812',
          },
          highlights: [
            {
              label: 'Sky High Towers',
              value: '6',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
            {
              label: 'Floors',
              value: 'G+44',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
            {
              label: 'Open Space',
              value: '81.6',
              unit: '%',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
            {
              label: 'Land Extent',
              value: '13.52',
              unit: 'Acres',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
            {
              label: 'Clubhouse',
              value: '72,000',
              unit: 'SFT',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
            {
              label: 'Luxury Apartments',
              value: '3 & 4 BHK',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
            {
              label: 'Size Range',
              value: '2765 - 3860',
              unit: 'SFT',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
            {
              label: 'Number of Flats',
              value: '1338',
              icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
            },
          ],
          amenities: {
            outdoorImages: [
              {
                name: 'Tennis Court with Viewing Gallery',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
              {
                name: 'Toddler Park',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
              {
                name: 'Swimming Pool',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
              {
                name: 'Sculpture Garden',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
              {
                name: 'Walking / Jogging Track',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
              {
                name: 'Seating Area',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
            ],
            indoorImages: [
              {
                name: 'Tower Lobby',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
              {
                name: 'Pavilion',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
              {
                name: 'Tower Entrance',
                icon: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/myhome-apas-logo.png',
              },
            ],
          },
          clubhouse: {
            description: `CLUBHOUSE 1 - COTTA
58,000 SFT, G+4 FLOORS
We know how essential it is to stay connected to our true elements to be able to live a fulfilling life. At My Home Apas, the Clubhouse is more than just a building – it's a gateway to a life well-lived. Here, you'll discover a world of possibilities, where leisure, wellness, and social connection intertwine to create an unparalleled living experience. Come, immerse yourself, and unlock the door to a future filled with endless joy, fulfillment, and memories to cherish for a lifetime.

CLUBHOUSE 2 - TERRA
47,000 SFT, G+3 FLOORS
Where opulence meets relaxation in perfect harmony. Immerse yourself in the tranquil ambiance of meticulously designed spaces, crafted to cater to every need. Indulge your senses in the state-of-the-art fitness center. Rejuvenate your mind, body, and soul in spa retreat, with bespoke treatments and therapies.`,
          },
          assets: {
            layout: {
              url: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/layout.webp',
              title: 'My Home APAS Site Layout',
            },
            videos: [
              {
                url: 'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/video.mp4',
                poster:
                  'https://jeczfxlhtp0pv0xq.public.blob.vercel-storage.com/the-grihome-ui-dev-blob/hyderabad-projects/myhome-apas/banner.png',
              },
            ],
          },
          specifications: {
            'Super Structure': {
              Description:
                'RCC shear wall-framed structure, resistant to wind and earthquake (Zone -2)',
            },
            Walls: {
              'External Walls': 'Reinforced shear walls',
              'Internal Walls': 'Reinforced shear walls',
            },
            'Ceiling Finishes': {
              'Drawing, Dining, Living, Bedrooms, Kitchen and Balcony':
                'Smoothly finished with putty and acrylic emulsion paint.',
              Bathroom: 'Grid ceiling to cover all service lines.',
            },
            'Wall Finishing': {
              'Drawing, Dining, Living, Bedrooms, Kitchen and Balcony':
                'Smoothly finished with putty and acrylic emulsion paint.',
              Bathroom: 'Glazed vitrified tile cladding up to lintel height.',
              'External Finishing':
                'Texture finish & two coats of exterior emulsion paint of reputed brands with architectural features.',
            },
            Flooring: {
              'Drawing, Dining, Living, Bedrooms, Kitchen':
                'Large format (1000 x 1000 mm size) double charged vitrified tiles of reputed make.',
              'Balcony / Bathroom / Utility': 'Anti-skid vitrified tiles.',
              'Corridors Flooring': 'Vitrified tiles with spacer joint.',
              Staircase: 'Natural stone / granite flooring.',
            },
            'Windows / Grills': {
              Description:
                'Aluminum alloy / UPVC glazed sliding or openable shutters with EPDM gaskets, necessary hardware, M.S. grill, and provision for mosquito mesh shutter.',
            },
            Doors: {
              'Main Doors':
                'Hard wood frame, finished with melamine spray polish, teak finished flush shutters with reputed hardware.',
              'Internal Doors':
                'Hard wood frame or factory made wooden frame with both side laminated flush shutter with reputed hardware.',
              'Bathroom / Utility':
                'Granite frame with both side laminated flush shutter with reputed hardware.',
              Balconies:
                'Aluminum / UPVC glazed French sliding doors with mosquito mesh provision.',
            },
            'All Bathrooms': {
              Fittings: [
                'Vanity type wash basin with single lever basin mixer.',
                'EWC with flush valve of reputed brand.',
                'Single lever bath and shower mixer.',
                'Provision for geysers in all bathrooms.',
                'All faucets are chrome plated by reputed brands.',
              ],
            },
            Kitchen: {
              Platform: 'Granite platform with single bowl stainless steel sink.',
              Provisions: 'Provision for hot & cold water and provision for water purifier.',
            },
            Electrical: {
              Wiring: 'Concealed copper wiring of reputed make.',
              'Power Outlets': [
                'Air conditioners in all bedrooms and living.',
                'Geysers in all bathrooms and utility.',
                'Chimney, hob, refrigerator, microwave oven, mixer/grinder, and water purifier in kitchen.',
                'Washing machine & dishwasher point in utility area.',
              ],
              Supply: 'Three phase supply for each unit and individual prepaid meters.',
              Safety:
                'Miniature circuit breakers (MCB) for each distribution board of reputed make.',
              Switches: 'Modular switches of reputed make.',
            },
            'TV / Telephone': {
              Internet: 'Provision for internet connection & DTH.',
              Telephone: 'Telephone point in drawing.',
              TV: 'TV points in all bedrooms, drawing & living.',
            },
            Waterproofing: {
              Description:
                'Waterproofing shall be provided for all bathrooms, balconies, utility area & roof terrace.',
            },
            Security: {
              Systems: [
                'Intercom facility to all units connecting security.',
                'Comprehensive security system with cameras at main security, tower entrance & lift cabins.',
              ],
            },
            'Fire Safety': {
              Description:
                'Fire alarm, automatic sprinklers, and wet risers as per Fire Authority Regulations.',
            },
            'Power Backup': {
              Description: 'Metered DG backup with acoustic enclosure & AMF.',
            },
            'LPG / Webp': {
              Description: 'Supply of gas from LPG / webp.',
            },
            Lifts: {
              Description:
                'V3F drive high speed lifts of reputed make. Lift lobby cladding with vitrified tiles / granite.',
            },
            'WTP & STP': {
              'Water Treatment':
                'Water treatment plant for bore-well water and water meter for each unit.',
              'Sewage Treatment':
                'A sewage treatment plant of adequate capacity as per norms will be provided inside the project.',
              Reuse: 'Treated sewage water for landscape and flushing purpose.',
            },
            'Billing System': {
              Description: 'Automated billing system for water, power, gas, & maintenance.',
            },
          },
        },
      },
    })

    console.log('✅ Successfully created My Home APAS project!')
    console.log('Project ID:', project.id)
    console.log('Project Name:', project.name)
    console.log('Location:', location.locality, ',', location.city)
    console.log('Builder:', builder.name)
    console.log('\nYou can now view the project at: /projects/' + project.id)
  } catch (error) {
    console.error('❌ Error creating project:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
