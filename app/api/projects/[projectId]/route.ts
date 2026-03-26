import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { jsonError, isUuid, isRecord, sanitizeProjectName } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const { projectId } = await context.params;

    if (!isUuid(projectId)) {
      return jsonError("Le projectId doit etre un UUID valide.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, name, user_id, created_at, updated_at")
      .eq("id", projectId)
      .maybeSingle();

    if (error) {
      return jsonError(error.message, 500);
    }

    if (!project) {
      return jsonError("Projet introuvable.", 404);
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      userId: project.user_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de recuperer le projet.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const { projectId } = await context.params;

    if (!isUuid(projectId)) {
      return jsonError("Le projectId doit etre un UUID valide.");
    }

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
      .update({ name })
      .eq("id", projectId)
      .select("id, name, user_id, created_at, updated_at")
      .maybeSingle();

    if (error) {
      return jsonError(error.message, 500);
    }

    if (!project) {
      return jsonError("Projet introuvable.", 404);
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      userId: project.user_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de mettre a jour le projet.", 500);
  }
}
