import { NextResponse } from "next/server";
import { getOptionalAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getOptionalAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, created_at")
    .eq("id", auth.user.userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      username: profile.username,
      createdAt: profile.created_at,
    },
  });
}
