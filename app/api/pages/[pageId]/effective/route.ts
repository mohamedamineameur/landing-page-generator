import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isUuid, jsonError } from "@/lib/api-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    pageId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
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
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("id, project_id, is_effective, payload, created_at")
      .eq("id", pageId)
      .maybeSingle();

    if (pageError) {
      return jsonError(pageError.message, 500);
    }

    if (!page) {
      return jsonError("Page introuvable.", 404);
    }

    const { error: disableError } = await supabase
      .from("pages")
      .update({ is_effective: false })
      .eq("project_id", page.project_id)
      .eq("is_effective", true);

    if (disableError) {
      return jsonError(disableError.message, 500);
    }

    const { data: effectivePage, error: updateError } = await supabase
      .from("pages")
      .update({ is_effective: true })
      .eq("id", page.id)
      .select("id, project_id, is_effective, payload, created_at")
      .single();

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    return NextResponse.json({
      id: effectivePage.id,
      projectId: effectivePage.project_id,
      isEffective: effectivePage.is_effective,
      payload: effectivePage.payload,
      createdAt: effectivePage.created_at,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Impossible de rendre cette page effective.",
      500,
    );
  }
}
