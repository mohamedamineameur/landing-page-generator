import { UniqueConstraintError } from "sequelize";
import { NextResponse } from "next/server";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { jsonError, isRecord, sanitizePassword, sanitizeUsername } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      return jsonError("Le corps de la requete est invalide.");
    }

    const username = sanitizeUsername(body.username);
    const password = sanitizePassword(body.password);

    if (!username || username.length < 3) {
      return jsonError("Le username est requis et doit contenir au moins 3 caracteres.");
    }

    if (!password) {
      return jsonError("Le password est requis et doit contenir au moins 8 caracteres.");
    }

    await syncDatabase();
    const { User } = getModels();

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      username,
      passwordHash,
    });
    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
    });

    const response = NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    );

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return jsonError("Ce username est deja utilise.", 409);
    }

    return jsonError(
      error instanceof Error ? error.message : "Impossible de creer l'utilisateur.",
      500,
    );
  }
}
