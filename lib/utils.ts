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
