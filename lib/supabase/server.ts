import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(staySignedIn?: boolean) {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (staySignedIn === false) {
                delete options.maxAge
                delete options.expires
              }
              cookieStore.set(name, value, options)
            })
          } catch {
              console.error("Can not able to set the cookies");
          }
        },
      },
    }
  )
}
