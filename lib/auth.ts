import "server-only";
import { jsonError } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOptionalAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return { user: null };
  }

  return {
    user: {
      userId: data.user.id,
      email: data.user.email ?? null,
    },
  };
}

export async function requireAuthenticatedUser() {
  const auth = await getOptionalAuthenticatedUser();

  if (!auth.user) {
    return {
      error: jsonError("Authentification requise.", 401),
      user: null,
    };
  }

  return {
    error: null,
    user: auth.user,
  };
}
