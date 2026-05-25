import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getProduct, listCategories } from "@/lib/admin/queries"
import { ProductForm } from "@/components/admin/product-form"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProduct(id),
    listCategories(),
  ])
  if (!product) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
      <ProductForm
        product={product}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          size_type: c.size_type,
        }))}
      />
    </div>
  )
}
