import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isRecord, readUuid } from "@/lib/api-utils";
import { syncDatabase } from "@/lib/models";
import { findOwnedProject } from "@/lib/ownership";
import { CURRENT_PROJECT_COOKIE_NAME } from "@/lib/project-selection";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      return NextResponse.json({ error: "Le corps de la requete est invalide." }, { status: 400 });
    }

    const projectId = readUuid(body.projectId);

    if (!projectId) {
      return NextResponse.json({ error: "Le projectId doit etre un UUID valide." }, { status: 400 });
    }

    await syncDatabase();
    const project = await findOwnedProject(auth.user.userId, projectId);

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      project,
    });

    response.cookies.set({
      name: CURRENT_PROJECT_COOKIE_NAME,
      value: projectId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible de selectionner le projet courant.",
      },
      { status: 500 },
    );
  }
}
