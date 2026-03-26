import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isUuid, jsonError } from "@/lib/api-utils";
import { getEffectivePageForProject, jsonServerError } from "@/lib/workspace";

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

    const page = await getEffectivePageForProject(auth.user.userId, projectId);

    if (!page) {
      return jsonError("Projet introuvable.", 404);
    }

    return NextResponse.json({
      project: page.project,
      page: page.effectivePage,
      pageMeta: page.effectivePageRecord
        ? {
            id: page.effectivePageRecord.id,
            isEffective: page.effectivePageRecord.isEffective,
            createdAt: page.effectivePageRecord.createdAt,
          }
        : null,
    });
  } catch (error) {
    return jsonServerError(error, "Impossible de charger la page effective.");
  }
}
