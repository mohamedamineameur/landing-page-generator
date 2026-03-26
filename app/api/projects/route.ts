import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { jsonError, isRecord, sanitizeProjectName } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, user_id, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json(
      (data ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        userId: project.user_id,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Impossible de lister les projets.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const currentUserId = auth.user.userId;

    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      return jsonError("Le corps de la requete est invalide.");
    }

    const name = sanitizeProjectName(body.name);

    if (!name) {
      return jsonError("Le nom du projet est requis.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ name, user_id: currentUserId })
      .select("id, name, user_id, created_at, updated_at")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        userId: project.user_id,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de creer le projet.", 500);
  }
}
