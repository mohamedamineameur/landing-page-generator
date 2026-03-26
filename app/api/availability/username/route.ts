import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function sanitizeUsername(input: string) {
  return input.trim().toLowerCase().slice(0, 64);
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const usernameRaw = url.searchParams.get("username") ?? "";
  const username = sanitizeUsername(usernameRaw);

  if (username.length < 3) {
    return NextResponse.json({ available: false, reason: "too_short" });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ available: (data ?? []).length === 0 });
}

