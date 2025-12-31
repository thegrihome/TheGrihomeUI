/**
 * Migration Script: Reorganize scattered project folders in Blob Storage
 *
 * Problem:
 * The ImageUploaderDirect component was adding random suffixes to folder names,
 * creating multiple folders for the same project:
 *   - my-home-grava-3ggpkdb0/
 *   - my-home-grava-io6gufme/
 *   - my-home-grava-ts8cnjtu/
 *   - my-home-grava/
 *
 * Solution:
 * This script consolidates them into a single folder:
 *   - my-home-grava/
 *     - banner/
 *     - floorplans/
 *     - gallery/
 *     - clubhouse/
 *     - sitelayout/
 *
 * Usage:
 *   source .env.local && BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN_PROD npx tsx scripts/reorganize-project-images.ts
 *
 * For dry run (no changes):
 *   source .env.local && BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN_PROD DRY_RUN=true npx tsx scripts/reorganize-project-images.ts
 */

/* eslint-disable no-console */

import { list, put, del, copy } from '@vercel/blob'
import { prisma } from '../lib/cockroachDB/prisma'

interface MigrationResult {
  projectName: string
  movedFiles: number
  updatedUrls: { old: string; new: string }[]
  errors: string[]
}

// Known project base names that need consolidation
const PROJECTS_TO_CONSOLIDATE = ['my-home-grava', 'my-home-akrida']

// Regex to match scattered folders (base-name followed by random suffix)
const SCATTERED_FOLDER_REGEX = /^projects\/([a-z0-9-]+)-[a-z0-9]{6,10}\//

async function listAllProjectFolders(): Promise<Map<string, string[]>> {
  console.log('📋 Listing all project folders...\n')

  const projectFolders = new Map<string, string[]>()

  let cursor: string | undefined
  do {
    const result = await list({ prefix: 'projects/', cursor })

    for (const blob of result.blobs) {
      // Extract the project folder name from the path
      // e.g., "projects/my-home-grava-3ggpkdb0/gallery/image.jpg" -> "my-home-grava-3ggpkdb0"
      const match = blob.pathname.match(/^projects\/([^/]+)\//)
      if (match) {
        const folderName = match[1]
        if (!projectFolders.has(folderName)) {
          projectFolders.set(folderName, [])
        }
        projectFolders.get(folderName)!.push(blob.pathname)
      }
    }

    cursor = result.cursor
  } while (cursor)

  return projectFolders
}

function getBaseProjectName(folderName: string): string | null {
  // Check if this is a scattered folder with random suffix
  for (const baseName of PROJECTS_TO_CONSOLIDATE) {
    // Match baseName followed by a random suffix (8 chars)
    const regex = new RegExp(`^${baseName}-[a-z0-9]{6,10}$`)
    if (regex.test(folderName)) {
      return baseName
    }
  }
  return null
}

async function migrateFile(
  oldPath: string,
  newPath: string,
  dryRun: boolean
): Promise<{ oldUrl: string; newUrl: string } | null> {
  if (dryRun) {
    console.log(`   [DRY RUN] Would move: ${oldPath} -> ${newPath}`)
    return null
  }

  try {
    // Get the blob URL first
    const listResult = await list({ prefix: oldPath })
    const blob = listResult.blobs.find(b => b.pathname === oldPath)

    if (!blob) {
      console.log(`   ⚠️ File not found: ${oldPath}`)
      return null
    }

    // Copy to new location
    const copyResult = await copy(blob.url, newPath, { access: 'public' })

    // Delete old file
    await del(blob.url)

    console.log(`   ✅ Moved: ${oldPath} -> ${newPath}`)

    return { oldUrl: blob.url, newUrl: copyResult.url }
  } catch (error) {
    console.error(`   ❌ Failed to move ${oldPath}:`, error)
    return null
  }
}

async function updateDatabaseUrls(
  urlMappings: { old: string; new: string }[],
  dryRun: boolean
): Promise<void> {
  if (urlMappings.length === 0) return

  console.log('\n📝 Updating database URLs...')

  for (const { old: oldUrl, new: newUrl } of urlMappings) {
    if (dryRun) {
      console.log(`   [DRY RUN] Would update DB: ${oldUrl} -> ${newUrl}`)
      continue
    }

    // Update all image URL fields in Project table
    const fields = [
      'bannerImageUrl',
      'thumbnailUrl',
      'floorplanImageUrls',
      'clubhouseImageUrls',
      'galleryImageUrls',
      'siteLayoutImageUrls',
      'imageUrls',
    ]

    // Find projects with this URL
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { bannerImageUrl: oldUrl },
          { thumbnailUrl: oldUrl },
          { floorplanImageUrls: { has: oldUrl } },
          { clubhouseImageUrls: { has: oldUrl } },
          { galleryImageUrls: { has: oldUrl } },
          { siteLayoutImageUrls: { has: oldUrl } },
          { imageUrls: { has: oldUrl } },
        ],
      },
    })

    for (const project of projects) {
      const updates: Record<string, unknown> = {}

      // Check and update single URL fields
      if (project.bannerImageUrl === oldUrl) {
        updates.bannerImageUrl = newUrl
      }
      if (project.thumbnailUrl === oldUrl) {
        updates.thumbnailUrl = newUrl
      }

      // Check and update array fields
      if (project.floorplanImageUrls?.includes(oldUrl)) {
        updates.floorplanImageUrls = project.floorplanImageUrls.map(u =>
          u === oldUrl ? newUrl : u
        )
      }
      if (project.clubhouseImageUrls?.includes(oldUrl)) {
        updates.clubhouseImageUrls = project.clubhouseImageUrls.map(u =>
          u === oldUrl ? newUrl : u
        )
      }
      if (project.galleryImageUrls?.includes(oldUrl)) {
        updates.galleryImageUrls = project.galleryImageUrls.map(u => (u === oldUrl ? newUrl : u))
      }
      if (project.siteLayoutImageUrls?.includes(oldUrl)) {
        updates.siteLayoutImageUrls = project.siteLayoutImageUrls.map(u =>
          u === oldUrl ? newUrl : u
        )
      }
      if (project.imageUrls?.includes(oldUrl)) {
        updates.imageUrls = project.imageUrls.map(u => (u === oldUrl ? newUrl : u))
      }

      if (Object.keys(updates).length > 0) {
        await prisma.project.update({
          where: { id: project.id },
          data: updates,
        })
        console.log(`   ✅ Updated project ${project.id}: ${Object.keys(updates).join(', ')}`)
      }
    }
  }
}

async function reorganizeProjectImages() {
  const dryRun = process.env.DRY_RUN === 'true'

  console.log('🔄 Starting project image reorganization...')
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n')
  }
  console.log('')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set')
    console.error(
      '   Run with: BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN_PROD npx tsx scripts/reorganize-project-images.ts'
    )
    process.exit(1)
  }

  const results: MigrationResult[] = []

  try {
    // List all project folders
    const projectFolders = await listAllProjectFolders()
    console.log(`Found ${projectFolders.size} project folders\n`)

    // Group scattered folders by base name
    const scatteredGroups = new Map<string, string[]>()

    for (const [folderName, files] of projectFolders) {
      const baseName = getBaseProjectName(folderName)
      if (baseName) {
        if (!scatteredGroups.has(baseName)) {
          scatteredGroups.set(baseName, [])
        }
        scatteredGroups.get(baseName)!.push(folderName)
        console.log(`   📁 Found scattered folder: ${folderName} (base: ${baseName})`)
      }
    }

    console.log(`\nFound ${scatteredGroups.size} projects with scattered folders\n`)

    // Process each project that needs consolidation
    for (const [baseName, scatteredFolders] of scatteredGroups) {
      console.log(`\n📦 Processing: ${baseName}`)
      console.log(`   Scattered folders: ${scatteredFolders.join(', ')}`)

      const result: MigrationResult = {
        projectName: baseName,
        movedFiles: 0,
        updatedUrls: [],
        errors: [],
      }

      // Move files from each scattered folder to the canonical folder
      for (const scatteredFolder of scatteredFolders) {
        const files = projectFolders.get(scatteredFolder) || []
        console.log(`\n   Moving ${files.length} files from ${scatteredFolder}...`)

        for (const oldPath of files) {
          // Transform path: projects/my-home-grava-abc123/gallery/img.jpg -> projects/my-home-grava/gallery/img.jpg
          const newPath = oldPath.replace(`projects/${scatteredFolder}/`, `projects/${baseName}/`)

          const migrationResult = await migrateFile(oldPath, newPath, dryRun)
          if (migrationResult) {
            result.movedFiles++
            result.updatedUrls.push({ old: migrationResult.oldUrl, new: migrationResult.newUrl })
          }
        }
      }

      // Update database URLs
      if (!dryRun && result.updatedUrls.length > 0) {
        await updateDatabaseUrls(result.updatedUrls, dryRun)
      }

      results.push(result)
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))

    let totalMoved = 0
    for (const result of results) {
      console.log(`\n${result.projectName}:`)
      console.log(`   Files moved: ${result.movedFiles}`)
      console.log(`   URLs updated: ${result.updatedUrls.length}`)
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.length}`)
      }
      totalMoved += result.movedFiles
    }

    console.log(`\n✅ Total files processed: ${totalMoved}`)

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.')
      console.log('   Remove DRY_RUN=true to execute the migration.')
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

reorganizeProjectImages()
