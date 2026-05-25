"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { Variant } from "@/lib/products"
import { useCart, type CartProductInput } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"

export function ProductPurchase({
  product,
  variants,
}: {
  product: CartProductInput
  variants: Variant[]
}) {
  const { addItem } = useCart()

  // A product is "one size" when its only variant has no size. Otherwise the
  // shopper must pick a size, and sold-out sizes are shown disabled.
  const sizedVariants = variants.filter((v) => v.size != null)
  const isOneSize = sizedVariants.length === 0
  const oneSizeVariant = variants.find((v) => v.size == null) ?? null
  const allSoldOut = isOneSize
    ? (oneSizeVariant?.stock_quantity ?? 0) <= 0
    : sizedVariants.every((v) => v.stock_quantity <= 0)

  const [size, setSize] = React.useState<string | null>(null)
  const [quantity, setQuantity] = React.useState(1)
  const [error, setError] = React.useState(false)

  function addToBag() {
    if (allSoldOut) return
    if (!isOneSize && !size) {
      setError(true)
      toast.error("Please select a size")
      return
    }
    addItem(product, { size: isOneSize ? null : size, quantity })
    toast.success(`${product.name} added to your bag`)
  }

  return (
    <div className="space-y-6">
      {!isOneSize ? (
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
            {sizedVariants.map((v) => {
              const soldOut = v.stock_quantity <= 0
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setSize(v.size)
                    setError(false)
                  }}
                  className={cn(
                    "flex h-11 min-w-11 items-center justify-center border px-3 text-sm transition-colors",
                    size === v.size
                      ? "border-foreground bg-foreground text-background"
                      : "border-input hover:border-foreground",
                    soldOut &&
                      "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-input",
                    error && "border-destructive"
                  )}
                >
                  {v.size}
                </button>
              )
            })}
          </div>
          {error ? (
            <p className="mt-2 text-xs text-destructive">
              Select a size to continue.
            </p>
          ) : null}
        </div>
      ) : null}

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

      <Button
        size="lg"
        className="w-full"
        onClick={addToBag}
        disabled={allSoldOut}
      >
        {allSoldOut ? "Sold out" : "Add to bag"}
      </Button>
    </div>
  )
}
