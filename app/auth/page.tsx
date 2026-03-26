"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function AuthPage() {
  const { loading, login, projects, register, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nextPath = useMemo(() => searchParams.get("next") || "/projects", [searchParams]);
  const redirectPath = useMemo(() => {
    if (!user) {
      return nextPath;
    }

    return projects.length === 0 ? "/onboarding" : nextPath;
  }, [nextPath, projects.length, user]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectPath);
    }
  }, [loading, redirectPath, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login({ username, password });
      } else {
        await register({ username, password });
      }

    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Impossible de finaliser l'authentification.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            href="/"
          >
            Retour a l'accueil
          </Link>
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Capturia Workspace
            </span>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Connecte-toi pour proteger ton espace d'edition
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Chaque utilisateur travaille maintenant sur ses propres projets et son propre historique de pages.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="flex rounded-full bg-slate-100 p-1">
            <button
              className={cx(
                "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition",
                mode === "login" ? "bg-slate-950 text-white" : "text-slate-600",
              )}
              onClick={() => setMode("login")}
              type="button"
            >
              Connexion
            </button>
            <button
              className={cx(
                "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition",
                mode === "register" ? "bg-slate-950 text-white" : "text-slate-600",
              )}
              onClick={() => setMode("register")}
              type="button"
            >
              Inscription
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">Username</span>
              <input
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                minLength={3}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="amine"
                required
                value={username}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">Mot de passe</span>
              <input
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="minimum 8 caracteres"
                required
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#2563eb)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || submitting}
              type="submit"
            >
              {submitting
                ? "Traitement..."
                : mode === "login"
                  ? "Se connecter"
                  : "Creer mon compte"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
