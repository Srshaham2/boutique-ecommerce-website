"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

type SearchResult = {
  id: string
  name: string
  slug: string
  price: number
  image_url: string
  category: { name: string; slug: string } | null
}

const quickLinks = [
  { label: "New Arrivals", href: "/shop?filter=new" },
  { label: "Dresses", href: "/shop?category=dresses" },
  { label: "Sets", href: "/shop?category=sets" },
  { label: "Pants", href: "/shop?category=pants" },
  { label: "Shoes", href: "/shop?category=shoes" },
  { label: "Accessories", href: "/shop?category=accessories" },
]

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)

  // Debounced server-side search against Supabase. The synchronous resets below
  // are intentional: they react to the user's typing (external input).
  React.useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const handle = setTimeout(async () => {
      const supabase = createClient()
      const pattern = `%${term}%`
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, category:categories(name, slug)")
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .limit(6)

      setResults((data ?? []) as unknown as SearchResult[])
      setLoading(false)
    }, 220)

    return () => clearTimeout(handle)
  }, [query])

  function go(href: string) {
    onOpenChange(false)
    setQuery("")
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search the BieLux catalog"
      className="max-w-xl"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search for dresses, sets, tops…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
        {query.trim().length >= 2 && !loading && results.length === 0 ? (
          <CommandEmpty>No pieces match “{query}”.</CommandEmpty>
        ) : null}

        {results.length > 0 ? (
          <CommandGroup heading="Products">
            {results.map((product) => (
              <CommandItem
                key={product.id}
                value={product.slug}
                onSelect={() => go(`/products/${product.slug}`)}
                className="gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url}
                  alt=""
                  className="h-12 w-10 shrink-0 object-cover"
                />
                <span className="flex flex-col">
                  <span className="font-heading text-base">{product.name}</span>
                  {product.category ? (
                    <span className="text-xs text-muted-foreground">
                      {product.category.name}
                    </span>
                  ) : null}
                </span>
                <span className="ms-auto text-sm tabular-nums text-muted-foreground">
                  {formatPrice(product.price)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {query.trim().length >= 2 ? (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value={`search-all-${query}`}
                onSelect={() => go(`/shop?q=${encodeURIComponent(query.trim())}`)}
              >
                <ArrowRightIcon />
                See all results for “{query.trim()}”
              </CommandItem>
            </CommandGroup>
          </>
        ) : (
          <CommandGroup heading="Explore">
            {quickLinks.map((link) => (
              <CommandItem
                key={link.href}
                value={link.label}
                onSelect={() => go(link.href)}
              >
                <ArrowRightIcon />
                {link.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
