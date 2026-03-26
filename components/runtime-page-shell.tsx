"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DynamicPageRenderer, type PageSection } from "@/component-registry";
import {
  PageInlineEditorDock,
  PageInlineEditorModal,
  PageInlineEditorProvider,
  type PageEditorPathSegment,
} from "@/components/page-inline-editor";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  PageLocalizationProvider,
  type PageLocalizationContextValue,
} from "@/components/page-localization-provider";
import { authorizedFetch } from "@/lib/client-api";

interface RuntimePageLocalization {
  locale?: string;
  direction?: "ltr" | "rtl";
  isRTL?: boolean;
  supportedLocales?: string[];
  translationContext?: string;
  translationsEnabled?: boolean;
}

function isLocaleLikeKey(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["src", "alt", "url"].includes(normalized)) {
    return false;
  }

  return normalized === "default" || /^[a-z]{2,3}([_-][a-zA-Z]{2,4})?$/.test(normalized);
}

function isLocalizedTextRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([key, nestedValue]) => isLocaleLikeKey(key) && typeof nestedValue === "string");
}

function pickLocalizedText(value: Record<string, string>, locale: string, supportedLocales: string[]) {
  const normalizedLocale = locale.toLowerCase();
  const baseLocale = normalizedLocale.split("-")[0];
  const localeCandidates = [
    normalizedLocale,
    baseLocale,
    ...supportedLocales.map((item) => item.toLowerCase()),
    ...supportedLocales.map((item) => item.toLowerCase().split("-")[0]),
    "default",
  ];

  for (const candidate of localeCandidates) {
    const exactEntry = Object.entries(value).find(([key]) => key.toLowerCase() === candidate);
    if (exactEntry?.[1]?.trim()) {
      return exactEntry[1];
    }
  }

  return Object.values(value).find((item) => item.trim()) ?? "";
}

function resolveLocalizedValue<TValue>(value: TValue, locale: string, supportedLocales: string[]): TValue {
  if (Array.isArray(value)) {
    return value.map((item) => resolveLocalizedValue(item, locale, supportedLocales)) as TValue;
  }

  if (isLocalizedTextRecord(value)) {
    return pickLocalizedText(value, locale, supportedLocales) as TValue;
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        resolveLocalizedValue(nestedValue, locale, supportedLocales),
      ]),
    ) as TValue;
  }

  return value;
}

function inferDirection(locale: string, fallbackDirection?: "ltr" | "rtl", fallbackIsRTL?: boolean) {
  if (fallbackDirection === "rtl" || fallbackIsRTL) {
    const language = locale.toLowerCase().split("-")[0];
    if (["ar", "fa", "he", "ur"].includes(language)) {
      return "rtl";
    }
  }

  return ["ar", "fa", "he", "ur"].includes(locale.toLowerCase().split("-")[0]) ? "rtl" : "ltr";
}

function collectImageSources(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectImageSources(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, nestedValue]) => {
      if (key === "src" && typeof nestedValue === "string") {
        const trimmed = nestedValue.trim();
        return trimmed ? [trimmed] : [];
      }

      return collectImageSources(nestedValue);
    });
  }

  return [];
}

export function RuntimePageShell({
  page,
  style,
  editable = false,
}: {
  page: {
    slug: string;
    title: string | Record<string, string>;
    sections: PageSection[];
    localization?: RuntimePageLocalization;
    theme?: unknown;
  };
  style: React.CSSProperties;
  editable?: boolean;
}) {
  const [draftPage, setDraftPage] = useState(page);
  const [editMode, setEditMode] = useState(false);
  const [activeField, setActiveField] = useState<{
    path: PageEditorPathSegment[];
    label: string;
    value: string;
    multiline?: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const localization = draftPage.localization;
  const initialLocale = localization?.locale ?? localization?.supportedLocales?.[0] ?? "fr";
  const supportedLocales =
    localization?.supportedLocales && localization.supportedLocales.length > 0
      ? localization.supportedLocales
      : [initialLocale];
  const [activeLocale, setActiveLocale] = useState(initialLocale);
  const direction = inferDirection(activeLocale, localization?.direction, localization?.isRTL);

  useEffect(() => {
    setDraftPage(page);
  }, [page]);

  useEffect(() => {
    setActiveLocale((currentLocale) =>
      supportedLocales.includes(currentLocale) ? currentLocale : initialLocale,
    );
  }, [initialLocale, supportedLocales]);

  const resolvedTitle = useMemo(
    () => resolveLocalizedValue(draftPage.title, activeLocale, supportedLocales),
    [activeLocale, draftPage.title, supportedLocales],
  );
  const resolvedSections = useMemo(
    () => resolveLocalizedValue(draftPage.sections, activeLocale, supportedLocales) as PageSection[],
    [activeLocale, draftPage.sections, supportedLocales],
  );
  const imageOptions = useMemo(
    () => Array.from(new Set(collectImageSources(draftPage.sections))),
    [draftPage.sections],
  );
  const hasNavbar = useMemo(
    () => resolvedSections.some((section) => section.type === "navbar"),
    [resolvedSections],
  );
  const localizationValue: PageLocalizationContextValue = {
    locale: activeLocale,
    direction,
    isRTL: direction === "rtl",
    supportedLocales,
    translationContext: localization?.translationContext,
    translationsEnabled:
      localization?.translationsEnabled ?? Boolean(localization?.supportedLocales && localization.supportedLocales.length > 1),
    setLocale: setActiveLocale,
  };

  const saveField = useCallback(
    async (path: PageEditorPathSegment[], nextValue: string) => {
      const previousPage = draftPage;
      const nextPage = updatePageField(previousPage, path, nextValue, activeLocale);
      setDraftPage(nextPage);
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await authorizedFetch("/api/page", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nextPage),
        });

        const payload = (await response.json()) as {
          error?: string;
          slug?: string;
          title?: string | Record<string, string>;
          sections?: PageSection[];
          localization?: RuntimePageLocalization;
          theme?: unknown;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "La sauvegarde a echoue.");
        }

        setDraftPage(payload as typeof draftPage);
        setActiveField(null);
        setLastSavedAt(Date.now());
      } catch (error) {
        setDraftPage(previousPage);
        setSaveError(
          error instanceof Error ? error.message : "Une erreur inconnue est survenue pendant la sauvegarde.",
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [activeLocale, draftPage],
  );

  const editorValue = useMemo(
    () => ({
      enabled: editable,
      editMode,
      toggleEditMode: () => {
        setEditMode((current) => !current);
        setSaveError(null);
      },
      activeField,
      openEditor: (field: { path: PageEditorPathSegment[]; label: string; value: string; multiline?: boolean }) => {
        setActiveField(field);
        setSaveError(null);
      },
      closeEditor: () => {
        if (!isSaving) {
          setActiveField(null);
        }
      },
      saveField: async (nextValue: string) => {
        if (!activeField) return;
        await saveField(activeField.path, nextValue);
      },
      uploadImage: undefined,
      isSaving,
      saveError,
      lastSavedAt,
      imageOptions,
    }),
    [activeField, editMode, editable, imageOptions, isSaving, lastSavedAt, saveError, saveField],
  );

  useEffect(() => {
    document.documentElement.lang = activeLocale;
    document.documentElement.dir = direction;
  }, [activeLocale, direction]);

  return (
    <PageLocalizationProvider value={localizationValue}>
      <PageInlineEditorProvider value={editorValue}>
        <div className="page-shell" data-page-title={typeof resolvedTitle === "string" ? resolvedTitle : ""} dir={direction} lang={activeLocale} style={style}>
          {editable ? <PageInlineEditorDock /> : null}
          {localizationValue.translationsEnabled && supportedLocales.length > 1 && !hasNavbar ? (
            <div className="pointer-events-none fixed right-4 top-4 z-[70]">
              <LanguageSwitcher floating />
            </div>
          ) : null}
          <DynamicPageRenderer sections={resolvedSections} />
          {editable ? <PageInlineEditorModal /> : null}
        </div>
      </PageInlineEditorProvider>
    </PageLocalizationProvider>
  );
}

function updatePageField<TPage extends { [key: string]: unknown }>(
  page: TPage,
  path: PageEditorPathSegment[],
  nextValue: string,
  locale: string,
) {
  const clonedPage = JSON.parse(JSON.stringify(page)) as TPage;
  let cursor: unknown = clonedPage;

  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];

    if (typeof segment === "number") {
      cursor = Array.isArray(cursor) ? cursor[segment] : undefined;
    } else if (typeof cursor === "object" && cursor !== null) {
      cursor = (cursor as Record<string, unknown>)[segment];
    }
  }

  const targetKey = path[path.length - 1];

  if (!cursor || typeof cursor !== "object") {
    return clonedPage;
  }

  const targetRecord = cursor as Record<string, unknown>;
  const currentValue = targetRecord[String(targetKey)];

  if (isLocalizedTextRecord(currentValue)) {
    targetRecord[String(targetKey)] = {
      ...currentValue,
      [locale]: nextValue,
    };
  } else {
    targetRecord[String(targetKey)] = nextValue;
  }

  return clonedPage;
}
