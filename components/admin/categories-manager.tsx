"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createCategory,
  deleteCategory,
  reorderCategories,
  setCategorySizeType,
  updateCategory,
} from "@/app/admin/(panel)/categories/actions"
import type { AdminCategory } from "@/lib/admin/queries"
import { SIZE_TYPES, SIZE_TYPE_LABELS, type SizeType } from "@/lib/sizes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Res = { ok: true } | { ok: false; error: string }

export function CategoriesManager({
  categories,
}: {
  categories: AdminCategory[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [newName, setNewName] = useState("")
  const [newSizeType, setNewSizeType] = useState<SizeType>("none")

  // Local order so drags feel instant. Resync when the server list changes
  // (new reference after router.refresh) by adjusting state during render —
  // see https://react.dev/learn/you-might-not-need-an-effect.
  const [items, setItems] = useState(categories)
  const [syncedFrom, setSyncedFrom] = useState(categories)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const orderAtDragStart = useRef<string[]>([])
  if (syncedFrom !== categories) {
    setSyncedFrom(categories)
    setItems(categories)
  }

  function run(action: () => Promise<Res>, success: string) {
    startTransition(async () => {
      const res = await action()
      if (res.ok) {
        toast.success(success)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    run(() => createCategory(newName, newSizeType), "Category added.")
    setNewName("")
    setNewSizeType("none")
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
    orderAtDragStart.current = items.map((c) => c.id)
  }

  // Live-reorder the list as the dragged row passes over its neighbours.
  function handleDragOver(index: number) {
    if (dragIndex === null || dragIndex === index) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  function handleDragEnd() {
    setDragIndex(null)
    const before = orderAtDragStart.current
    const after = items.map((c) => c.id)
    if (after.length !== before.length || after.some((id, i) => id !== before[i])) {
      run(() => reorderCategories(after), "Order updated.")
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex max-w-2xl flex-wrap gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="min-w-48 flex-1"
        />
        <Select
          value={newSizeType}
          onValueChange={(v) => setNewSizeType(v as SizeType)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIZE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {SIZE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending} className="gap-2">
          <Plus className="size-4" /> Add
        </Button>
      </form>

      <div className="divide-y rounded-lg border">
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        )}
        {items.map((c, i) => (
          <CategoryRow
            key={c.id}
            category={c}
            index={i}
            isDragging={dragIndex === i}
            disabled={pending}
            onDragStart={() => handleDragStart(i)}
            onDragOver={() => handleDragOver(i)}
            onDragEnd={handleDragEnd}
            onRename={(name) =>
              run(() => updateCategory(c.id, name), "Category renamed.")
            }
            onSizeType={(t) =>
              run(() => setCategorySizeType(c.id, t), "Size type updated.")
            }
            onDelete={() => {
              if (!window.confirm(`Delete "${c.name}"?`)) return
              run(() => deleteCategory(c.id), "Category deleted.")
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryRow({
  category,
  index,
  isDragging,
  disabled,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRename,
  onSizeType,
  onDelete,
}: {
  category: AdminCategory
  index: number
  isDragging: boolean
  disabled: boolean
  onDragStart: () => void
  onDragOver: () => void
  onDragEnd: () => void
  onRename: (name: string) => void
  onSizeType: (sizeType: SizeType) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(category.name)
  // Only allow the row to drag when the grip handle is grabbed, so the text
  // input and select stay interactive.
  const [grabbed, setGrabbed] = useState(false)
  const dirty = name.trim() !== category.name

  return (
    <div
      draggable={grabbed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDragEnd={() => {
        setGrabbed(false)
        onDragEnd()
      }}
      data-index={index}
      className={cn(
        "flex flex-wrap items-center gap-3 bg-background px-4 py-3 transition-shadow",
        isDragging && "opacity-60 shadow-lg"
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        disabled={disabled}
        onMouseDown={() => setGrabbed(true)}
        onMouseUp={() => setGrabbed(false)}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:opacity-30"
      >
        <GripVertical className="size-5" />
      </button>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="max-w-xs"
      />

      <Select
        value={category.size_type}
        onValueChange={(v) => onSizeType(v as SizeType)}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIZE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {SIZE_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground">
        {category.product_count} product
        {category.product_count === 1 ? "" : "s"} · /{category.slug}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {dirty && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onRename(name)}
          >
            Save
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete category"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
