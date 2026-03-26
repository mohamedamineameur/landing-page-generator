import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { normalizeProjectName } from "@/lib/project-name";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function sanitizeProjectName(input: string) {
  return normalizeProjectName(input);
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(request.url);
  const nameRaw = url.searchParams.get("name") ?? "";
  const name = sanitizeProjectName(nameRaw);

  if (!name) {
    return NextResponse.json({ available: false, reason: "empty" });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", auth.user.userId)
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const alreadyExists = (data ?? []).some((project) => normalizeProjectName(project.name) === name);

  return NextResponse.json({ available: !alreadyExists });
}

