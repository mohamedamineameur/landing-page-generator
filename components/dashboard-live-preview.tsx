"use client";

import { useEffect, useState } from "react";
import {
  PageRuntimeView,
  type RuntimePagePayload,
} from "@/components/page-runtime-view";

type DashboardPreviewMessage = {
  type: "dashboard-preview:update";
  page: RuntimePagePayload;
};

type DashboardPreviewReadyMessage = {
  type: "dashboard-preview:ready";
};

function isPreviewMessage(value: unknown): value is DashboardPreviewMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Partial<DashboardPreviewMessage>;
  return message.type === "dashboard-preview:update" && Boolean(message.page);
}

export function DashboardLivePreview() {
  const [page, setPage] = useState<RuntimePagePayload | null>(null);

  useEffect(() => {
    window.parent.postMessage({ type: "dashboard-preview:ready" } satisfies DashboardPreviewReadyMessage, window.location.origin);

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (!isPreviewMessage(event.data)) {
        return;
      }

      setPage(event.data.page);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!page) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] px-6 text-center">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Apercu en preparation</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Le rendu telephone va apparaitre ici des reception de la page.
          </p>
        </div>
      </div>
    );
  }

  return <PageRuntimeView page={page} />;
}
