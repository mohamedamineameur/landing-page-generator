import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-shared";
import { verifyAuthToken } from "@/lib/jwt";

const PROTECTED_API_PREFIXES = ["/api/projects", "/api/pages"];
const PROTECTED_PAGE_PREFIXES = ["/projects", "/dashboard", "/prompt", "/onboarding"];

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

  const authorization = request.headers.get("authorization");
  const tokenFromHeader = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const token = tokenFromHeader ?? request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    if (isProtectedPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  try {
    const user = await verifyAuthToken(token);
    const requestHeaders = new Headers(request.headers);

    requestHeaders.set("x-auth-user-id", user.userId);
    requestHeaders.set("x-auth-username", user.username);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    if (isProtectedPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth";
      redirectUrl.searchParams.set("next", pathname);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    return NextResponse.json({ error: "Token invalide ou expire." }, { status: 401 });
  }
}

export const config = {
  matcher: [
    "/api/projects/:path*",
    "/api/pages/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/projects/:path*",
    "/prompt/:path*",
  ],
};
