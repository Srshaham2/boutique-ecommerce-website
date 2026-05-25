import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { listCategories } from "@/lib/admin/queries"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  const categories = await listCategories()

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
      <ProductForm
        product={null}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          size_type: c.size_type,
        }))}
      />
    </div>
  )
}
