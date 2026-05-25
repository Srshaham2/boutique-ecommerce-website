"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Prev/next pager with a "1–20 of 134" range label for a server-paged table. */
export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  disabled,
  onPage,
}: {
  page: number
  pageCount: number
  pageSize: number
  total: number
  disabled?: boolean
  onPage: (page: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {total === 0 ? "No results" : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled || page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
