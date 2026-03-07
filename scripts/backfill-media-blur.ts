import { readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { uploadsDir } from '../src/utilities/uploadsDir'

type MediaDoc = {
  id: string
  filename?: string | null
  blurDataURL?: string | null
}

const createBlurDataURL = async (filePath: string) => {
  const fileBuffer = await readFile(filePath)

  const blurBuffer = await sharp(fileBuffer)
    .rotate()
    .resize(24, 24, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .blur(4)
    .webp({
      quality: 50,
    })
    .toBuffer()

  return `data:image/webp;base64,${blurBuffer.toString('base64')}`
}

const run = async () => {
  const payload = await getPayload({ config })

  let page = 1
  let processed = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  while (true) {
    const result = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 100,
      page,
      pagination: true,
      sort: 'createdAt',
    })

    for (const doc of result.docs as MediaDoc[]) {
      processed += 1

      if (!doc.filename) {
        skipped += 1
        payload.logger.warn(`Skipping media ${doc.id}: missing filename`)
        continue
      }

      const filePath = path.join(uploadsDir, doc.filename)

      try {
        const blurDataURL = await createBlurDataURL(filePath)

        if (doc.blurDataURL === blurDataURL) {
          skipped += 1
          continue
        }

        await payload.update({
          collection: 'media',
          id: doc.id,
          data: {
            blurDataURL,
          },
        })

        updated += 1
        payload.logger.info(`Updated blurDataURL for media ${doc.id} (${doc.filename})`)
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : String(error)
        payload.logger.error(`Failed media ${doc.id} (${doc.filename}): ${message}`)
      }
    }

    if (page >= result.totalPages) {
      break
    }

    page += 1
  }

  payload.logger.info(
    `Backfill complete. processed=${processed} updated=${updated} skipped=${skipped} failed=${failed}`,
  )
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    const message = error instanceof Error ? error.stack || error.message : String(error)
    console.error(message)
    process.exit(1)
  })
