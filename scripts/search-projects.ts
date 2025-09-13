import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function searchProjects() {
  console.log('🔍 Searching for My Home Akrida and My Home Apas projects...')

  try {
    // Search for specific projects
    const apasProject = await prisma.project.findFirst({
      where: {
        name: {
          contains: 'My Home Apas',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        projectDetails: true,
        builder: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            city: true,
            state: true,
            locality: true,
          },
        },
      },
    })

    const akridaProject = await prisma.project.findFirst({
      where: {
        name: {
          contains: 'My Home Akrida',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        projectDetails: true,
        builder: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            city: true,
            state: true,
            locality: true,
          },
        },
      },
    })

    const projects = [apasProject, akridaProject].filter(Boolean)

    // Also search broadly for any project with these terms
    const broadSearch = await prisma.project.findMany({
      where: {
        OR: [
          {
            name: {
              contains: 'Akrida',
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: 'Apas',
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        projectDetails: true,
        builder: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            city: true,
            state: true,
            locality: true,
          },
        },
      },
    })

    if (projects.length === 0) {
      console.log('❌ No projects found matching "My Home Akrida" or "My Home Apas"')

      // Let's search for all My Home projects to see what's available
      const myHomeProjects = await prisma.project.findMany({
        where: {
          name: {
            contains: 'My Home',
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          builder: {
            select: {
              name: true,
            },
          },
        },
      })

      console.log(`\n📋 Found ${myHomeProjects.length} "My Home" projects:`)
      myHomeProjects.forEach(project => {
        if (!project) return
        console.log(
          `   - ${project.name} (ID: ${project.id}) - Builder: ${project.builder?.name || 'Unknown'}`
        )
      })
    } else {
      console.log(`✅ Found ${projects.length} matching projects:`)

      projects.forEach(project => {
        if (!project) return

        console.log(`\n📦 Project: ${project.name}`)
        console.log(`   - ID: ${project.id}`)
        console.log(`   - Builder: ${project.builder?.name || 'Unknown'}`)
        console.log(
          `   - Location: ${project.location?.locality ? project.location.locality + ', ' : ''}${project.location?.city || 'Unknown'}, ${project.location?.state || 'Unknown'}`
        )
        console.log(
          `   - Description: ${project.description?.substring(0, 100) || 'No description'}...`
        )

        // Check if projectDetails contains projectStatus
        const details = project.projectDetails as any
        if (details && details.projectStatus) {
          console.log(`   - Project Status Items: ${details.projectStatus.length}`)
          if (details.projectStatus.length > 0) {
            console.log(
              `   - Sample Status Item: ${JSON.stringify(details.projectStatus[0], null, 2)}`
            )
          }
        } else {
          console.log(`   - Project Status: Not found in projectDetails`)
        }
      })
    }
  } catch (error) {
    console.error('❌ Error searching projects:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the search
searchProjects()
  .then(() => {
    console.log('\n✅ Search completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Search failed:', error)
    process.exit(1)
  })
