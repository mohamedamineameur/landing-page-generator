import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { deepMergeJson, isRecord, isUuid, jsonError, sanitizePayload } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import { findOwnedPage } from "@/lib/ownership";
import { getSequelize } from "@/lib/sequelize";

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

    await syncDatabase();
    const page = await findOwnedPage(auth.user.userId, pageId);

    if (!page) {
      return jsonError("Page introuvable.", 404);
    }

    return NextResponse.json(page);
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

    await syncDatabase();
    const { Page } = getModels();
    const nextPage = await getSequelize().transaction(async (transaction) => {
      const currentPage = await findOwnedPage(auth.user.userId, pageId, { transaction });

      if (!currentPage) {
        return null;
      }

      const nextPayload = deepMergeJson(currentPage.payload, payloadUpdate);

      await Page.update(
        { isEffective: false },
        {
          where: { projectId: currentPage.projectId },
          transaction,
        },
      );

      return Page.create(
        {
          projectId: currentPage.projectId,
          payload: nextPayload,
          isEffective: true,
        },
        { transaction },
      );
    });

    if (!nextPage) {
      return jsonError("Page introuvable.", 404);
    }

    return NextResponse.json(nextPage);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Impossible de creer une nouvelle version de la page.",
      500,
    );
  }
}
