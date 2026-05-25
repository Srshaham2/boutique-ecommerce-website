"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Mail, Truck } from "lucide-react"
import { toast } from "sonner"

import {
  markShipped,
  resendOrderEmails,
  saveOrderNotes,
  updateOrderStatus,
} from "@/app/admin/(panel)/orders/actions"
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {
  id: string
  status: OrderStatus
  carrier: string | null
  trackingNumber: string | null
  adminNotes: string | null
}

// Selectable statuses (shipping is done via the dedicated form so the customer
// is emailed); "shipped" only appears when that's the current state.
const SELECTABLE: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== "shipped")

export function OrderActions({
  id,
  status,
  carrier,
  trackingNumber,
  adminNotes,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [carrierInput, setCarrierInput] = useState(carrier ?? "")
  const [trackingInput, setTrackingInput] = useState(trackingNumber ?? "")
  const [notes, setNotes] = useState(adminNotes ?? "")

  function handleStatus(next: string | null) {
    if (!next) return
    const value = next as OrderStatus
    if (value === status) return
    if (value === "cancelled") {
      const ok = window.confirm(
        "Cancel this order? Items with a known product will be restocked."
      )
      if (!ok) return
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

  function handleShip() {
    startTransition(async () => {
      const res = await markShipped(id, carrierInput, trackingInput)
      if (res.ok) {
        toast.success(
          res.emailSent
            ? "Marked shipped — tracking email sent to the customer."
            : "Marked shipped, but the email couldn't be sent (check email settings)."
        )
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleResend() {
    startTransition(async () => {
      const res = await resendOrderEmails(id)
      if (res.ok) toast.success("Order emails resent.")
      else toast.error(res.error)
    })
  }

  function handleSaveNotes() {
    startTransition(async () => {
      const res = await saveOrderNotes(id, notes)
      if (res.ok) toast.success("Notes saved.")
      else toast.error(res.error)
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={status} onValueChange={handleStatus} disabled={pending}>
            <SelectTrigger className="w-full capitalize">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="size-4" /> Shipment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              list="carriers"
              placeholder="USPS, UPS, FedEx…"
              value={carrierInput}
              onChange={(e) => setCarrierInput(e.target.value)}
            />
            <datalist id="carriers">
              <option value="USPS" />
              <option value="UPS" />
              <option value="FedEx" />
              <option value="DHL" />
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tracking">Tracking number</Label>
            <Input
              id="tracking"
              placeholder="Tracking #"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
            />
          </div>
          <Button onClick={handleShip} disabled={pending} className="w-full gap-2">
            <Truck className="size-4" />
            {status === "shipped" ? "Update shipment & re-notify" : "Mark shipped & email customer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents & email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            render={
              <a
                href={`/admin/orders/${id}/label`}
                target="_blank"
                rel="noreferrer"
              />
            }
            variant="outline"
            className="w-full gap-2"
          >
            <Download className="size-4" /> Download shipping label
          </Button>
          <Button
            onClick={handleResend}
            disabled={pending}
            variant="outline"
            className="w-full gap-2"
          >
            <Mail className="size-4" /> Resend order emails
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes — not shown to the customer."
            rows={3}
          />
          <Button
            onClick={handleSaveNotes}
            disabled={pending}
            variant="secondary"
            className="w-full"
          >
            Save notes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
