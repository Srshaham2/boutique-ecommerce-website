import { listCategories } from "@/lib/admin/queries"
import { CategoriesManager } from "@/components/admin/categories-manager"

export default async function CategoriesPage() {
  const categories = await listCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Add, rename, reorder, or remove storefront categories.
        </p>
      </div>
      <CategoriesManager categories={categories} />
    </div>
  )
}
