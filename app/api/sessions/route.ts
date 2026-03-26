import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { APP_SESSION_COOKIE_NAME } from "@/lib/session-cookie";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user) return auth.error;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_sessions")
    .select("id, created_at, last_seen_at, revoked_at, ip, user_agent, token_hash")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const currentToken = (await cookies()).get(APP_SESSION_COOKIE_NAME)?.value ?? null;
  let currentHash: string | null = null;

  if (currentToken) {
    const cryptoModule = await import("node:crypto");
    currentHash = cryptoModule.createHash("sha256").update(currentToken).digest("hex");
  }

  return NextResponse.json(
    (data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      revokedAt: row.revoked_at,
      ip: row.ip,
      userAgent: row.user_agent,
      isCurrent: currentHash ? row.token_hash === currentHash : false,
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user) return auth.error;

  const body = (await request.json().catch(() => null)) as null | { sessionId?: unknown };
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId requis." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

