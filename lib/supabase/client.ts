import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser-side Supabase client.
 * Uses the publishable key, which is safe to expose to the browser.
 * RLS policies enforce what the signed-in user can read/write.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
