import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Using anon key for server actions for simplicity here.
    // For more secure operations, you might use the service_role key,
    // but that requires careful handling and should not be exposed client-side.
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )
}

// Utility to create a Supabase client for server-side logic outside of request context (e.g. in server actions not using cookies)
// This uses the anon key. For privileged operations, you'd use the service_role key.
import { createClient } from "@supabase/supabase-js"
export const supabaseAdmin = createClient(
  // Renamed to avoid confusion, though still using anon key here
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // For true admin/privileged operations, use SERVICE_ROLE_KEY
  // process.env.SUPABASE_SERVICE_ROLE_KEY!
)
