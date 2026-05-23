import { createClient } from "@supabase/supabase-js"

/**
 * Privileged, server-only Supabase client using the secret key.
 * BYPASSES Row Level Security — never import this into client components.
 * Use only for trusted server work: Stripe webhooks, order creation,
 * admin mutations, and AI Studio asset writes.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
