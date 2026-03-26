import { NextResponse } from "next/server";
import { type RuntimePagePayload } from "@/components/page-runtime-view";
import { DEFAULT_RUNTIME_PAGE } from "@/lib/default-page";
import { getModels, syncDatabase } from "@/lib/models";
import {
  findEffectiveOwnedPageForProject,
  findOwnedProject,
  listOwnedProjects,
} from "@/lib/ownership";
import { normalizePagePayloadForRuntime, validatePagePayload } from "@/lib/page-dsl";
import { getSequelize } from "@/lib/sequelize";

function normalizeStoredPagePayload(value: unknown) {
  return normalizePagePayloadForRuntime(value) as RuntimePagePayload;
}

export function validateRuntimePagePayload(value: unknown) {
  const normalizedPage = normalizeStoredPagePayload(value);
  const validation = validatePagePayload(normalizedPage);

  if (!validation.success) {
    throw new Error(validation.errors[0] ?? "JSON de page invalide.");
  }

  return validation.data as RuntimePagePayload;
}

export function jsonServerError(error: unknown, fallbackMessage: string) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    { status: 500 },
  );
}

export function getDefaultRuntimePage() {
  return validateRuntimePagePayload(DEFAULT_RUNTIME_PAGE);
}

export async function getWorkspaceForUser(userId: string, preferredProjectId?: string | null) {
  await syncDatabase();
  const { User } = getModels();

  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }

  return getSequelize().transaction(async (transaction) => {
    const projects = await listOwnedProjects(userId, { transaction });

    const currentProject =
      (preferredProjectId ? projects.find((project) => project.id === preferredProjectId) : null) ??
      projects[0] ??
      null;
    const effectivePageRecord = currentProject
      ? await findEffectiveOwnedPageForProject(userId, currentProject.id, { transaction })
      : null;

    return {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
      projects,
      currentProject,
      effectivePageRecord,
      effectivePage: effectivePageRecord ? normalizeStoredPagePayload(effectivePageRecord.payload) : null,
    };
  });
}

export async function getEffectivePageForProject(userId: string, projectId: string) {
  await syncDatabase();

  return getSequelize().transaction(async (transaction) => {
    const project = await findOwnedProject(userId, projectId, { transaction });

    if (!project) {
      return null;
    }

    const effectivePageRecord = await findEffectiveOwnedPageForProject(userId, project.id, { transaction });

    return {
      project,
      effectivePageRecord,
      effectivePage: effectivePageRecord ? normalizeStoredPagePayload(effectivePageRecord.payload) : null,
    };
  });
}

export async function getCurrentWorkspacePage(userId: string, preferredProjectId?: string | null) {
  const workspace = await getWorkspaceForUser(userId, preferredProjectId);

  return {
    currentProject: workspace.currentProject,
    effectivePageRecord: workspace.effectivePageRecord,
    effectivePage: workspace.effectivePage,
  };
}

export async function createPageVersionForProject(
  userId: string,
  projectId: string,
  value: unknown,
) {
  const normalizedPage = validateRuntimePagePayload(value);

  await syncDatabase();
  const { Page } = getModels();

  return getSequelize().transaction(async (transaction) => {
    const project = await findOwnedProject(userId, projectId, { transaction });

    if (!project) {
      return null;
    }

    await Page.update(
      { isEffective: false },
      {
        where: { projectId },
        transaction,
      },
    );

    const pageRecord = await Page.create(
      {
        projectId,
        payload: normalizedPage,
        isEffective: true,
      },
      { transaction },
    );

    return {
      project,
      pageRecord,
      page: normalizeStoredPagePayload(pageRecord.payload),
    };
  });
}
