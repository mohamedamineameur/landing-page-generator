import { redirect } from "next/navigation";
import { loadAuthenticatedWorkspace } from "@/lib/load-runtime-page";

export const dynamic = "force-dynamic";

export default async function EditionPage() {
  const workspace = await loadAuthenticatedWorkspace();

  if (workspace && !workspace.currentProject) {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}
