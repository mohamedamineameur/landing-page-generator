"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "unavailable"; reason?: string }
  | { status: "error"; message: string };

type CacheEntry = { state: AvailabilityState; expiresAt: number };

const DEFAULT_TTL_MS = 30_000;

function now() {
  return Date.now();
}

async function requestJson<T>(url: string) {
  const response = await fetch(url, { credentials: "include" });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "La requete a echoue.");
  }
  return payload;
}

export function useAvailability(params: {
  kind: "username" | "projectName";
  value: string;
  debounceMs?: number;
  ttlMs?: number;
}) {
  const debounceMs = params.debounceMs ?? 250;
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;

  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const inflight = useRef<Map<string, Promise<AvailabilityState>>>(new Map());
  const [state, setState] = useState<AvailabilityState>({ status: "idle" });

  const key = useMemo(() => `${params.kind}:${params.value.trim().toLowerCase()}`, [params.kind, params.value]);

  useEffect(() => {
    const trimmed = params.value.trim();
    if (!trimmed) {
      setState({ status: "idle" });
      return;
    }

    const cached = cache.current.get(key);
    if (cached && cached.expiresAt > now()) {
      setState(cached.state);
      return;
    }

    setState({ status: "checking" });

    const handle = window.setTimeout(() => {
      const existing = inflight.current.get(key);
      if (existing) {
        existing.then((next) => setState(next)).catch((e) => {
          setState({ status: "error", message: e instanceof Error ? e.message : "Erreur inconnue." });
        });
        return;
      }

      const promise = (async () => {
        try {
          if (params.kind === "username") {
            const data = await requestJson<{ available: boolean; reason?: string }>(
              `/api/availability/username?username=${encodeURIComponent(trimmed)}`,
            );
            return data.available
              ? ({ status: "available" } as const)
              : ({ status: "unavailable", reason: data.reason } as const);
          }

          const data = await requestJson<{ available: boolean; reason?: string }>(
            `/api/availability/project-name?name=${encodeURIComponent(trimmed)}`,
          );
          return data.available
            ? ({ status: "available" } as const)
            : ({ status: "unavailable", reason: data.reason } as const);
        } catch (e) {
          return { status: "error", message: e instanceof Error ? e.message : "Erreur inconnue." } as const;
        } finally {
          inflight.current.delete(key);
        }
      })();

      inflight.current.set(key, promise);
      void promise.then((next) => {
        cache.current.set(key, { state: next, expiresAt: now() + ttlMs });
        setState(next);
      });
    }, debounceMs);

    return () => {
      window.clearTimeout(handle);
    };
  }, [debounceMs, key, params.kind, params.value, ttlMs]);

  return state;
}

