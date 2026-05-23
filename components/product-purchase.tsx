"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useCart, type CartProductInput } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"

const SIZES = ["XS", "S", "M", "L", "XL"]

export function ProductPurchase({ product }: { product: CartProductInput }) {
  const { addItem } = useCart()
  const [size, setSize] = React.useState<string | null>(null)
  const [quantity, setQuantity] = React.useState(1)
  const [error, setError] = React.useState(false)

  function addToBag() {
    if (!size) {
      setError(true)
      toast.error("Please select a size")
      return
    }
    addItem(product, { size, quantity })
    toast.success(`${product.name} added to your bag`)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium uppercase tracking-wide">
            Size
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Size guide
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSize(s)
                setError(false)
              }}
              className={cn(
                "flex h-11 min-w-11 items-center justify-center border px-3 text-sm transition-colors",
                size === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-input hover:border-foreground",
                error && "border-destructive"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {error ? (
          <p className="mt-2 text-xs text-destructive">
            Select a size to continue.
          </p>
        ) : null}
      </div>

      <div>
        <span className="text-sm font-medium uppercase tracking-wide">
          Quantity
        </span>
        <div className="mt-3 inline-flex items-center border">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-11 items-center justify-center transition-colors hover:bg-muted"
          >
            <MinusIcon className="size-4" />
          </button>
          <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex size-11 items-center justify-center transition-colors hover:bg-muted"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={addToBag}>
        Add to bag
      </Button>
    </div>
  )
}
