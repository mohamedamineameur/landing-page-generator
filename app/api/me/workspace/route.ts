import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuthenticatedUser } from "@/lib/auth";
import { CURRENT_PROJECT_COOKIE_NAME } from "@/lib/project-selection";
import { getWorkspaceForUser, jsonServerError } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const cookieStore = await cookies();
    const preferredProjectId = cookieStore.get(CURRENT_PROJECT_COOKIE_NAME)?.value ?? null;
    const workspace = await getWorkspaceForUser(auth.user.userId, preferredProjectId);

    return NextResponse.json({
      user: workspace.user,
      projects: workspace.projects,
      currentProject: workspace.currentProject,
      effectivePage: workspace.effectivePage,
      effectivePageMeta: workspace.effectivePageRecord
        ? {
            id: workspace.effectivePageRecord.id,
            isEffective: workspace.effectivePageRecord.isEffective,
            createdAt: workspace.effectivePageRecord.createdAt,
          }
        : null,
    });
  } catch (error) {
    return jsonServerError(error, "Impossible de charger l'espace de travail.");
  }
}
