"use client"

import Link from "next/link"
import { MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react"

import { formatPrice } from "@/lib/utils"
import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const FREE_SHIPPING_THRESHOLD = 75

export function CartSheet() {
  const {
    items,
    count,
    subtotal,
    isOpen,
    setOpen,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart()

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-script text-2xl">
            Your Bag {count > 0 ? `(${count})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBagIcon
              className="size-10 text-muted-foreground"
              strokeWidth={1}
            />
            <p className="text-muted-foreground">Your bag is empty.</p>
            <Button
              onClick={closeCart}
              nativeButton={false}
              render={<Link href="/shop" />}
            >
              Continue shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              {subtotal < FREE_SHIPPING_THRESHOLD ? (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  You&apos;re {formatPrice(remaining)} away from free shipping.
                </p>
              ) : (
                <p className="py-3 text-center text-xs font-medium text-foreground">
                  You&apos;ve unlocked free shipping ✨
                </p>
              )}

              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.lineId} className="flex gap-4 py-4">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-24 w-20 object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="font-heading text-base leading-tight hover:underline"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => removeItem(item.lineId)}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                      {item.size ? (
                        <span className="mt-0.5 text-xs text-muted-foreground">
                          Size {item.size}
                        </span>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center border">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(item.lineId, item.quantity - 1)
                            }
                            className="flex size-8 items-center justify-center transition-colors hover:bg-muted"
                          >
                            <MinusIcon className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              updateQuantity(item.lineId, item.quantity + 1)
                            }
                            className="flex size-8 items-center justify-center transition-colors hover:bg-muted"
                          >
                            <PlusIcon className="size-3.5" />
                          </button>
                        </div>
                        <span className="text-sm tabular-nums">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <SheetFooter className="border-t">
              <div className="flex items-center justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={closeCart}
                nativeButton={false}
                render={<Link href="/checkout" />}
              >
                Checkout
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={closeCart}
                nativeButton={false}
                render={<Link href="/shop" />}
              >
                Continue shopping
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
