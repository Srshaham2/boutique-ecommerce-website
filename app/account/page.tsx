import type { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Account — BieLux",
}

const inputClass =
  "h-11 w-full border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"

export default function AccountPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-20 sm:px-6">
        <h1 className="text-center font-script text-5xl sm:text-6xl">Account</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Sign in to track orders and check out faster.
        </p>

        <form className="mt-10 space-y-4">
          <input type="email" placeholder="Email address" className={inputClass} />
          <input type="password" placeholder="Password" className={inputClass} />
          <Button size="lg" className="w-full" type="button">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <button className="text-foreground underline-offset-2 hover:underline">
            Create an account
          </button>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
