import Link from "next/link";
import { redirect } from "next/navigation";
import { loadAuthenticatedWorkspace, loadRuntimePage } from "@/lib/load-runtime-page";
import { DashboardVisualEditor } from "@/components/dashboard-visual-editor";
import { WorkspacePageShell } from "@/components/workspace-page-shell";
import { syncDatabase } from "@/lib/models";
import { listOwnedPhotos } from "@/lib/ownership";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await loadAuthenticatedWorkspace();

  if (workspace && !workspace.currentProject) {
    redirect("/onboarding");
  }

  const runtimePage = await loadRuntimePage();
  let availableImages: string[] = [];

  if (workspace?.user?.id) {
    await syncDatabase();
    const photos = await listOwnedPhotos(workspace.user.id);
    availableImages = photos
      .map((photo) => photo.link)
      .filter((link) => typeof link === "string" && link.trim().length > 0);
  }

  return (
    <WorkspacePageShell>
      {runtimePage ? (
        <DashboardVisualEditor availableImages={availableImages} initialPage={runtimePage} />
      ) : (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white/92 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
            <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Projet vide
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Aucune page n&apos;a encore ete creee
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Genere d&apos;abord une premiere page pour ce projet, puis tu pourras la modifier ici.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                href="/prompt"
              >
                Generer une premiere page
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                href="/projects"
              >
                Retour aux projets
              </Link>
            </div>
          </div>
        </div>
      )}
    </WorkspacePageShell>
  );
}
