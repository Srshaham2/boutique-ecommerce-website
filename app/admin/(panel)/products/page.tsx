import Link from "next/link"
import { Plus } from "lucide-react"

import { listProductsPage } from "@/lib/admin/queries"
import {
  PRODUCT_SORT_KEYS,
  type ProductSortKey,
  type SortDir,
} from "@/lib/admin/constants"
import { Button } from "@/components/ui/button"
import { ProductsTable } from "@/components/admin/products-table"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = sp.q ?? ""
  const sort = PRODUCT_SORT_KEYS.includes(sp.sort as ProductSortKey)
    ? (sp.sort as ProductSortKey)
    : undefined
  const dir: SortDir = sp.dir === "desc" ? "desc" : "asc"
  const requestedPage = Math.max(1, Number(sp.page) || 1)

  const { rows, total, page, pageCount, pageSize } = await listProductsPage({
    q,
    sort,
    dir,
    page: requestedPage,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total} product{total === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/admin/products/new" />} className="gap-2">
          <Plus className="size-4" /> New product
        </Button>
      </div>

      <ProductsTable
        rows={rows}
        total={total}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        q={q}
        sort={sort}
        dir={dir}
      />
    </div>
  )
}
