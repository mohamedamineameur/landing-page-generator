"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useAvailability } from "@/lib/use-availability";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
  const usernameAvailability = useAvailability({ kind: "username", value: username });
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

  async function signInWithGoogle() {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de se connecter avec Google.");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Funnel Workspace
            </span>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Connecte-toi pour proteger ton espace d&apos;edition
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

          <div className="mt-6 space-y-4">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || submitting}
              onClick={() => void signInWithGoogle()}
              type="button"
            >
              Continuer avec Google
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">ou</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">Username</span>
              <input
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                minLength={3}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="John Doe"
                required
                value={username}
              />
            </label>

            {mode === "register" && username.trim() ? (
              <div
                className={
                  usernameAvailability.status === "available"
                    ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    : usernameAvailability.status === "unavailable"
                      ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                      : usernameAvailability.status === "error"
                        ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                }
              >
                {usernameAvailability.status === "checking"
                  ? "Verification du username..."
                  : usernameAvailability.status === "available"
                    ? "Username disponible."
                    : usernameAvailability.status === "unavailable"
                      ? "Ce username est deja pris."
                      : usernameAvailability.status === "error"
                        ? usernameAvailability.message
                        : null}
              </div>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">Mot de passe</span>
              <input
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="John Doe"
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
              disabled={
                loading ||
                submitting ||
                (mode === "register" &&
                  (usernameAvailability.status === "checking" || usernameAvailability.status === "unavailable"))
              }
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
    </div>
  );
}
