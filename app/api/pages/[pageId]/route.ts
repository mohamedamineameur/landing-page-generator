import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { deepMergeJson, isRecord, isUuid, jsonError, sanitizePayload } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    pageId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const { pageId } = await context.params;

    if (!isUuid(pageId)) {
      return jsonError("Le pageId doit etre un UUID valide.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: page, error } = await supabase
      .from("pages")
      .select("id, project_id, is_effective, payload, created_at")
      .eq("id", pageId)
      .maybeSingle();

    if (error) {
      return jsonError(error.message, 500);
    }

    if (!page) {
      return jsonError("Page introuvable.", 404);
    }

    return NextResponse.json({
      id: page.id,
      projectId: page.project_id,
      isEffective: page.is_effective,
      payload: page.payload,
      createdAt: page.created_at,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de recuperer la page.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const { pageId } = await context.params;

    if (!isUuid(pageId)) {
      return jsonError("Le pageId doit etre un UUID valide.");
    }

    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      return jsonError("Le corps de la requete est invalide.");
    }

    const payloadUpdate = sanitizePayload(body.payload);

    if (!payloadUpdate) {
      return jsonError("Le payload est requis et doit etre un JSON valide.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: currentPage, error: currentError } = await supabase
      .from("pages")
      .select("id, project_id, is_effective, payload, created_at")
      .eq("id", pageId)
      .maybeSingle();

    if (currentError) {
      return jsonError(currentError.message, 500);
    }

    if (!currentPage) {
      return jsonError("Page introuvable.", 404);
    }

    const nextPayload = deepMergeJson(currentPage.payload, payloadUpdate);

    const { error: disableError } = await supabase
      .from("pages")
      .update({ is_effective: false })
      .eq("project_id", currentPage.project_id)
      .eq("is_effective", true);

    if (disableError) {
      return jsonError(disableError.message, 500);
    }

    const { data: nextPage, error: insertError } = await supabase
      .from("pages")
      .insert({
        project_id: currentPage.project_id,
        payload: nextPayload,
        is_effective: true,
      })
      .select("id, project_id, is_effective, payload, created_at")
      .single();

    if (insertError) {
      return jsonError(insertError.message, 500);
    }

    return NextResponse.json({
      id: nextPage.id,
      projectId: nextPage.project_id,
      isEffective: nextPage.is_effective,
      payload: nextPage.payload,
      createdAt: nextPage.created_at,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Impossible de creer une nouvelle version de la page.",
      500,
    );
  }
}
