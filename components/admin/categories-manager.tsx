"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createCategory,
  deleteCategory,
  reorderCategory,
  setCategorySizeType,
  updateCategory,
} from "@/app/admin/(panel)/categories/actions"
import type { AdminCategory } from "@/lib/admin/queries"
import { SIZE_TYPES, SIZE_TYPE_LABELS, type SizeType } from "@/lib/sizes"
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
        {categories.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        )}
        {categories.map((c, i) => (
          <CategoryRow
            key={c.id}
            category={c}
            isFirst={i === 0}
            isLast={i === categories.length - 1}
            disabled={pending}
            onRename={(name) =>
              run(() => updateCategory(c.id, name), "Category renamed.")
            }
            onMove={(dir) =>
              run(() => reorderCategory(c.id, dir), "Order updated.")
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
  isFirst,
  isLast,
  disabled,
  onRename,
  onMove,
  onSizeType,
  onDelete,
}: {
  category: AdminCategory
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onRename: (name: string) => void
  onMove: (dir: "up" | "down") => void
  onSizeType: (sizeType: SizeType) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(category.name)
  const dirty = name.trim() !== category.name

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex flex-col">
        <button
          type="button"
          aria-label="Move up"
          disabled={disabled || isFirst}
          onClick={() => onMove("up")}
          className="text-muted-foreground disabled:opacity-30 hover:text-foreground"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={disabled || isLast}
          onClick={() => onMove("down")}
          className="text-muted-foreground disabled:opacity-30 hover:text-foreground"
        >
          <ArrowDown className="size-4" />
        </button>
      </div>

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
