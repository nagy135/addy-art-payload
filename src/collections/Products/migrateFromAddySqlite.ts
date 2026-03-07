import config from '@payload-config'
import type { Product } from '@/payload-types'
import 'dotenv/config'
import { getPayload } from 'payload'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

type SourceProduct = {
  id: number
  slug: string
  title: string
  description_md: string
  price_cents: number
  image_path: string
  category_id: number | null
  sort_order: number
  is_recreatable: 0 | 1
}

type SourceProductImage = {
  id: number
  product_id: number
  image_path: string
  is_thumbnail: 0 | 1
}

type SourceProductCategory = {
  product_id: number
  category_id: number
}

type SourceCategory = {
  id: number
  title: string
  slug: string
  parent_id: number | null
}

type UploadFile = {
  name: string
  data: Buffer
  mimetype: string
  size: number
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '../../..')

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

function markdownToLexical(markdown: string): NonNullable<Product['description']> {
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

export async function migrateProductsFromAddySqlite(options?: {
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

  const sourceProducts = querySqlite<SourceProduct>(
    sourceDbPath,
    'SELECT id, slug, title, description_md, price_cents, image_path, category_id, sort_order, is_recreatable FROM products ORDER BY sort_order ASC, id ASC;',
  )
  const sourceImages = querySqlite<SourceProductImage>(
    sourceDbPath,
    'SELECT id, product_id, image_path, is_thumbnail FROM product_images ORDER BY product_id ASC, is_thumbnail DESC, id ASC;',
  )
  const sourceProductCategories = querySqlite<SourceProductCategory>(
    sourceDbPath,
    'SELECT product_id, category_id FROM product_categories;',
  )
  const sourceCategories = querySqlite<SourceCategory>(
    sourceDbPath,
    'SELECT id, title, slug, parent_id FROM categories ORDER BY id ASC;',
  )

  const payloadCategoryIdBySourceId = new Map<number, string>()

  const categoriesBySlug = new Map<string, string>()
  const existingCategories = await payload.find({ collection: 'categories', depth: 0, limit: 1000 })
  for (const category of existingCategories.docs) {
    categoriesBySlug.set(category.slug, category.id)
  }

  const pendingCategories = new Map(sourceCategories.map((category) => [category.id, category]))
  let lastPendingCount = pendingCategories.size + 1

  while (pendingCategories.size > 0) {
    if (pendingCategories.size === lastPendingCount) {
      throw new Error('Could not resolve parent category dependencies while migrating categories.')
    }

    lastPendingCount = pendingCategories.size

    for (const [sourceId, category] of pendingCategories) {
      const existingId = categoriesBySlug.get(category.slug)
      if (existingId) {
        payloadCategoryIdBySourceId.set(sourceId, existingId)
        pendingCategories.delete(sourceId)
        continue
      }

      let parent: string | undefined
      if (category.parent_id) {
        parent = payloadCategoryIdBySourceId.get(category.parent_id)
        if (!parent) continue
      }

      const created = await payload.create({
        collection: 'categories',
        depth: 0,
        data: {
          title: category.title,
          slug: category.slug,
          ...(parent ? { parent } : {}),
        },
      })

      categoriesBySlug.set(created.slug, created.id)
      payloadCategoryIdBySourceId.set(sourceId, created.id)
      pendingCategories.delete(sourceId)
    }
  }

  const imagesByProductId = new Map<number, SourceProductImage[]>()
  for (const image of sourceImages) {
    const existing = imagesByProductId.get(image.product_id) || []
    existing.push(image)
    imagesByProductId.set(image.product_id, existing)
  }

  const categoryIdsByProductId = new Map<number, Set<number>>()
  for (const relation of sourceProductCategories) {
    const set = categoryIdsByProductId.get(relation.product_id) || new Set<number>()
    set.add(relation.category_id)
    categoryIdsByProductId.set(relation.product_id, set)
  }

  const migratedMediaBySourcePath = new Map<string, string>()

  const ensureMedia = async (imagePath: string, title: string): Promise<string | null> => {
    const cached = migratedMediaBySourcePath.get(imagePath)
    if (cached) return cached

    const fileName = path.basename(imagePath)

    const existingMedia = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      where: {
        filename: {
          equals: fileName,
        },
      },
    })

    if (existingMedia.docs[0]) {
      migratedMediaBySourcePath.set(imagePath, existingMedia.docs[0].id)
      return existingMedia.docs[0].id
    }

    const absolutePath = resolveSourceImagePath(imagePath, sourceRoots)
    if (!absolutePath) {
      payload.logger.warn(`Skipping missing source file for image path: ${imagePath}`)
      return null
    }

    const uploaded = await payload.create({
      collection: 'media',
      depth: 0,
      data: {
        alt: title,
      },
      file: await createUploadFile(absolutePath),
    })

    migratedMediaBySourcePath.set(imagePath, uploaded.id)
    return uploaded.id
  }

  let createdProducts = 0
  let updatedProducts = 0
  let skippedProducts = 0

  for (const sourceProduct of sourceProducts) {
    const rawImagePaths = [
      sourceProduct.image_path,
      ...(imagesByProductId.get(sourceProduct.id)?.map((image) => image.image_path) || []),
    ]

    const uniqueImagePaths = [...new Set(rawImagePaths.filter(Boolean))]
    const gallery = [] as { image: string }[]

    for (const imagePath of uniqueImagePaths) {
      const mediaId = await ensureMedia(imagePath, sourceProduct.title)
      if (mediaId) {
        gallery.push({ image: mediaId })
      }
    }

    if (gallery.length === 0) {
      skippedProducts += 1
      payload.logger.warn(
        `Skipping product '${sourceProduct.slug}' because no gallery image could be migrated.`,
      )
      continue
    }

    const sourceCategoryIds = categoryIdsByProductId.get(sourceProduct.id) || new Set<number>()
    if (sourceProduct.category_id) sourceCategoryIds.add(sourceProduct.category_id)

    const categoryIds = [...sourceCategoryIds]
      .map((sourceCategoryId) => payloadCategoryIdBySourceId.get(sourceCategoryId))
      .filter((id): id is string => Boolean(id))

    const productData = {
      title: sourceProduct.title,
      slug: sourceProduct.slug,
      description: markdownToLexical(sourceProduct.description_md),
      gallery,
      categories: categoryIds,
      priceInUSDEnabled: true,
      priceInUSD: sourceProduct.price_cents,
      inventory: sourceProduct.is_recreatable ? 99 : 1,
      _status: 'published' as const,
    }

    const existingProduct = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      where: {
        slug: {
          equals: sourceProduct.slug,
        },
      },
    })

    if (existingProduct.docs[0]) {
      await payload.update({
        collection: 'products',
        id: existingProduct.docs[0].id,
        depth: 0,
        data: productData,
      })
      updatedProducts += 1
    } else {
      await payload.create({
        collection: 'products',
        depth: 0,
        data: productData,
      })
      createdProducts += 1
    }
  }

  payload.logger.info(
    `Product migration finished. Created: ${createdProducts}, Updated: ${updatedProducts}, Skipped: ${skippedProducts}`,
  )

  return {
    createdProducts,
    updatedProducts,
    skippedProducts,
    totalProducts: sourceProducts.length,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  migrateProductsFromAddySqlite()
    .then((result) => {
      console.log(result)
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
