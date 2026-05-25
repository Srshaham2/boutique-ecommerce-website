"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"

/**
 * Drives a server-paged table from the URL. `update` merges params into the
 * current query string and soft-navigates, so the server re-fetches the page;
 * `pending` is true while that navigation is in flight.
 */
export function useTableParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function update(next: Record<string, string | number | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") params.delete(key)
      else params.set(key, String(value))
    }
    const qs = params.toString()
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    )
  }

  return { pending, update }
}
