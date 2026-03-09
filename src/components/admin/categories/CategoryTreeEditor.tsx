'use client'

import type { Category } from '@/payload-types'

import { useDocumentInfo, useField, useFormFields, usePayloadAPI } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend'

import './CategoryTreeEditor.scss'

type CategoryDoc = Pick<Category, 'id' | 'parent' | 'title'>

type CategoryNode = {
  children: CategoryNode[]
  id: string
  parent: null | string
  title: string
}

type DragItem = {
  id: string
  type: string
}

type RelationshipValue = null | number | string | { id?: number | string | null } | undefined

type TreeRowProps = {
  currentID: null | string
  depth: number
  id: string
  invalidDrop: boolean
  isActiveDropTarget: boolean
  isCurrentParent: boolean
  moveLabel: string
  onMoveCurrent: (parentID: null | string) => void
  title: string
}

const baseClass = 'category-tree-editor'
const dragType = 'CATEGORY_TREE_NODE'

const getRelationshipID = (value: RelationshipValue): null | string => {
  if (!value) return null

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }

  if ('id' in value && value.id) {
    return String(value.id)
  }

  return null
}

const normalizeCategory = (category: CategoryDoc): CategoryNode => ({
  children: [],
  id: String(category.id),
  parent: getRelationshipID(category.parent),
  title: category.title || 'Untitled category',
})

const buildTree = (categories: CategoryDoc[]): CategoryNode[] => {
  const map = new Map<string, CategoryNode>()

  categories.forEach((category) => {
    const node = normalizeCategory(category)
    map.set(node.id, node)
  })

  const roots: CategoryNode[] = []

  map.forEach((node) => {
    if (!node.parent || !map.has(node.parent) || node.parent === node.id) {
      roots.push(node)
      return
    }

    map.get(node.parent)?.children.push(node)
  })

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title))
    nodes.forEach((node) => sortNodes(node.children))
  }

  sortNodes(roots)

  return roots
}

const flattenTree = (nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> => {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flattenTree(node.children, depth + 1)])
}

const findDescendantIDs = (nodes: CategoryNode[], targetID: string): Set<string> => {
  const descendants = new Set<string>()

  const collect = (node: CategoryNode) => {
    node.children.forEach((child) => {
      descendants.add(child.id)
      collect(child)
    })
  }

  const visit = (node: CategoryNode): boolean => {
    if (node.id === targetID) {
      collect(node)
      return true
    }

    return node.children.some(visit)
  }

  nodes.some(visit)

  return descendants
}

const reparentCategory = (
  categories: CategoryDoc[],
  currentID: string,
  nextParentID: null | string,
): CategoryDoc[] => {
  return categories.map((category) => {
    if (String(category.id) !== currentID) return category

    return {
      ...category,
      parent: nextParentID,
    }
  })
}

const TreeRow = ({
  currentID,
  depth,
  id,
  invalidDrop,
  isActiveDropTarget,
  isCurrentParent,
  moveLabel,
  onMoveCurrent,
  title,
}: TreeRowProps) => {
  const ref = useRef<HTMLButtonElement | null>(null)
  const isCurrent = currentID === id

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      canDrag: isCurrent,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: { id, type: dragType },
      type: dragType,
    }),
    [id, isCurrent],
  )

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: dragType,
      canDrop: (item: DragItem) => item.id === currentID && !invalidDrop && item.id !== id,
      collect: (monitor) => ({
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver({ shallow: true }),
      }),
      drop: (item: DragItem) => {
        if (item.id !== currentID || invalidDrop || item.id === id) return
        onMoveCurrent(id)
      },
    }),
    [currentID, id, invalidDrop, onMoveCurrent],
  )

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  drag(drop(ref))

  return (
    <div
      className={[
        `${baseClass}__row`,
        isCurrent ? `${baseClass}__row--current` : '',
        isDragging ? `${baseClass}__row--dragging` : '',
        invalidDrop ? `${baseClass}__row--invalid` : '',
        isOver && canDrop ? `${baseClass}__row--drop-target` : '',
        isActiveDropTarget ? `${baseClass}__row--active-target` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        ref={ref}
        type="button"
        className={`${baseClass}__card`}
        style={{ marginLeft: `${depth * 20}px` }}
        onClick={() => onMoveCurrent(id)}
        disabled={invalidDrop || isCurrent}
        title={moveLabel}
      >
        <span className={`${baseClass}__drag-handle`} aria-hidden="true">
          ::
        </span>
        <span className={`${baseClass}__title`}>{title}</span>
        {isCurrent ? <span className={`${baseClass}__badge`}>Current</span> : null}
        {isCurrentParent ? <span className={`${baseClass}__hint`}>Parent</span> : null}
      </button>
    </div>
  )
}

const RootDropZone = ({
  canDrop,
  dropRef,
  isOver,
  onDropRoot,
}: {
  canDrop: boolean
  dropRef: (element: HTMLButtonElement | null) => void
  isOver: boolean
  onDropRoot: () => void
}) => {
  return (
    <button
      ref={dropRef}
      type="button"
      className={[
        `${baseClass}__root-button`,
        isOver && canDrop ? `${baseClass}__root-button--active` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onDropRoot}
    >
      Move current category to root
    </button>
  )
}

export const CategoryTreeEditor: UIFieldClientComponent = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <CategoryTreeEditorContent />
    </DndProvider>
  )
}

const CategoryTreeEditorContent = () => {
  const { id } = useDocumentInfo()
  const currentID = id ? String(id) : null
  const { setValue, value } = useField<null | string>({ path: 'parent' })
  const titleField = useFormFields(([fields]) => fields.title)
  const currentTitle =
    typeof titleField?.value === 'string' ? titleField.value : 'Untitled category'
  const [{ data, isError, isLoading }] = usePayloadAPI(
    '/api/categories?depth=0&limit=200&sort=title',
  )
  const [categories, setCategories] = useState<CategoryDoc[]>([])

  useEffect(() => {
    const docs = Array.isArray(data?.docs) ? (data.docs as CategoryDoc[]) : []
    const next = [...docs]

    if (currentID) {
      const existing = next.find((doc) => String(doc.id) === currentID)

      if (existing) {
        existing.title = currentTitle
        existing.parent = getRelationshipID(value)
      } else {
        next.push({
          id: currentID,
          parent: getRelationshipID(value),
          title: currentTitle,
        })
      }
    }

    setCategories(next)
  }, [currentID, currentTitle, data, value])

  const tree = useMemo(() => buildTree(categories), [categories])
  const descendants = useMemo(
    () => (currentID ? findDescendantIDs(tree, currentID) : new Set<string>()),
    [currentID, tree],
  )
  const flattened = useMemo(() => flattenTree(tree), [tree])
  const currentParentID = getRelationshipID(value)

  const moveCurrent = (nextParentID: null | string) => {
    if (!currentID) return
    if (nextParentID === currentID) return
    if (nextParentID && descendants.has(nextParentID)) return

    setValue(nextParentID)
    setCategories((prev) => reparentCategory(prev, currentID, nextParentID))
  }

  const [{ isOverRoot, canDropRoot }, rootDrop] = useDrop(
    () => ({
      accept: dragType,
      canDrop: (item: DragItem) => item.id === currentID && currentParentID !== null,
      collect: (monitor) => ({
        canDropRoot: monitor.canDrop(),
        isOverRoot: monitor.isOver({ shallow: true }),
      }),
      drop: (item: DragItem) => {
        if (item.id === currentID) moveCurrent(null)
      },
    }),
    [currentID, currentParentID],
  )

  if (isLoading) {
    return <div className={baseClass}>Loading category tree...</div>
  }

  if (isError) {
    return <div className={baseClass}>Unable to load the category tree right now.</div>
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <div>
          <h3>Category tree</h3>
          <p>Drag the highlighted category onto another category card to make it its child.</p>
        </div>
        <RootDropZone
          canDrop={canDropRoot}
          dropRef={rootDrop}
          isOver={isOverRoot}
          onDropRoot={() => moveCurrent(null)}
        />
      </div>

      <div className={`${baseClass}__tree`}>
        {flattened.map((node) => {
          const invalidDrop =
            Boolean(currentID) && (node.id === currentID || descendants.has(node.id))

          return (
            <TreeRow
              key={node.id}
              currentID={currentID}
              depth={node.depth}
              id={node.id}
              invalidDrop={invalidDrop}
              isActiveDropTarget={currentParentID === node.id}
              isCurrentParent={currentParentID === node.id}
              moveLabel={
                currentID === node.id
                  ? 'Current category'
                  : `Move current category under ${node.title}`
              }
              onMoveCurrent={moveCurrent}
              title={node.title}
            />
          )
        })}
      </div>
    </div>
  )
}

export default CategoryTreeEditor
