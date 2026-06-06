import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const env = getSupabaseEnv();
  if (!env) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; route handlers/actions can.
        }
      },
    },
  });
}

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { supabase: null, user: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}
