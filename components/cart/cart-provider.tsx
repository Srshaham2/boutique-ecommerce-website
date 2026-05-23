"use client"

import * as React from "react"

export type CartProductInput = {
  id: string
  name: string
  slug: string
  price: number
  image_url: string
}

export type CartItem = CartProductInput & {
  size: string | null
  quantity: number
  lineId: string
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  isOpen: boolean
  hydrated: boolean
  openCart: () => void
  closeCart: () => void
  setOpen: (open: boolean) => void
  addItem: (
    product: CartProductInput,
    opts?: { size?: string | null; quantity?: number }
  ) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clear: () => void
}

const STORAGE_KEY = "bielux-cart"

const CartContext = React.createContext<CartContextValue | null>(null)

function lineIdFor(productId: string, size: string | null) {
  return `${productId}::${size ?? ""}`
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)

  // Hydrate from localStorage once on mount. This must run in an effect because
  // localStorage is unavailable during SSR, so a lazy initializer can't be used.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  // Persist after hydration
  React.useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore quota/serialization errors
    }
  }, [items, hydrated])

  const addItem = React.useCallback<CartContextValue["addItem"]>(
    (product, opts) => {
      const size = opts?.size ?? null
      const quantity = Math.max(1, opts?.quantity ?? 1)
      const lineId = lineIdFor(product.id, size)

      setItems((prev) => {
        const existing = prev.find((i) => i.lineId === lineId)
        if (existing) {
          return prev.map((i) =>
            i.lineId === lineId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        }
        return [...prev, { ...product, size, quantity, lineId }]
      })
      setIsOpen(true)
    },
    []
  )

  const removeItem = React.useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId))
  }, [])

  const updateQuantity = React.useCallback(
    (lineId: string, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.lineId !== lineId)
          : prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
      )
    },
    []
  )

  const clear = React.useCallback(() => setItems([]), [])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    isOpen,
    hydrated,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    setOpen: setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within a CartProvider")
  return ctx
}
