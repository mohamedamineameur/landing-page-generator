"use client";

import { useEffect, useState } from "react";
import { PageRuntimeView, type RuntimePagePayload } from "@/components/page-runtime-view";
import { authorizedFetch } from "@/lib/client-api";

interface PageBuilderClientProps {
  endpoint: string;
}

export function PageBuilderClient({ endpoint }: PageBuilderClientProps) {
  const [page, setPage] = useState<RuntimePagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError(null);

        const response = await authorizedFetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Impossible de charger la page (${response.status}).`);
        }

        const payload = (await response.json()) as RuntimePagePayload;

        if (isMounted) {
          setPage(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Une erreur inconnue est survenue pendant le chargement.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  if (loading) {
    return (
      <div className="page-shell grid min-h-[100dvh] place-items-center px-4">
        <div className="page-loading text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
          <h2 className="text-2xl font-bold text-[var(--text)]">Chargement de la page dynamique</h2>
          <p className="mt-2 text-[var(--text-muted)]">
            Le JSON est en cours de recuperation puis sera rendu via le registre.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell px-4 py-10">
        <div className="page-error">
          <h2 className="text-2xl font-bold">Erreur de chargement</h2>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="page-shell px-4 py-10">
        <div className="page-empty">
          <h2 className="text-2xl font-bold text-[var(--text)]">Aucune page disponible</h2>
          <p className="mt-2 text-[var(--text-muted)]">
            La source JSON n&apos;a retourne aucune section exploitable.
          </p>
        </div>
      </div>
    );
  }

  return <PageRuntimeView page={page} />;
}
