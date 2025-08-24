import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// My Home Apas project data
const projectData = {
  builderId: 'cmef6irk900001yzwbvrdwa1w', // My Home Group
  locationId: 'cmec3s38i00001y741r5s7gfz', // Hyderabad
  name: 'My Home Apas',
  description:
    "Taking inspiration from the revitalising power of water My Home Apas aims to strike a symmetry in living well - for oneself, and the environment around them. A sustainable, comfortable and healthy way of living. A home that doesn't just welcome you, but refreshes you, like cool water on a hot summer's day. An oasis of tranquillity in the hustle-bustle of modern life, My Home Apas is a community overlooking the calming vistas of lakes Kokapet and Osman Sagar.",
  type: 'RESIDENTIAL' as const,
  numberOfUnits: 1338,
  size: 13.52, // acres
  googlePin: 'https://maps.app.goo.gl/V21goB4Hxu3PnhhY7',
  thumbnailUrl:
    'https://www.myhomeconstructions.com/my-home-apas/assets-avali/my-home-apas-mobile.webp',
  imageUrls: [],
  projectDetails: {
    overview: {
      projectName: 'My Home Apas',
      developer: 'My Home Constructions Pvt. Ltd.',
      projectType: 'Luxury Residential Apartments',
      location: 'Kokapet, Hyderabad, Telangana',
      pinCode: '500075',
    },
    rera: {
      registrationNumber: 'P02400006812',
      status: 'Approved',
      projectStatus: 'Under Construction',
    },
    projectSize: {
      landArea: {
        total: '13.52 acres',
        openSpace: '81.6%',
      },
      construction: {
        towers: 6,
        floors: 'G+44',
        totalUnits: 1338,
        unitsPerFloor: 5,
        clubhouseSize: '72,000 sq.ft (6-floor clubhouse)',
      },
    },
    configurations: {
      available: ['2 BHK', '3 BHK'],
      sizes: {
        '2BHK': '2,565 - 2,845 sq.ft',
        '3BHK': '2,765 - 3,860 sq.ft',
        '3BHK_HomeTheatre': 'Also available',
      },
    },
    pricing: {
      range: '₹2.82 Crores - ₹3.94 Crores',
      perSqFt: '₹10,300 - ₹10,700 per sq.ft',
      averageAreaPrice: '₹10,700 per sq.ft',
    },
    timeline: {
      possessionDate: 'August 2028',
      phaseICompletion: 'June 2027 (Towers 1, 2, and 3)',
      currentStatus: 'Under Construction (as of 2025)',
    },
    address: {
      project: 'Kokapet, Hyderabad, Telangana 500075, India',
      developer: {
        company: 'My Home Constructions Pvt. Ltd.',
        address:
          'H No 1-123, 8th Floor, 3rd Block, My Home Hub, HITECH City, Madhapur, Hyderabad - 500 081',
      },
      coordinates: 'https://maps.app.goo.gl/ipeExSTNuPhXaER58',
      nearestTransit: 'GPR Quarters',
      nearestMetro: 'Madhapur Metro Station',
    },
    connectivity: {
      itHubs: {
        gachibowli: '7-10 km',
        hitecCity: 'Less than 10 km',
        financialDistrict: 'Adjacent/nearby',
        nanakramguda: 'Easy connectivity',
      },
      transportation: {
        airport: '28.8 km (Rajiv Gandhi International Airport)',
        railwayStation: '19.1 km (Hyderabad Deccan Railway Station)',
        outerRingRoad: 'Nearby for convenient airport route',
      },
    },
    nearbyFacilities: {
      education: [
        'Oakridge International School',
        'Phoenix Greens International School',
        'Delhi Public School',
        'Rockwell International School',
        'ISB (Indian School of Business)',
        'IIIT (International Institute of Information Technology)',
        'University of Hyderabad',
      ],
      healthcare: [
        'Continental Hospital (7 km)',
        'Care Hospital',
        'Srija Hospital',
        'AMVI Hospital',
      ],
      shopping: ['Inorbit Mall', 'IKEA', 'SLN Terminus', 'Sarath City Capital Mall'],
      attractions: ['Golkonda Fort (8 km)', 'Qutub Shahi Tomb (10 km)'],
    },
    technicalSpecs: {
      structure: {
        type: 'RCC shear wall-framed structure',
        safety: 'Resistant to wind and earthquake (Zone-2)',
        fireSafety:
          'Fire alarm, automatic sprinklers, wet risers as per Fire Authority Regulations',
        lifts: 'V3F drive high-speed lifts with vitrified tiles/granite lobby cladding',
      },
      finishes: {
        flooring: {
          main: 'Large format (1000 x 1000 mm) double charged vitrified tiles',
          bathrooms: 'Glazed vitrified tile cladding up to lintel height',
        },
        walls: {
          interior: 'Smoothly finished with putty and acrylic emulsion paint',
          exterior:
            'Texture finish & two coats of exterior emulsion paint with architectural features',
        },
        windows: 'Aluminum alloy/UPVC glazed sliding/openable shutters with EPDM gaskets',
        ceiling: 'Grid ceiling in bathrooms/utility, putty finish in other areas',
      },
      utilities: {
        power: 'Three-phase supply for each unit with individual prepaid meters',
        backup: 'Metered DG backup with acoustic enclosure & AMF',
        water: 'Hot and cold water supply provisions',
        billing: 'Automated prepaid billing for water, power, gas & maintenance',
        sewage: 'Adequate capacity STP inside the project',
        waterRecycling: 'Treated sewage water for landscaping and flushing',
        airConditioning: 'ODU space provision for VRV air conditioning system',
        waterproofing: 'Provided for all bathrooms, balconies, utility areas & roof terrace',
      },
    },
    amenities: {
      clubhouse: {
        size: '72,000 sq.ft (6 floors)',
        facilities: [
          'Swimming pool',
          'Gymnasium',
          'Multipurpose hall',
          'Indoor games',
          'Outdoor games',
          'Landscaped gardens',
          'Squash court',
          'Tennis court',
          'Jogging/cycle track',
          'Yoga deck',
          'Party area',
          'Lounge',
          'Seating areas',
        ],
      },
      security: [
        '24x7 security with entrance gate and security cabin',
        'CCTV cameras',
        'Intercom facility',
        'Fire safety systems',
        'Compound wall with gated community',
      ],
      additional: [
        'Medical center/clinic',
        'Convenience store',
        "Kids' play areas/sand pits",
        'Maintenance staff',
        'Visitor parking',
        'Covered car parking',
        'EV charging points',
        'Rain water harvesting',
        'Waste disposal system',
        '24-hour water supply',
        '24-hour backup electricity',
      ],
    },
    environmental: {
      inspiration: 'Project draws inspiration from the revitalizing power of water',
      lakeViews: 'Overlooking Kokapet and Osman Sagar lakes',
      greenSpaces: '81.6% open space dedicated to greenery',
      sustainableLiving: 'Focus on eco-friendly and sustainable design',
    },
    investment: {
      developerTrackRecord: 'My Home Group with 20+ delivered projects',
      appreciationHistory: 'Proven history of significant property appreciation',
      bankApprovals: ['HDFC', 'SBI', 'IDFC First Bank', 'ICICI Bank'],
      premiumLocation: 'Expensive locality with high growth potential',
      rentalPotential: 'Premium rental hub due to proximity to IT hubs',
    },
    assets: {
      images: [
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/My-Home-Apas.webp',
          alt: 'My Home Apas Main View',
        },
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/club-house.webp',
          alt: 'Club House',
        },
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/gallery/Sky-walk.webp',
          alt: 'Sky Walk',
        },
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/gallery/Central-landscape.webp',
          alt: 'Central Landscape',
        },
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/gallery/Gym-area.webp',
          alt: 'Gym Area',
        },
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/gallery/Lakeside-night-view.webp',
          alt: 'Lakeside Night View',
        },
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/gallery/Central-lawn.webp',
          alt: 'Central Lawn',
        },
        {
          type: 'image',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/gallery/Toddler-park.webp',
          alt: 'Toddler Park',
        },
      ],
      floorPlans: [
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-01.webp',
          plan: 'Floor Plan 01',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-02.webp',
          plan: 'Floor Plan 02',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-03.webp',
          plan: 'Floor Plan 03',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-04.webp',
          plan: 'Floor Plan 04',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-05.webp',
          plan: 'Floor Plan 05',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-06.webp',
          plan: 'Floor Plan 06',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-07.webp',
          plan: 'Floor Plan 07',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-08.webp',
          plan: 'Floor Plan 08',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-09.webp',
          plan: 'Floor Plan 09',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-10.webp',
          plan: 'Floor Plan 10',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-11.webp',
          plan: 'Floor Plan 11',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-12.webp',
          plan: 'Floor Plan 12',
        },
        {
          type: 'floor_plan',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assets-avali/Floor-Plans/Floor-Plan-13.webp',
          plan: 'Floor Plan 13',
        },
      ],
      documents: [
        {
          type: 'pdf',
          url: 'https://www.myhomeconstructions.com/my-home-apas/assests-avali/brochure/my-home-apas-brochure.pdf',
          title: 'Project Brochure',
        },
      ],
    },
    routes: {
      builder: '/builders/cmef6irk900001yzwbvrdwa1w',
      project: '/projects/{PROJECT_ID}', // Will be filled after creation
      properties: '/properties?project={PROJECT_ID}', // Will be filled after creation
    },
  },
}

async function createMyHomeApasProject() {
  console.log('🏗️  Creating My Home Apas project...')

  try {
    // Check if project already exists
    const existingProject = await prisma.project.findFirst({
      where: {
        name: {
          contains: 'My Home Apas',
          mode: 'insensitive',
        },
      },
    })

    if (existingProject) {
      console.log(`⚠️  Project 'My Home Apas' already exists (ID: ${existingProject.id})`)
      console.log('   Skipping creation to avoid duplicates.')
      return existingProject
    }

    // Create the project
    const createdProject = await prisma.project.create({
      data: projectData,
    })

    console.log('✅ Successfully created My Home Apas project!')
    console.log(`   - Project ID: ${createdProject.id}`)
    console.log(`   - Name: ${createdProject.name}`)
    console.log(`   - Type: ${createdProject.type}`)
    console.log(`   - Units: ${createdProject.numberOfUnits}`)
    console.log(`   - Size: ${createdProject.size} acres`)

    // Update the routes in project details with actual project ID
    const updatedProjectDetails = {
      ...projectData.projectDetails,
      routes: {
        builder: `/builders/${projectData.builderId}`,
        project: `/projects/${createdProject.id}`,
        properties: `/properties?project=${createdProject.id}`,
      },
    }

    // Update project with correct routes
    await prisma.project.update({
      where: { id: createdProject.id },
      data: { projectDetails: updatedProjectDetails },
    })

    console.log('✅ Updated project routes with actual project ID')

    // Display asset summary
    console.log('\n📸 Asset Summary:')
    console.log(`   - Images: ${projectData.imageUrls.length} gallery images`)
    console.log(
      `   - Floor Plans: ${projectData.projectDetails.assets.floorPlans.length} floor plans`
    )
    console.log(`   - Documents: ${projectData.projectDetails.assets.documents.length} documents`)
    console.log(`   - Thumbnail: ${projectData.thumbnailUrl ? 'Set' : 'Not set'}`)

    console.log('\n🌐 Project Routes:')
    console.log(`   - Builder: localhost:3000/builders/${projectData.builderId}`)
    console.log(`   - Project: localhost:3000/projects/${createdProject.id}`)
    console.log(`   - Properties: localhost:3000/properties?project=${createdProject.id}`)

    return createdProject
  } catch (error) {
    console.error('❌ Error creating My Home Apas project:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
createMyHomeApasProject()
  .then(project => {
    console.log('\n🎉 My Home Apas project creation completed successfully!')
    if (project) {
      console.log(`Project can be accessed at: localhost:3000/projects/${project.id}`)
    }
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
