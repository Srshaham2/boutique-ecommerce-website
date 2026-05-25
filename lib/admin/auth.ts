import "server-only"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AdminUser = { id: string; email: string | null }

/**
 * Returns the signed-in user only if they are a backoffice admin
 * (profiles.is_admin = true), otherwise null. Reads the user's own profile
 * row, which RLS permits.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.is_admin) return null
  return { id: user.id, email: user.email ?? null }
}

/**
 * Guard for admin pages and server actions. Redirects non-admins to the login
 * page. Call this at the top of every admin server action / route handler —
 * layout guards alone do not protect server actions.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser()
  if (!admin) redirect("/admin/login")
  return admin
}
