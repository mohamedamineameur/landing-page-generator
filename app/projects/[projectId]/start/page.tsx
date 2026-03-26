"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { WorkspacePageShell } from "@/components/workspace-page-shell";
import { authorizedFetch } from "@/lib/client-api";

interface ProjectPageRecord {
  id: string;
}

const START_OPTIONS = [
  {
    href: "/prompt?first=1&mode=guided",
    badge: "Recommande",
    badgeClassName: "bg-emerald-600 text-white",
    title: "Etre guide pas a pas",
    description:
      "Si tu preferes etre accompagne, le mode guide te pose quelques questions simples puis prepare automatiquement une premiere page claire et coherente.",
    details: ["Le plus simple pour commencer", "Tres peu de texte a ecrire", "Ideal si tu ne sais pas quoi demander"],
    buttonLabel: "Commencer le mode guide",
    cardClassName:
      "border-emerald-200 bg-[linear-gradient(180deg,#f0fdf4_0%,#ffffff_100%)] shadow-[0_24px_50px_rgba(16,185,129,0.12)]",
    buttonClassName: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    href: "/prompt?first=1&mode=prompt",
    badge: "Libre",
    badgeClassName: "bg-slate-950 text-white",
    title: "Juste decrire mon idee",
    description:
      "Si tu veux juste decrire ton idee avec tes mots, l'IA se charge de creer une premiere page a partir de ta demande.",
    details: ["Plus rapide si ton idee est deja claire", "Tu gardes une liberte totale", "Pratique si tu sais deja quoi dire"],
    buttonLabel: "Ecrire ma demande",
    cardClassName: "border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
    buttonClassName: "border-slate-950 bg-slate-950 text-white",
  },
] as const;

export default function ProjectStartPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { currentProject, projects, selectProject } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPages, setHasPages] = useState(false);

  useEffect(() => {
    async function loadProjectState() {
      try {
        setLoading(true);
        setError(null);

        await selectProject(params.projectId);

        const response = await authorizedFetch(`/api/projects/${params.projectId}/pages`, {
          method: "GET",
        });
        const payload = (await response.json()) as ProjectPageRecord[] & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Impossible de charger le projet.");
        }

        const pages = Array.isArray(payload) ? payload : [];

        if (pages.length > 0) {
          setHasPages(true);
          router.replace(`/projects/${params.projectId}`);
          return;
        }

        setHasPages(false);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger le projet.");
      } finally {
        setLoading(false);
      }
    }

    void loadProjectState();
  }, [params.projectId, router, selectProject]);

  const project = projects.find((item) => item.id === params.projectId) ?? currentProject;

  return (
    <WorkspacePageShell>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur md:p-8">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              href="/projects"
            >
              Retour aux projets
            </Link>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  Etape 1
                </span>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Premiere page a creer
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
                Creons la premiere page de <span className="text-emerald-700">{project?.name ?? "ton projet"}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Choisis la facon de commencer. Dans tous les cas, tu pourras modifier ensuite les textes, les couleurs,
                les images et les sections sans rien casser.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium">
                  Aucun risque, tout reste modifiable
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium">
                  Quelques minutes suffisent
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium">
                  Une page est creee pour ce projet
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {loading ? (
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Preparation du projet...
                </div>
              ) : error ? (
                <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
                  <p className="text-sm font-semibold text-rose-700">Impossible de charger ce projet.</p>
                  <p className="mt-2 text-sm leading-6 text-rose-700/90">{error}</p>
                  <button
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    onClick={() => router.refresh()}
                    type="button"
                  >
                    Reessayer
                  </button>
                </div>
              ) : hasPages ? null : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {START_OPTIONS.map((option) => (
                    <Link
                      key={option.href}
                      className={`group rounded-[30px] border p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)] md:p-7 ${option.cardClassName}`}
                      href={option.href}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${option.badgeClassName}`}>
                          {option.badge}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500">
                          2 a 3 min
                        </span>
                      </div>
                      <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-[2rem]">
                        {option.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                        {option.description}
                      </p>
                      <div className="mt-6 grid gap-2">
                        {option.details.map((detail) => (
                          <div key={detail} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                      <div
                        className={`mt-7 inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition group-hover:scale-[1.01] ${option.buttonClassName}`}
                      >
                        {option.buttonLabel}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {!loading && !error && !hasPages ? (
              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 text-sm leading-6 text-slate-600">
                Si tu hesites, commence par <span className="font-semibold text-emerald-700">le mode guide</span> :
                c&apos;est le plus simple pour obtenir rapidement une premiere page propre, meme sans savoir quoi ecrire.
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 self-start">
            <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Ce qui va se passer</p>
              <div className="mt-5 grid gap-4">
                {[
                  {
                    step: "1",
                    title: "Tu choisis une facon de commencer",
                    description: "Soit tu es guide pas a pas, soit tu ecris directement ton besoin.",
                  },
                  {
                    step: "2",
                    title: "Une premiere page est creee pour toi",
                    description: "L'application prepare automatiquement une version complete de ta page.",
                  },
                  {
                    step: "3",
                    title: "Tu ajustes le resultat tranquillement",
                    description: "Tu peux ensuite modifier le texte, les visuels, les couleurs et les sections.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)] p-6 shadow-[0_24px_70px_rgba(16,185,129,0.10)]">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Bon a savoir</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Tu n&apos;as pas besoin de tout savoir maintenant
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Le but ici est seulement de lancer une bonne premiere version. Tu pourras affiner ensuite le texte,
                changer le style, ajouter des sections et remplacer les images.
              </p>
              <div className="mt-5 rounded-[22px] border border-white/70 bg-white/80 p-4 text-sm leading-6 text-slate-700">
                Conseil : si c&apos;est ta premiere page, choisis le mode guide. C&apos;est celui qui demande le moins
                d&apos;effort et qui evite de partir d&apos;une page vide.
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspacePageShell>
  );
}
