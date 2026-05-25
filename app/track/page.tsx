import type { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TrackForm } from "@/components/track-form"

export const metadata: Metadata = {
  title: "Track your order — BieLux",
  description: "Check the status of your BieLux order.",
}

export default function TrackPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 sm:px-6">
        <h1 className="font-heading text-3xl">Track your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your order number and the email you used at checkout to see its
          status.
        </p>

        <div className="mt-8">
          <TrackForm />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
