import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isRecord, isUuid, jsonError, sanitizePayload } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import {
  findOwnedProject,
  listOwnedPagesForProject,
} from "@/lib/ownership";
import { getSequelize } from "@/lib/sequelize";

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

    await syncDatabase();
    const project = await findOwnedProject(auth.user.userId, projectId);

    if (!project) {
      return jsonError("Projet introuvable.", 404);
    }

    const pages = await listOwnedPagesForProject(auth.user.userId, projectId);

    return NextResponse.json(pages);
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

    await syncDatabase();
    const { Page } = getModels();
    const page = await getSequelize().transaction(async (transaction) => {
      const project = await findOwnedProject(auth.user.userId, projectId, { transaction });

      if (!project) {
        return null;
      }

      if (isEffective) {
        await Page.update(
          { isEffective: false },
          {
            where: { projectId },
            transaction,
          },
        );
      }

      return Page.create(
        {
          projectId,
          payload,
          isEffective,
        },
        { transaction },
      );
    });

    if (!page) {
      return jsonError("Projet introuvable.", 404);
    }

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de creer la page.", 500);
  }
}
