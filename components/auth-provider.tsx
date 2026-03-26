"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { RuntimePagePayload } from "@/components/page-runtime-view";

interface AuthUser {
  id: string;
  username: string;
  createdAt?: string | Date;
}

interface WorkspaceProject {
  id: string;
  name: string;
  userId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface WorkspaceState {
  user: AuthUser | null;
  projects: WorkspaceProject[];
  currentProject: WorkspaceProject | null;
  effectivePage: RuntimePagePayload | null;
  effectivePageMeta: {
    id: string;
    isEffective?: boolean;
    createdAt?: string | Date;
  } | null;
}

interface AuthContextValue extends WorkspaceState {
  loading: boolean;
  login: (payload: { username: string; password: string }) => Promise<void>;
  register: (payload: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    user: null,
    projects: [],
    currentProject: null,
    effectivePage: null,
    effectivePageMeta: null,
  });

  const refreshWorkspace = useCallback(async () => {
    try {
      const payload = await requestJson<WorkspaceState>("/api/me/workspace", {
        method: "GET",
      });

      setWorkspace({
        user: payload.user,
        projects: payload.projects ?? [],
        currentProject: payload.currentProject,
        effectivePage: payload.effectivePage,
        effectivePageMeta: payload.effectivePageMeta ?? null,
      });
    } catch {
      setWorkspace({
        user: null,
        projects: [],
        currentProject: null,
        effectivePage: null,
        effectivePageMeta: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  const login = useCallback(
    async (payload: { username: string; password: string }) => {
      await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const register = useCallback(
    async (payload: { username: string; password: string }) => {
      await requestJson("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const logout = useCallback(async () => {
    await requestJson("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });

    setWorkspace({
      user: null,
      projects: [],
      currentProject: null,
      effectivePage: null,
      effectivePageMeta: null,
    });
  }, []);

  const selectProject = useCallback(
    async (projectId: string) => {
      await requestJson("/api/projects/current", {
        method: "POST",
        body: JSON.stringify({ projectId }),
      });

      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      user: workspace.user,
      projects: workspace.projects,
      currentProject: workspace.currentProject,
      effectivePage: workspace.effectivePage,
      effectivePageMeta: workspace.effectivePageMeta,
      login,
      register,
      logout,
      refreshWorkspace,
      selectProject,
    }),
    [loading, login, logout, refreshWorkspace, selectProject, workspace],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider.");
  }

  return context;
}
