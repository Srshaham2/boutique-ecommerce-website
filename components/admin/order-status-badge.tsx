import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/admin/queries"

const STYLES: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  paid: "bg-violet-100 text-violet-800 border-violet-200",
  shipped: "bg-amber-100 text-amber-900 border-amber-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-muted text-muted-foreground border-border",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STYLES[status]
      )}
    >
      {status}
    </span>
  )
}
