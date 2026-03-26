"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { authorizedFetch } from "@/lib/client-api";
import { formatProjectNameInput, normalizeProjectName } from "@/lib/project-name";

export default function OnboardingPage() {
  const router = useRouter();
  const { loading, projects, selectProject, user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !creating && user && projects.length > 0) {
      router.replace("/projects");
    }
  }, [creating, loading, projects.length, router, user]);

  async function createFirstProject() {
    const name = normalizeProjectName(projectName);

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
      router.replace(`/projects/${payload.id}/start`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Impossible de creer le projet.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center rounded-[32px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="max-w-sm">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Premiere connexion
            </span>
            <p className="mt-5 text-lg font-semibold text-slate-900">Preparation de ton espace</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Quelques secondes suffisent pour initialiser ton premier projet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center">
        <div className="w-full rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-10">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/"
          >
            Retour a l'accueil
          </Link>

          <div className="mt-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                Premiere connexion
              </span>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl md:text-6xl">
              Cree un projet.
              <br />
              Commence proprement.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Donne simplement un nom a ton projet. On t'emmene ensuite vers la creation de ta premiere page, sans
              etape technique inutile.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              "1. Nommer le projet",
              "2. Creer une premiere page",
              "3. Ajuster dans le dashboard",
            ].map((item) => (
              <div
                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-xl grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">Nom du projet</span>
              <input
                className="min-h-14 rounded-[20px] border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                onChange={(event) => setProjectName(formatProjectNameInput(event.target.value))}
                placeholder="Ex: coach-sportif-prise-de-rendez-vous"
                value={projectName}
              />
            </label>

            <p className="text-sm leading-6 text-slate-500">
              Ce nom sera aussi utilise dans ton URL, donc il est automatiquement formate avec des tirets.
            </p>

            {error ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-slate-950 px-6 py-4 text-base font-semibold text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={creating}
              onClick={createFirstProject}
              type="button"
            >
              {creating ? "Creation du projet..." : "Creer mon projet"}
            </button>

            <p className="text-center text-sm font-medium text-slate-600">
              Tu passeras directement a l'etape suivante apres le clic.
            </p>

            <p className="text-xs leading-5 text-slate-500">
              Tu pourras tout modifier ensuite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
