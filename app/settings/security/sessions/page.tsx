"use client";

import { useEffect, useMemo, useState } from "react";

type SessionRow = {
  id: string;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
  ip: string | null;
  userAgent: string | null;
  isCurrent: boolean;
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "La requete a echoue.");
  }

  return payload;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

export default function SessionsSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const activeCount = useMemo(() => rows.filter((r) => !r.revokedAt).length, [rows]);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const data = await requestJson<SessionRow[]>("/api/sessions", { method: "GET" });
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les sessions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function revoke(sessionId: string) {
    setRevokingId(sessionId);
    setError(null);
    try {
      await requestJson("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de revoquer la session.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Securite
              </span>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Sessions actives
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                Visualise les connexions et revoque une session en un clic. {activeCount} session(s) active(s).
              </p>
            </div>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-70"
              disabled={loading}
              onClick={() => void refresh()}
              type="button"
            >
              Rafraichir
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-1 gap-0 divide-y divide-slate-200">
            {loading ? (
              <div className="p-6 text-sm text-slate-600">Chargement...</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-slate-600">Aucune session.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {row.isCurrent ? "Session actuelle" : "Session"}
                        </span>
                        {row.revokedAt ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Revoquee
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="grid gap-1 text-sm text-slate-600">
                        <div>IP: {row.ip ?? "—"}</div>
                        <div>User-Agent: {row.userAgent ?? "—"}</div>
                        <div>Creee: {formatDate(row.createdAt)}</div>
                        <div>Derniere activite: {formatDate(row.lastSeenAt)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={!!row.revokedAt || row.isCurrent || revokingId === row.id}
                        onClick={() => void revoke(row.id)}
                        type="button"
                      >
                        {revokingId === row.id ? "Revocation..." : "Revoquer"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

