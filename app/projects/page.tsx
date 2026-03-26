"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { WorkspacePageShell } from "@/components/workspace-page-shell";
import { authorizedFetch } from "@/lib/client-api";
import { formatProjectNameInput, normalizeProjectName } from "@/lib/project-name";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function ProjectsPage() {
  const { currentProject, loading, projects, selectProject } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sortedProjects = useMemo(() => [...projects], [projects]);

  useEffect(() => {
    if (!loading && projects.length === 0) {
      router.replace("/onboarding");
    }
  }, [loading, projects.length, router]);

  async function createProject() {
    const name = normalizeProjectName(newProjectName);

    if (!name) {
      setError("Le nom du projet est requis.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await authorizedFetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "Impossible de creer le projet.");
      }

      await selectProject(payload.id);
      setNewProjectName("");
      router.replace(`/projects/${payload.id}/start`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Impossible de creer le projet.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <WorkspacePageShell>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
            <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Mes projets
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Choisis d'abord ton projet
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Clique sur un projet pour voir son historique de pages et ouvrir ensuite l'edition ou la generation.
            </p>

            <div className="mt-8 grid gap-4">
              {loading ? (
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Chargement de tes projets...
                </div>
              ) : (
                sortedProjects.map((project) => (
                  <button
                    className={cx(
                      "rounded-[28px] border p-5 text-left transition hover:-translate-y-0.5",
                      currentProject?.id === project.id
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.24)]"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300",
                    )}
                    key={project.id}
                    onClick={async () => {
                      await selectProject(project.id);
                      router.push(`/projects/${project.id}/start`);
                    }}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold">{project.name}</p>
                        <p
                          className={cx(
                            "mt-1 text-sm",
                            currentProject?.id === project.id ? "text-slate-300" : "text-slate-500",
                          )}
                        >
                          {project.id}
                        </p>
                      </div>
                      <span
                        className={cx(
                          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                          currentProject?.id === project.id
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {currentProject?.id === project.id ? "Courant" : "Ouvrir"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-6 self-start">
            <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Nouveau projet</p>
              <div className="mt-4 grid gap-3">
                <input
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setNewProjectName(formatProjectNameInput(event.target.value))}
                  placeholder="Ex: funnel-ramadan-landing-saas"
                  value={newProjectName}
                />
                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#2563eb)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={creating}
                  onClick={createProject}
                  type="button"
                >
                  {creating ? "Creation..." : "Creer le projet"}
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Suite</p>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                <p>1. Choisis un projet.</p>
                <p>2. Ouvre son historique de pages.</p>
                <p>3. Depuis ce projet, lance ensuite le dashboard, le prompt ou l'edition.</p>
              </div>
              {currentProject ? (
                <Link
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                  href={`/projects/${currentProject.id}`}
                >
                  Ouvrir mon projet courant
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </WorkspacePageShell>
  );
}
