import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isUuid, jsonError } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import { findOwnedPage } from "@/lib/ownership";
import { getSequelize } from "@/lib/sequelize";

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

    await syncDatabase();
    const { Page } = getModels();
    const effectivePage = await getSequelize().transaction(async (transaction) => {
      const page = await findOwnedPage(auth.user.userId, pageId, { transaction });

      if (!page) {
        return null;
      }

      await Page.update(
        { isEffective: false },
        {
          where: { projectId: page.projectId },
          transaction,
        },
      );

      page.isEffective = true;
      await page.save({ transaction });

      return page;
    });

    if (!effectivePage) {
      return jsonError("Page introuvable.", 404);
    }

    return NextResponse.json(effectivePage);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Impossible de rendre cette page effective.",
      500,
    );
  }
}
