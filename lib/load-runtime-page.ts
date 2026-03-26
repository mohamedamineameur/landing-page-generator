import { cookies, headers } from "next/headers";
import { CURRENT_PROJECT_COOKIE_NAME } from "@/lib/project-selection";
import { getCurrentWorkspacePage, getDefaultRuntimePage, getWorkspaceForUser } from "@/lib/workspace";

async function getAuthenticatedWorkspaceContext() {
  const requestHeaders = await headers();
  const authenticatedUserId = requestHeaders.get("x-auth-user-id");

  if (!authenticatedUserId) {
    return null;
  }

  const cookieStore = await cookies();
  const preferredProjectId = cookieStore.get(CURRENT_PROJECT_COOKIE_NAME)?.value ?? null;

  return {
    authenticatedUserId,
    preferredProjectId,
  };
}

export async function loadAuthenticatedWorkspace() {
  const context = await getAuthenticatedWorkspaceContext();

  if (!context) {
    return null;
  }

  return getWorkspaceForUser(context.authenticatedUserId, context.preferredProjectId);
}

export async function loadRuntimePage() {
  const context = await getAuthenticatedWorkspaceContext();

  if (context) {
    const workspacePage = await getCurrentWorkspacePage(context.authenticatedUserId, context.preferredProjectId);
    return workspacePage.effectivePage ?? null;
  }

  return getDefaultRuntimePage();
}
