import Link from "next/link"

import { listProducts, LOW_STOCK_THRESHOLD } from "@/lib/admin/queries"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StockEditor } from "@/components/admin/stock-editor"

export default async function InventoryPage() {
  const products = (await listProducts()).sort(
    (a, b) => a.stock_quantity - b.stock_quantity
  )
  const lowCount = products.filter(
    (p) => p.stock_quantity <= LOW_STOCK_THRESHOLD
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          {lowCount} item{lowCount === 1 ? "" : "s"} at or below {LOW_STOCK_THRESHOLD}{" "}
          units. Lowest stock first.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Published</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Stock by size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const oneSize =
                p.variants.length === 1 && p.variants[0].size == null
                  ? p.variants[0]
                  : null
              return (
                <TableRow key={p.id}>
                  <TableCell className="align-top">
                    <Link href={`/admin/products/${p.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url}
                        alt=""
                        className="size-10 rounded object-cover"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="align-top font-medium">
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                    <span
                      className={cn(
                        "ml-2 align-middle text-xs font-medium",
                        p.stock_quantity === 0 && "text-destructive",
                        p.stock_quantity > 0 &&
                          p.stock_quantity <= LOW_STOCK_THRESHOLD &&
                          "text-amber-700"
                      )}
                    >
                      {p.stock_quantity === 0
                        ? "Out of stock"
                        : p.stock_quantity <= LOW_STOCK_THRESHOLD
                          ? "Low"
                          : ""}
                    </span>
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-center align-top text-muted-foreground">
                    {p.in_stock ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-right align-top tabular-nums">
                    {p.stock_quantity}
                  </TableCell>
                  <TableCell>
                    {oneSize ? (
                      <div className="flex justify-end">
                        <StockEditor
                          variantId={oneSize.id}
                          value={oneSize.stock_quantity}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-2">
                        {p.variants.map((v) => (
                          <StockEditor
                            key={v.id}
                            variantId={v.id}
                            value={v.stock_quantity}
                            label={v.size}
                          />
                        ))}
                      </div>
                    )}
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
