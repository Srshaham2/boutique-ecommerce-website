import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = ReturnType<typeof createAdminClient>

/** One row of an order's status history. */
export type OrderEvent = {
  id: string
  order_id: string
  status: string
  note: string | null
  created_at: string
}

/** Append a status-change entry to an order's history (best effort). */
export async function logOrderEvent(
  supabase: AdminClient,
  orderId: string,
  status: string,
  note?: string | null
): Promise<void> {
  const { error } = await supabase
    .from("order_events")
    .insert({ order_id: orderId, status, note: note?.trim() || null })
  if (error) console.error("[logOrderEvent] failed:", error)
}

/** An order's status history, oldest first. */
export async function getOrderEvents(
  supabase: AdminClient,
  orderId: string
): Promise<OrderEvent[]> {
  const { data, error } = await supabase
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as OrderEvent[]
}
