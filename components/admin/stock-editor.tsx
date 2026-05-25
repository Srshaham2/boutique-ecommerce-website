"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setVariantStock } from "@/app/admin/(panel)/products/actions"
import { cn } from "@/lib/utils"
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Inline editor for one product variant's stock. `label` is the size, if any. */
export function StockEditor({
  variantId,
  value,
  label,
}: {
  variantId: string
  value: number
  label?: string | null
}) {
  const router = useRouter()
  const [qty, setQty] = useState(String(value))
  const [pending, startTransition] = useTransition()
  const dirty = qty.trim() !== String(value)

  function save() {
    const n = Number(qty)
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Enter 0 or more.")
      return
    }
    startTransition(async () => {
      const res = await setVariantStock(variantId, n)
      if (res.ok) {
        toast.success(label ? `Size ${label} updated.` : "Stock updated.")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {label ? (
        <span
          className={cn(
            "w-9 text-right text-xs font-medium tabular-nums",
            value === 0 && "text-destructive",
            value > 0 && value <= LOW_STOCK_THRESHOLD && "text-amber-700"
          )}
        >
          {label}
        </span>
      ) : null}
      <Input
        type="number"
        min="0"
        step="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="h-8 w-16 text-right"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={pending || !dirty}
        onClick={save}
      >
        Save
      </Button>
    </div>
  )
}
