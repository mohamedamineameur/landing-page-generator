import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isRecord, isUuid, jsonError, sanitizePayload } from "@/lib/api-utils";
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
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      return jsonError(projectError.message, 500);
    }

    if (!project) {
      return jsonError("Projet introuvable.", 404);
    }

    const { data: pages, error } = await supabase
      .from("pages")
      .select("id, project_id, is_effective, payload, created_at")
      .eq("project_id", projectId)
      .order("is_effective", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json(
      (pages ?? []).map((page) => ({
        id: page.id,
        projectId: page.project_id,
        isEffective: page.is_effective,
        payload: page.payload,
        createdAt: page.created_at,
      })),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Impossible de lister l'historique des pages.",
      500,
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
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

    const payload = sanitizePayload(body.payload);
    const isEffective = body.isEffective !== false;

    if (!payload) {
      return jsonError("Le payload est requis et doit etre un JSON valide.");
    }

    const supabase = await createSupabaseServerClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      return jsonError(projectError.message, 500);
    }

    if (!project) {
      return jsonError("Projet introuvable.", 404);
    }

    if (isEffective) {
      const { error: disableError } = await supabase
        .from("pages")
        .update({ is_effective: false })
        .eq("project_id", projectId)
        .eq("is_effective", true);

      if (disableError) {
        return jsonError(disableError.message, 500);
      }
    }

    const { data: page, error: insertError } = await supabase
      .from("pages")
      .insert({
        project_id: projectId,
        payload,
        is_effective: isEffective,
      })
      .select("id, project_id, is_effective, payload, created_at")
      .single();

    if (insertError) {
      return jsonError(insertError.message, 500);
    }

    return NextResponse.json(
      {
        id: page.id,
        projectId: page.project_id,
        isEffective: page.is_effective,
        payload: page.payload,
        createdAt: page.created_at,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de creer la page.", 500);
  }
}
