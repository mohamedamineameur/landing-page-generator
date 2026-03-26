import "server-only";
import { cookies, headers } from "next/headers";
import { type NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-shared";
import { jsonError } from "@/lib/api-utils";
import { verifyAuthToken } from "@/lib/jwt";

export { signAuthToken } from "@/lib/jwt";

async function readAuthenticatedUser() {
  const requestHeaders = await headers();
  const forwardedUserId = requestHeaders.get("x-auth-user-id");
  const forwardedUsername = requestHeaders.get("x-auth-username");

  if (forwardedUserId && forwardedUsername) {
    return {
      user: {
        userId: forwardedUserId,
        username: forwardedUsername,
      },
    };
  }

  const authorization = requestHeaders.get("authorization");
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : tokenFromCookie;

  if (!token) {
    return {
      user: null,
    };
  }

  try {
    const user = await verifyAuthToken(token);

    return {
      user,
    };
  } catch {
    return {
      user: null,
    };
  }
}

export async function getOptionalAuthenticatedUser() {
  return readAuthenticatedUser();
}

export async function requireAuthenticatedUser() {
  const result = await readAuthenticatedUser();

  if (!result.user) {
    return {
      error: jsonError("Authentification requise.", 401),
      user: null,
    };
  }

  return {
    error: null,
    user: result.user,
  };
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
