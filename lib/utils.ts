import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

/** Format a number as USD. The store trades in USD only. */
export function formatPrice(amount: number) {
  return usd.format(amount)
}

/**
 * Resolves how a product's price should be displayed and charged.
 * A product is "on sale" only when `salePrice` is set and strictly below `price`.
 */
export function priceView(price: number, salePrice?: number | null) {
  const onSale = typeof salePrice === "number" && salePrice >= 0 && salePrice < price
  return {
    onSale,
    /** The price actually charged (sale price when on sale, else the list price). */
    current: onSale ? (salePrice as number) : price,
    /** The original list price, shown struck-through when on sale. */
    original: price,
  }
}
