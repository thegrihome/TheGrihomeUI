import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const buildersData = [
  {
    name: 'My Home Group',
    description:
      'Myhome Constructions are a trusted builder in Hyderabad, India, known for on-time completion and superior quality. They have built over 26 million square feet of happy homes and prime commercial properties.',
    website: 'https://www.myhomeconstructions.com',
    contactInfo: {
      company: 'My Home Constructions Pvt. Ltd',
      addresses: [
        {
          type: 'corporate',
          address:
            'H NO 1-123, 8TH FLOOR, 3RD BLOCK, MY HOME HUB, HITECH CITY, MADHAPUR, HYDERABAD - 500 081',
        },
      ],
      phones: ['+91 91549 81692', '+91 91549 81691', '+91 91005 59944'],
      emails: ['mktg@myhomeconstructions.com', 'nri@myhomeconstructions.com'],
    },
  },
  {
    name: 'DSR Builders',
    description: 'DSR Builders, DSR Infrastructure, DSR Group',
    contactInfo: {
      company: 'DSR Group',
      addresses: [
        {
          type: 'hyderabad',
          address:
            'Plot 221, Road Number 17, Jawahar Colony, Jubilee Hills, Hyderabad, Telangana – 500 033',
          mapLink: 'https://maps.app.goo.gl/A27pWrh5PRMMeFDu8',
        },
        {
          type: 'bangalore',
          company: 'DSR Infrastructure Private Limited',
          address: 'DSR Techno Cube, Varthur Road, Thubarahalli, Bengaluru, Karnataka – 560 066',
          mapLink: 'https://maps.app.goo.gl/n1rChujnbr4Vn78o6',
        },
      ],
      phones: [
        {
          location: 'hyderabad',
          type: 'landline',
          numbers: ['+91-40-2999 2222', '+91-40-2999 2223'],
        },
        {
          location: 'hyderabad',
          type: 'mobile',
          numbers: ['+91 90001 35707'],
        },
        {
          location: 'bangalore',
          type: 'mobile',
          numbers: ['+91 90191 92000'],
        },
        {
          location: 'bangalore',
          type: 'landline',
          numbers: ['+91 80491 23000'],
        },
      ],
      emails: [
        {
          email: 'hyd@dsrinfra.com',
          purpose: 'For Hyderabad Projects',
        },
        {
          email: 'admin.blr@dsrinfra.com',
          purpose: 'General Enquiries',
        },
        {
          email: 'sales@dsrinfra.com',
          purpose: 'Residential Project Enquiries',
        },
      ],
    },
  },
  {
    name: 'Sri Sreenivasa Infra',
    description: 'SSI, Sri Srinivasa Infra, Sree Srinivasa Infra',
    contactInfo: {
      company: 'SRI SREENIVAS INFRA',
      addresses: [
        {
          type: 'corporate',
          address:
            '1st & 2nd Floor Plot No:506, Road No:10, Avenue 4, Kakatiya Hills, Madhapur, Hyderabad, Telangana- 500081',
          mapLink: 'https://maps.app.goo.gl/ReqHdfsdsM8rUzWq5',
        },
      ],
      phones: ['+91 79 9766 6630', '+91 87 9000 9000', '+91 79 9766 6690', '+91 96 4243 4567'],
      emails: ['sales@srisreenivasa.com'],
    },
  },
  {
    name: 'Independent',
    description: 'Not Listed, Others',
    contactInfo: {
      company: 'Independent Builder',
      note: 'This category is for unlisted builders or individual developers',
    },
  },
]

async function seedBuilders() {
  console.log('🌱 Starting builder seeding for dev environment...')

  try {
    // Check if we're in dev environment
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ This script should only run in development environment')
      process.exit(1)
    }

    // Check if builders already exist
    const existingBuilders = await prisma.builder.findMany({
      where: {
        name: {
          in: buildersData.map(b => b.name),
        },
      },
    })

    if (existingBuilders.length > 0) {
      console.log('⚠️  Some builders already exist:')
      existingBuilders.forEach(builder => console.log(`   - ${builder.name}`))
      console.log('   Skipping to avoid duplicates.')
      return
    }

    // Insert builders
    for (const builderData of buildersData) {
      const created = await prisma.builder.create({
        data: builderData,
      })
      console.log(`✅ Created builder: ${created.name} (ID: ${created.id})`)
    }

    console.log('🎉 Builder seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding builders:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedBuilders().catch(error => {
  console.error(error)
  process.exit(1)
})
