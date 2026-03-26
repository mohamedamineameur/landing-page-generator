import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { APP_SESSION_COOKIE_NAME } from "@/lib/session-cookie";

const PROTECTED_API_PREFIXES = ["/api/projects", "/api/pages"];
const PROTECTED_PAGE_PREFIXES = ["/projects", "/dashboard", "/prompt", "/onboarding", "/settings"];

function isProtectedApiPath(pathname: string) {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPagePath(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedApi = isProtectedApiPath(pathname);
  const isProtectedPage = isProtectedPagePath(pathname);

  if (!isProtectedApi && !isProtectedPage) {
    return NextResponse.next();
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const sessionToken = request.cookies.get(APP_SESSION_COOKIE_NAME)?.value ?? null;

    async function sha256Hex(input: string) {
      const bytes = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    function randomTokenBase64Url(byteLength = 32) {
      const bytes = new Uint8Array(byteLength);
      crypto.getRandomValues(bytes);
      const base64 = btoa(String.fromCharCode(...bytes));
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }

    if (!sessionToken) {
      const newToken = randomTokenBase64Url(32);
      const tokenHash = await sha256Hex(newToken);
      const userAgent = request.headers.get("user-agent");
      const ipHeader = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
      const ip = ipHeader ? ipHeader.split(",")[0]?.trim() : null;

      const { error } = await supabase.from("user_sessions").insert({
        user_id: data.user.id,
        token_hash: tokenHash,
        user_agent: userAgent,
        ip,
      });

      if (!error) {
        response.cookies.set({
          name: APP_SESSION_COOKIE_NAME,
          value: newToken,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      return response;
    }

    const tokenHash = await sha256Hex(sessionToken);
    const { data: sessionRow, error: sessionError } = await supabase
      .from("user_sessions")
      .select("id, revoked_at")
      .eq("user_id", data.user.id)
      .eq("token_hash", tokenHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError || !sessionRow || sessionRow.revoked_at) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth";
      redirectUrl.searchParams.set("next", pathname);
      const denied = NextResponse.redirect(redirectUrl);
      denied.cookies.delete(APP_SESSION_COOKIE_NAME);
      return denied;
    }

    void supabase.from("user_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", sessionRow.id);

    return response;
  }

  if (isProtectedPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
}

export const config = {
  matcher: [
    "/api/projects/:path*",
    "/api/pages/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/projects/:path*",
    "/prompt/:path*",
    "/settings/:path*",
  ],
};
