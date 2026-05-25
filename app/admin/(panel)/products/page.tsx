import Link from "next/link"
import { Plus, Search } from "lucide-react"

import { listProducts, LOW_STOCK_THRESHOLD } from "@/lib/admin/queries"
import { formatPrice, priceView, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PublishSwitch } from "@/components/admin/publish-switch"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const products = await listProducts({ q })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/admin/products/new" />} className="gap-2">
          <Plus className="size-4" /> New product
        </Button>
      </div>

      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="pl-9"
        />
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-center">Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => {
              const pv = priceView(p.price, p.sale_price)
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url}
                        alt=""
                        className="size-10 rounded object-cover"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {pv.onSale ? (
                      <span>
                        <span className="font-medium">{formatPrice(pv.current)}</span>{" "}
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(pv.original)}
                        </span>
                      </span>
                    ) : (
                      formatPrice(pv.current)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
                        p.stock_quantity === 0 && "text-destructive",
                        p.stock_quantity > 0 &&
                          p.stock_quantity <= LOW_STOCK_THRESHOLD &&
                          "text-amber-700"
                      )}
                    >
                      {p.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <PublishSwitch id={p.id} checked={p.in_stock} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
