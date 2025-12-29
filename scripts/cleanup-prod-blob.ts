/**
 * Cleanup Script: Remove hyderabad-projects folder from Prod Blob Storage
 *
 * This script:
 * 1. Lists all files in the hyderabad-projects/ folder in prod blob
 * 2. Deletes each file
 *
 * Usage:
 *   source .env.local && BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN_PROD npx tsx scripts/cleanup-prod-blob.ts
 *
 * Environment Variables Required:
 *   - BLOB_READ_WRITE_TOKEN: Prod Vercel Blob token (passed via command line)
 */

/* eslint-disable no-console */

import { list, del } from '@vercel/blob'

async function cleanupProdBlob() {
  console.log('🧹 Starting prod blob cleanup...\n')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set')
    console.error(
      '   Run with: BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN_PROD npx tsx scripts/cleanup-prod-blob.ts'
    )
    process.exit(1)
  }

  try {
    // List all blobs with prefix 'hyderabad-projects/'
    console.log('📋 Listing files in hyderabad-projects/...')

    let cursor: string | undefined
    let totalDeleted = 0

    do {
      const result = await list({
        prefix: 'hyderabad-projects/',
        cursor,
      })

      console.log(`Found ${result.blobs.length} files in this batch`)

      for (const blob of result.blobs) {
        console.log(`   🗑️ Deleting: ${blob.pathname}`)
        await del(blob.url)
        totalDeleted++
      }

      cursor = result.cursor
    } while (cursor)

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} files.`)
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

cleanupProdBlob()
