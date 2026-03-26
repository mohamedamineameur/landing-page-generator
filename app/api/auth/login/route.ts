import { NextResponse } from "next/server";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { jsonError, isRecord, sanitizePassword, sanitizeUsername } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      return jsonError("Le corps de la requete est invalide.");
    }

    const username = sanitizeUsername(body.username);
    const password = sanitizePassword(body.password);

    if (!username || !password) {
      return jsonError("Le username et le password sont requis.");
    }

    await syncDatabase();
    const { User } = getModels();

    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return jsonError("Identifiants invalides.", 401);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return jsonError("Identifiants invalides.", 401);
    }

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de se connecter.", 500);
  }
}
