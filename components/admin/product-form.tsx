"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/app/admin/(panel)/products/actions"
import type { AdminProduct } from "@/lib/admin/queries"
import { SIZE_OPTIONS, asSizeType, type SizeType } from "@/lib/sizes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUploader } from "@/components/admin/image-uploader"

const NO_CATEGORY = "__none__"

export function ProductForm({
  product,
  categories,
}: {
  product: AdminProduct | null
  categories: { id: string; name: string; size_type: SizeType }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState(product?.name ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [salePrice, setSalePrice] = useState(
    product?.sale_price != null ? String(product.sale_price) : ""
  )

  // Per-size stock, seeded from existing variants. `oneSizeStock` is used when
  // the product's category has no sizes; `sizeStock` is keyed by size otherwise.
  const initial = (() => {
    const bySize: Record<string, string> = {}
    let oneSize = "0"
    for (const v of product?.variants ?? []) {
      if (v.size == null) oneSize = String(v.stock_quantity)
      else bySize[v.size] = String(v.stock_quantity)
    }
    return { bySize, oneSize }
  })()
  const [sizeStock, setSizeStock] = useState<Record<string, string>>(
    initial.bySize
  )
  const [oneSizeStock, setOneSizeStock] = useState(initial.oneSize)

  const [categoryId, setCategoryId] = useState(
    product?.category_id ?? NO_CATEGORY
  )
  const [badge, setBadge] = useState(product?.badge ?? "")
  const [imageUrl, setImageUrl] = useState<string | null>(
    product?.image_url ?? null
  )
  const [hoverImageUrl, setHoverImageUrl] = useState<string | null>(
    product?.hover_image_url ?? null
  )
  const [isNew, setIsNew] = useState(product?.is_new ?? false)
  const [isMostWanted, setIsMostWanted] = useState(
    product?.is_most_wanted ?? false
  )
  const [inStock, setInStock] = useState(product?.in_stock ?? true)

  // The selected category decides which sizes (if any) this product has.
  const sizeType: SizeType =
    categoryId === NO_CATEGORY
      ? "none"
      : asSizeType(categories.find((c) => c.id === categoryId)?.size_type)
  const sizes = SIZE_OPTIONS[sizeType]

  function buildInput(): ProductInput {
    const variants =
      sizeType === "none"
        ? [{ size: null, quantity: Number(oneSizeStock) || 0 }]
        : sizes.map((s) => ({ size: s, quantity: Number(sizeStock[s]) || 0 }))
    return {
      name,
      slug,
      description,
      price: Number(price) || 0,
      salePrice: salePrice.trim() === "" ? null : Number(salePrice),
      categoryId: categoryId === NO_CATEGORY ? null : categoryId,
      imageUrl: imageUrl ?? "",
      hoverImageUrl: hoverImageUrl,
      badge: badge.trim() || null,
      variants,
      isNew,
      isMostWanted,
      inStock,
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input = buildInput()
    startTransition(async () => {
      const res = product
        ? await updateProduct(product.id, input)
        : await createProduct(input)
      if (res.ok) {
        toast.success(product ? "Product saved." : "Product created.")
        router.push("/admin/products")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDelete() {
    if (!product) return
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return
    startTransition(async () => {
      const res = await deleteProduct(product.id)
      if (res.ok) {
        toast.success("Product deleted.")
        router.push("/admin/products")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated from the name"
                />
                <p className="text-xs text-muted-foreground">
                  Used in the storefront link: /products/<em>slug</em>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salePrice">Sale price</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="optional"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sizeType === "none" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stock quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={oneSizeStock}
                    onChange={(e) => setOneSizeStock(e.target.value)}
                    className="sm:max-w-40"
                  />
                  <p className="text-xs text-muted-foreground">
                    This category has no sizes — one stock count for the product.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    On-hand units per size. 0 means that size is sold out.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {sizes.map((s) => (
                      <div key={s} className="space-y-1.5">
                        <Label htmlFor={`stock-${s}`}>{s}</Label>
                        <Input
                          id={`stock-${s}`}
                          type="number"
                          min="0"
                          step="1"
                          value={sizeStock[s] ?? ""}
                          placeholder="0"
                          onChange={(e) =>
                            setSizeStock((prev) => ({
                              ...prev,
                              [s]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader
                label="Main image"
                value={imageUrl}
                onChange={setImageUrl}
              />
              <ImageUploader
                label="Hover image (optional)"
                value={hoverImageUrl}
                onChange={setHoverImageUrl}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={categoryId}
                  onValueChange={(v) => setCategoryId(v ?? NO_CATEGORY)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="badge">Badge</Label>
                <Input
                  id="badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. NEW, SALE"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibility & flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                label="Published"
                hint="Visible and buyable on the storefront"
                checked={inStock}
                onChange={setInStock}
              />
              <ToggleRow
                label="New arrival"
                hint="Shows in the New filter"
                checked={isNew}
                onChange={setIsNew}
              />
              <ToggleRow
                label="Most wanted"
                hint="Shows in the Most-wanted filter"
                checked={isMostWanted}
                onChange={setIsMostWanted}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {product && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={pending}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : product ? "Save product" : "Create product"}
          </Button>
        </div>
      </div>
    </form>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
