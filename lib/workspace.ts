import { NextResponse } from "next/server";
import { type RuntimePagePayload } from "@/components/page-runtime-view";
import { DEFAULT_RUNTIME_PAGE } from "@/lib/default-page";
import { normalizePagePayloadForRuntime, validatePagePayload } from "@/lib/page-dsl";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const supabase = await createSupabaseServerClient();

  const [{ data: profile, error: profileError }, { data: projects, error: projectsError }] =
    await Promise.all([
      supabase.from("profiles").select("id, username, created_at").eq("id", userId).maybeSingle(),
      supabase.from("projects").select("id, name, user_id, created_at, updated_at").order("created_at", {
        ascending: false,
      }),
    ]);

  if (profileError) {
    throw new Error(profileError.message);
  }
  if (!profile) {
    throw new Error("Utilisateur introuvable.");
  }
  if (projectsError) {
    throw new Error(projectsError.message);
  }

  const currentProject =
    (preferredProjectId ? projects?.find((project) => project.id === preferredProjectId) : null) ??
    projects?.[0] ??
    null;

  const { data: effectivePageRecord, error: pageError } = currentProject
    ? await supabase
        .from("pages")
        .select("id, project_id, is_effective, payload, created_at")
        .eq("project_id", currentProject.id)
        .eq("is_effective", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };

  if (pageError) {
    throw new Error(pageError.message);
  }

  return {
    user: {
      id: profile.id,
      username: profile.username,
      createdAt: profile.created_at,
    },
    projects: (projects ?? []).map((project) => ({
      id: project.id,
      name: project.name,
      userId: project.user_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    })),
    currentProject: currentProject
      ? {
          id: currentProject.id,
          name: currentProject.name,
          userId: currentProject.user_id,
          createdAt: currentProject.created_at,
          updatedAt: currentProject.updated_at,
        }
      : null,
    effectivePageRecord: effectivePageRecord
      ? {
          id: effectivePageRecord.id,
          projectId: effectivePageRecord.project_id,
          isEffective: effectivePageRecord.is_effective,
          payload: effectivePageRecord.payload,
          createdAt: effectivePageRecord.created_at,
        }
      : null,
    effectivePage: effectivePageRecord ? normalizeStoredPagePayload(effectivePageRecord.payload) : null,
  };
}

export async function getEffectivePageForProject(userId: string, projectId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, user_id, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(projectError.message);
  }
  if (!project || project.user_id !== userId) {
    return null;
  }

  const { data: effectivePageRecord, error: pageError } = await supabase
    .from("pages")
    .select("id, project_id, is_effective, payload, created_at")
    .eq("project_id", project.id)
    .eq("is_effective", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pageError) {
    throw new Error(pageError.message);
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      userId: project.user_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
    effectivePageRecord: effectivePageRecord
      ? {
          id: effectivePageRecord.id,
          projectId: effectivePageRecord.project_id,
          isEffective: effectivePageRecord.is_effective,
          payload: effectivePageRecord.payload,
          createdAt: effectivePageRecord.created_at,
        }
      : null,
    effectivePage: effectivePageRecord ? normalizeStoredPagePayload(effectivePageRecord.payload) : null,
  };
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

  const supabase = await createSupabaseServerClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, user_id, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(projectError.message);
  }
  if (!project || project.user_id !== userId) {
    return null;
  }

  const { error: disableError } = await supabase
    .from("pages")
    .update({ is_effective: false })
    .eq("project_id", projectId)
    .eq("is_effective", true);

  if (disableError) {
    throw new Error(disableError.message);
  }

  const { data: pageRecord, error: insertError } = await supabase
    .from("pages")
    .insert({
      project_id: projectId,
      payload: normalizedPage,
      is_effective: true,
    })
    .select("id, project_id, is_effective, payload, created_at")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      userId: project.user_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
    pageRecord: {
      id: pageRecord.id,
      projectId: pageRecord.project_id,
      isEffective: pageRecord.is_effective,
      payload: pageRecord.payload,
      createdAt: pageRecord.created_at,
    },
    page: normalizeStoredPagePayload(pageRecord.payload),
  };
}
