/**
 * Migration Script: Copy Builder Images from Dev to Prod Blob Storage
 *
 * This script:
 * 1. Connects to prod CockroachDB
 * 2. Finds all builders with dev blob URLs
 * 3. Downloads each image from dev blob
 * 4. Uploads to prod blob storage
 * 5. Updates the database with prod blob URL
 *
 * Usage:
 *   source .env.local && BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN_PROD npx tsx scripts/migrate-builder-images.ts
 *
 * Environment Variables Required:
 *   - DATABASE_URL_PROD: Prod CockroachDB connection string (from .env.local)
 *   - BLOB_READ_WRITE_TOKEN_PROD: Prod Vercel Blob token (from .env.local)
 */

/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

// Dev and Prod blob domains
const DEV_BLOB_DOMAIN = 'jeczfxlhtp0pv0xq.public.blob.vercel-storage.com'
const PROD_BLOB_DOMAIN = 'xnjwil0hstrlcmbv.public.blob.vercel-storage.com'

// Initialize Prisma with prod database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PROD,
    },
  },
})

async function migrateBuilderImages() {
  console.log('🚀 Starting builder image migration...\n')

  // Check for required env vars
  if (!process.env.DATABASE_URL_PROD) {
    console.error('❌ DATABASE_URL_PROD is not set')
    process.exit(1)
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set')
    console.error(
      '   Run with: BLOB_READ_WRITE_TOKEN="your_token" npx tsx scripts/migrate-builder-images.ts'
    )
    process.exit(1)
  }

  try {
    // Find all builders with dev blob URLs
    const builders = await prisma.builder.findMany({
      where: {
        logoUrl: {
          contains: DEV_BLOB_DOMAIN,
        },
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    })

    console.log(`📋 Found ${builders.length} builders with dev blob URLs\n`)

    if (builders.length === 0) {
      console.log(
        '✅ No migration needed - all builder images are already on prod blob or have no images'
      )
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const builder of builders) {
      console.log(`\n📦 Processing: ${builder.name} (${builder.id})`)
      console.log(`   Old URL: ${builder.logoUrl}`)

      if (!builder.logoUrl) {
        console.log('   ⏭️ Skipping - no logo URL')
        continue
      }

      try {
        // Extract the path from the dev URL (e.g., "builders/my-home-123.png")
        const urlPath = builder.logoUrl.replace(`https://${DEV_BLOB_DOMAIN}/`, '')

        // Download the image from dev blob
        console.log('   ⬇️ Downloading from dev blob...')
        const response = await fetch(builder.logoUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type') || 'image/png'
        const imageBuffer = Buffer.from(await response.arrayBuffer())

        // Upload to prod blob with the same path
        console.log('   ⬆️ Uploading to prod blob...')
        const blob = await put(urlPath, imageBuffer, {
          access: 'public',
          contentType,
        })

        const newUrl = blob.url
        console.log(`   New URL: ${newUrl}`)

        // Verify the new URL uses prod domain
        if (!newUrl.includes(PROD_BLOB_DOMAIN)) {
          console.log(`   ⚠️ Warning: New URL doesn't use prod domain. Got: ${newUrl}`)
        }

        // Update the database
        console.log('   💾 Updating database...')
        await prisma.builder.update({
          where: { id: builder.id },
          data: { logoUrl: newUrl },
        })

        console.log('   ✅ Success!')
        successCount++
      } catch (error) {
        console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`\n🎉 Migration complete!`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📊 Total: ${builders.length}`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateBuilderImages()
