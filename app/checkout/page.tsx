"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"

import { formatPrice } from "@/lib/utils"
import { shippingFor } from "@/lib/checkout"
import { useCart } from "@/components/cart/cart-provider"
import { placeOrder } from "@/app/checkout/actions"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"

const inputClass =
  "h-11 w-full border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"

export default function CheckoutPage() {
  const { items, subtotal, count, clear, hydrated } = useCart()
  const [placed, setPlaced] = React.useState(false)
  const [orderNumber, setOrderNumber] = React.useState<string | null>(null)
  const [emailSent, setEmailSent] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const shipping = shippingFor(subtotal)
  const total = subtotal + shipping

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    const fd = new FormData(e.currentTarget)
    setSubmitting(true)
    setError(null)

    try {
      const result = await placeOrder({
        email: String(fd.get("email") ?? ""),
        firstName: String(fd.get("firstName") ?? ""),
        lastName: String(fd.get("lastName") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        address: String(fd.get("address") ?? ""),
        city: String(fd.get("city") ?? ""),
        state: String(fd.get("state") ?? ""),
        zip: String(fd.get("zip") ?? ""),
        items: items.map((i) => ({
          id: i.id,
          size: i.size,
          quantity: i.quantity,
        })),
      })

      if (result.ok) {
        setOrderNumber(result.orderNumber)
        setEmailSent(result.emailSent)
        setPlaced(true)
        clear()
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setError(result.error)
      }
    } catch {
      setError("Something went wrong placing your order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        {placed ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <CheckCircle2Icon className="size-14 text-foreground" strokeWidth={1} />
            <h1 className="font-script text-5xl">Thank you</h1>
            {orderNumber ? (
              <p className="font-heading text-xl">
                Order <span className="font-medium">{orderNumber}</span>
              </p>
            ) : null}
            <p className="max-w-md text-muted-foreground">
              {emailSent ? (
                <>
                  Your order is confirmed. A confirmation email is on its way to
                  your inbox.
                </>
              ) : (
                <>
                  Your order is confirmed and saved — but we couldn&apos;t send
                  the confirmation email just now. Don&apos;t worry: the shop has
                  your details and will follow up.
                </>
              )}{" "}
              (This is a demo checkout — no payment was taken.)
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/shop" />}
              className="mt-2"
            >
              Continue shopping
            </Button>
          </div>
        ) : !hydrated ? (
          <div className="py-24 text-center text-muted-foreground">Loading…</div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <h1 className="font-script text-5xl">Your bag is empty</h1>
            <p className="text-muted-foreground">
              Add a few pieces before checking out.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/shop" />}
              className="mt-2"
            >
              Shop now
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-center font-script text-5xl sm:text-6xl">
              Checkout
            </h1>
            <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <fieldset className="space-y-4">
                  <legend className="font-heading text-2xl">Contact</legend>
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email address"
                    className={inputClass}
                  />
                  <input
                    required
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    className={inputClass}
                  />
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="font-heading text-2xl">Shipping</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      name="firstName"
                      placeholder="First name"
                      className={inputClass}
                    />
                    <input
                      required
                      name="lastName"
                      placeholder="Last name"
                      className={inputClass}
                    />
                  </div>
                  <input
                    required
                    name="address"
                    placeholder="Address"
                    className={inputClass}
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input required name="city" placeholder="City" className={inputClass} />
                    <input required name="state" placeholder="State" className={inputClass} />
                    <input required name="zip" placeholder="ZIP" className={inputClass} />
                  </div>
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="font-heading text-2xl">Payment</legend>
                  <input
                    placeholder="Card number"
                    className={inputClass}
                    inputMode="numeric"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="MM / YY" className={inputClass} />
                    <input placeholder="CVC" className={inputClass} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Demo only — do not enter real card details.
                  </p>
                </fieldset>

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    <>Place order · {formatPrice(total)}</>
                  )}
                </Button>
              </form>

              {/* Summary */}
              <aside className="h-fit border bg-muted/30 p-6">
                <h2 className="font-heading text-2xl">Order summary</h2>
                <ul className="mt-6 divide-y">
                  {items.map((item) => (
                    <li key={item.lineId} className="flex gap-4 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-20 w-16 object-cover"
                      />
                      <div className="flex flex-1 flex-col text-sm">
                        <span className="font-heading text-base">{item.name}</span>
                        {item.size ? (
                          <span className="text-muted-foreground">
                            Size {item.size}
                          </span>
                        ) : null}
                        <span className="text-muted-foreground">
                          Qty {item.quantity}
                        </span>
                      </div>
                      <span className="text-sm tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd className="tabular-nums">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-medium">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatPrice(total)}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
