"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { TableHead } from "@/components/ui/table"

export type SortDir = "asc" | "desc"

/** A clickable table header that toggles/indicates the current sort column. */
export function SortHeader({
  label,
  active,
  dir,
  onSort,
  align = "left",
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onSort: () => void
  align?: "left" | "right" | "center"
  className?: string
}) {
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "inline-flex w-full items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "justify-end",
          align === "center" && "justify-center",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-50")} />
      </button>
    </TableHead>
  )
}
