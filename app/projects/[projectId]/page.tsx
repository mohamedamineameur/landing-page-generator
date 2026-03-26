"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { WorkspacePageShell } from "@/components/workspace-page-shell";
import { authorizedFetch } from "@/lib/client-api";

interface ProjectPageRecord {
  id: string;
  projectId: string;
  isEffective: boolean;
  createdAt: string;
  payload: {
    title?: string | Record<string, string>;
    slug?: string;
  };
}

function getPageTitle(page: ProjectPageRecord) {
  const title = page.payload?.title;

  if (typeof title === "string" && title.trim()) {
    return title;
  }

  if (title && typeof title === "object") {
    for (const value of Object.values(title)) {
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return "Page sans titre";
}

function toProjectSlug(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProjectPagesPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { currentProject, projects, selectProject } = useAuth();
  const [pages, setPages] = useState<ProjectPageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPages() {
      try {
        setLoading(true);
        setError(null);

        await selectProject(params.projectId);

        const response = await authorizedFetch(`/api/projects/${params.projectId}/pages`, {
          method: "GET",
        });
        const payload = (await response.json()) as ProjectPageRecord[] & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Impossible de charger les pages du projet.");
        }

        const nextPages = Array.isArray(payload) ? payload : [];

        if (nextPages.length === 0) {
          router.replace(`/projects/${params.projectId}/start`);
          return;
        }

        setPages(nextPages);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger les pages du projet.");
      } finally {
        setLoading(false);
      }
    }

    void loadPages();
  }, [params.projectId, router, selectProject]);

  const project = projects.find((item) => item.id === params.projectId) ?? currentProject;
  const currentProjectViewHref = toProjectSlug(project?.name ?? null)
    ? `/view/${toProjectSlug(project?.name ?? null)}`
    : null;

  return (
    <WorkspacePageShell>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              href="/projects"
            >
              Retour aux projets
            </Link>

            <div className="mt-6">
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Historique des pages
              </span>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
                {project?.name ?? "Projet"}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Clique ensuite sur les outils d'edition pour continuer le travail sur ce projet.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              {loading ? (
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Chargement des pages...
                </div>
              ) : error ? (
                <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                  {error}
                </div>
              ) : pages.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Aucune page n'a encore ete creee pour ce projet.
                </div>
              ) : (
                pages.map((page) => (
                  <div
                    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                    key={page.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold text-slate-900">{getPageTitle(page)}</p>
                          {page.isEffective ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                              Effective
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{page.id}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Creee le {new Date(page.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      {!page.isEffective ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                            href={`/view/${page.id}`}
                            target="_blank"
                          >
                            Voir la page
                          </Link>
                          <button
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                            onClick={async () => {
                              const response = await authorizedFetch(`/api/pages/${page.id}/effective`, {
                                method: "POST",
                              });
                              const payload = (await response.json()) as { error?: string };

                              if (!response.ok) {
                                setError(payload.error ?? "Impossible de rendre cette page effective.");
                                return;
                              }

                              router.refresh();
                              const pagesResponse = await authorizedFetch(`/api/projects/${params.projectId}/pages`);
                              const nextPages = (await pagesResponse.json()) as ProjectPageRecord[];
                              setPages(Array.isArray(nextPages) ? nextPages : []);
                            }}
                            type="button"
                          >
                            Rendre effective
                          </button>
                        </div>
                      ) : (
                        <Link
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                          href={currentProjectViewHref ?? `/view/${page.id}`}
                          target="_blank"
                        >
                          Voir la page
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-6 self-start">
            <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Continuer</p>
              <div className="mt-4 grid gap-3">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                  href="/dashboard"
                >
                  Ouvrir le dashboard
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                  href="/prompt"
                >
                  Generer une nouvelle page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspacePageShell>
  );
}
