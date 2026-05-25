"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateOrderStatus } from "@/app/admin/(panel)/orders/actions"
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// "shipped" is set via the order page so carrier/tracking is captured and the
// customer is emailed — so it's only shown here when already the current state.
const SELECTABLE: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== "shipped")

/** Inline status changer for the orders list — no need to open each order. */
export function OrderStatusSelect({
  id,
  status,
}: {
  id: string
  status: OrderStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handle(next: string | null) {
    if (!next) return
    const value = next as OrderStatus
    if (value === status) return
    if (
      value === "cancelled" &&
      !window.confirm(
        "Cancel this order? Items with a known product will be restocked."
      )
    ) {
      return
    }
    startTransition(async () => {
      const res = await updateOrderStatus(id, value)
      if (res.ok) {
        toast.success(`Order marked ${value}.`)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Select value={status} onValueChange={handle} disabled={pending}>
      <SelectTrigger size="sm" className="w-32 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {status === "shipped" && (
          <SelectItem value="shipped" disabled className="capitalize">
            shipped
          </SelectItem>
        )}
        {SELECTABLE.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
