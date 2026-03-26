"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const navItemClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition hover:-translate-y-0.5";

const activeNavItemClass =
  "border-slate-950 bg-slate-950 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

const inactiveNavItemClass =
  "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white";

export function WorkspacePageShell({ children }: { children: ReactNode }) {
  const { currentProject, loading, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const projectsActive = pathname === "/projects" || pathname?.startsWith("/projects/");
  const dashboardActive = pathname === "/dashboard";
  const promptActive = pathname === "/prompt";

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [loading, pathname, router, user]);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[95] max-w-[calc(100vw-32px)]">
        <div className="pointer-events-auto rounded-[24px] border border-white/50 bg-white/92 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900">
              {loading ? "Session..." : user ? `@${user.username}` : "Hors connexion"}
            </span>
            {currentProject ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {currentProject.name}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              className={cx(
                navItemClass,
                projectsActive ? activeNavItemClass : inactiveNavItemClass,
              )}
              href="/projects"
              style={projectsActive ? { color: "#f8fafc", WebkitTextFillColor: "#f8fafc" } : undefined}
            >
              Projets
            </Link>
            <Link
              className={cx(
                navItemClass,
                dashboardActive ? activeNavItemClass : inactiveNavItemClass,
              )}
              href="/dashboard"
              style={dashboardActive ? { color: "#f8fafc", WebkitTextFillColor: "#f8fafc" } : undefined}
            >
              Dashboard
            </Link>
            <Link
              className={cx(
                navItemClass,
                promptActive ? activeNavItemClass : inactiveNavItemClass,
              )}
              href="/prompt"
              style={promptActive ? { color: "#f8fafc", WebkitTextFillColor: "#f8fafc" } : undefined}
            >
              Prompt
            </Link>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-white"
              onClick={async () => {
                await logout();
                router.replace("/auth");
              }}
              type="button"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
