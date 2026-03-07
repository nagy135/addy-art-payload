import config from '@payload-config'
import type { Post } from '@/payload-types'
import 'dotenv/config'
import { getPayload } from 'payload'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

type SourcePost = {
  id: number
  slug: string
  title: string
  content_md: string
  image_path: string | null
  published_at: number | null
  author_id: string
  created_at: number
}

type SourcePostImage = {
  id: number
  post_id: number
  image_path: string
  is_thumbnail: 0 | 1
}

type UploadFile = {
  name: string
  data: Buffer
  mimetype: string
  size: number
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '../..')

const defaultSourceDbPath = path.resolve(projectRoot, 'addy.sqlite')
const defaultSourcePublicPath = path.resolve(projectRoot, 'public')

function querySqlite<T>(dbPath: string, sql: string): T[] {
  const raw = execFileSync('sqlite3', ['-json', dbPath, sql], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  }).trim()

  if (!raw) return []

  return JSON.parse(raw) as T[]
}

function markdownToLexical(markdown: string): NonNullable<Post['caption']> {
  const paragraphs = markdown
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const cleaned = paragraph
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')

      return {
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            version: 1,
            text: cleaned,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
      }
    })

  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr' as const,
      children:
        paragraphs.length > 0
          ? paragraphs
          : [
              {
                type: 'paragraph',
                version: 1,
                format: '',
                indent: 0,
                direction: 'ltr' as const,
                textFormat: 0,
                textStyle: '',
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: '',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
            ],
    },
  }
}

function getImageMimeType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase()

  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.gif') return 'image/gif'

  return 'application/octet-stream'
}

async function createUploadFile(absolutePath: string): Promise<UploadFile> {
  const data = await fs.readFile(absolutePath)
  const name = path.basename(absolutePath)

  return {
    name,
    data,
    size: data.byteLength,
    mimetype: getImageMimeType(name),
  }
}

function resolveSourceImagePath(imagePath: string, sourceRoots: string[]): string | null {
  const normalized = imagePath.replace(/^\//, '')
  const baseName = path.basename(normalized)

  const candidatePaths = sourceRoots.flatMap((root) => {
    const candidates = [path.resolve(root, normalized), path.resolve(root, baseName)]

    if (normalized.startsWith('uploads/')) {
      candidates.push(path.resolve(root, normalized.replace(/^uploads\//, 'upload/')))
    }

    if (normalized.startsWith('upload/')) {
      candidates.push(path.resolve(root, normalized.replace(/^upload\//, 'uploads/')))
    }

    return candidates
  })

  for (const candidate of candidatePaths) {
    if (existsSync(candidate)) return candidate
  }

  return null
}

export async function migratePostsFromAddySqlite(options?: {
  sourceDbPath?: string
  sourcePublicPath?: string
}) {
  const sourceDbPath =
    options?.sourceDbPath || process.env.ADDY_SOURCE_DB_PATH || defaultSourceDbPath
  const sourcePublicPath =
    options?.sourcePublicPath || process.env.ADDY_SOURCE_PUBLIC_PATH || defaultSourcePublicPath

  if (!existsSync(sourceDbPath)) {
    throw new Error(`Source database not found: ${sourceDbPath}`)
  }

  const sourceRoots = [
    sourcePublicPath,
    path.resolve(projectRoot, 'public'),
    path.resolve(projectRoot, 'public/upload'),
    path.resolve(projectRoot, 'public/uploads'),
  ].filter((root, index, all) => all.indexOf(root) === index && existsSync(root))

  if (sourceRoots.length === 0) {
    throw new Error(
      `No readable source public directory found. Checked: ${sourcePublicPath}, ${path.resolve(projectRoot, 'public')}, ${path.resolve(projectRoot, 'public/upload')}, ${path.resolve(projectRoot, 'public/uploads')}`,
    )
  }

  const payload = await getPayload({ config })

  const sourcePosts = querySqlite<SourcePost>(
    sourceDbPath,
    'SELECT id, slug, title, content_md, image_path, published_at, author_id, created_at FROM posts ORDER BY COALESCE(published_at, created_at) ASC, id ASC;',
  )
  const sourcePostImages = querySqlite<SourcePostImage>(
    sourceDbPath,
    'SELECT id, post_id, image_path, is_thumbnail FROM post_images ORDER BY post_id ASC, is_thumbnail DESC, id ASC;',
  )

  const imagesByPostId = new Map<number, SourcePostImage[]>()
  for (const image of sourcePostImages) {
    const existing = imagesByPostId.get(image.post_id) || []
    existing.push(image)
    imagesByPostId.set(image.post_id, existing)
  }

  let createdPosts = 0
  let updatedPosts = 0
  let skippedPosts = 0

  for (const sourcePost of sourcePosts) {
    const rawImagePaths = [
      sourcePost.image_path,
      ...(imagesByPostId.get(sourcePost.id)?.map((image) => image.image_path) || []),
    ].filter((imagePath): imagePath is string => Boolean(imagePath))

    const uniqueImagePaths = [...new Set(rawImagePaths)]

    let selectedImagePath: string | null = null
    let selectedAbsolutePath: string | null = null

    for (const imagePath of uniqueImagePaths) {
      const absolutePath = resolveSourceImagePath(imagePath, sourceRoots)
      if (absolutePath) {
        selectedImagePath = imagePath
        selectedAbsolutePath = absolutePath
        break
      }
    }

    if (!selectedAbsolutePath || !selectedImagePath) {
      skippedPosts += 1
      payload.logger.warn(`Skipping post '${sourcePost.slug}' because no image could be migrated.`)
      continue
    }

    const selectedFileName = path.basename(selectedImagePath)

    const existingPost = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1,
      where: {
        and: [
          {
            title: {
              equals: sourcePost.title,
            },
          },
          {
            filename: {
              equals: selectedFileName,
            },
          },
        ],
      },
    })

    const postData = {
      title: sourcePost.title,
      alt: sourcePost.title,
      caption: markdownToLexical(sourcePost.content_md),
    }

    if (existingPost.docs[0]) {
      await payload.update({
        collection: 'posts',
        id: existingPost.docs[0].id,
        depth: 0,
        data: postData,
      })
      updatedPosts += 1
    } else {
      await payload.create({
        collection: 'posts',
        depth: 0,
        data: postData,
        file: await createUploadFile(selectedAbsolutePath),
      })
      createdPosts += 1
    }
  }

  payload.logger.info(
    `Post migration finished. Created: ${createdPosts}, Updated: ${updatedPosts}, Skipped: ${skippedPosts}`,
  )

  return {
    createdPosts,
    updatedPosts,
    skippedPosts,
    totalPosts: sourcePosts.length,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  migratePostsFromAddySqlite()
    .then((result) => {
      console.log(result)
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
