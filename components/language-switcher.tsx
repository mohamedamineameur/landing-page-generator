"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { PageLocalizationContext } from "@/components/page-localization-provider";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getLocaleShortLabel(locale: string) {
  return locale.toUpperCase().split("-")[0];
}

function getLocaleLongLabel(locale: string) {
  const normalizedLocale = locale.toLowerCase().split("-")[0];
  switch (normalizedLocale) {
    case "fr":
      return "Francais";
    case "en":
      return "English";
    case "ar":
      return "العربية";
    case "es":
      return "Espanol";
    case "de":
      return "Deutsch";
    case "it":
      return "Italiano";
    case "pt":
      return "Portugues";
    default:
      return locale.toUpperCase();
  }
}

export function LanguageSwitcher({
  mobile = false,
  floating = false,
  onSelect,
}: {
  mobile?: boolean;
  floating?: boolean;
  onSelect?: () => void;
}) {
  const { locale, supportedLocales, translationsEnabled, setLocale } = useContext(PageLocalizationContext);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () =>
      supportedLocales.map((item) => ({
        value: item,
        shortLabel: getLocaleShortLabel(item),
        longLabel: getLocaleLongLabel(item),
      })),
    [supportedLocales],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!translationsEnabled || supportedLocales.length < 2) {
    return null;
  }

  return (
    <div
      className={cx(
        "relative",
        mobile ? "w-full" : "",
        floating ? "pointer-events-auto" : "",
      )}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={cx(
          "inline-flex items-center gap-2 border border-[color-mix(in_srgb,var(--border)_82%,white)] bg-[color-mix(in_srgb,var(--surface)_96%,white)] text-[var(--text)] shadow-[0_8px_22px_rgba(15,23,42,0.08)] transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface)_88%,white)]",
          mobile ? "min-h-11 w-full justify-between rounded-[var(--radius-button)] px-4" : "h-10 rounded-full px-3",
          floating && "backdrop-blur",
        )}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--surface-alt)_72%,white)] text-[var(--text-muted)]">
          <svg
            aria-hidden
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a15 15 0 0 1 0 18" />
            <path d="M12 3a15 15 0 0 0 0 18" />
          </svg>
        </span>
        <span className={cx("font-semibold text-[var(--text)]", mobile ? "text-sm" : "text-xs uppercase tracking-[0.12em]")}>
          {mobile ? getLocaleLongLabel(locale) : getLocaleShortLabel(locale)}
        </span>
        <svg
          aria-hidden
          className={cx("h-3.5 w-3.5 text-[var(--text-muted)] transition", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          className={cx(
            "absolute z-[80] min-w-[168px] overflow-hidden border border-[color-mix(in_srgb,var(--border)_82%,white)] bg-[color-mix(in_srgb,var(--surface)_98%,white)] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur",
            mobile ? "left-0 right-0 top-[calc(100%+10px)] rounded-[var(--radius-card)]" : "right-0 top-[calc(100%+10px)] rounded-2xl",
          )}
          role="menu"
        >
          {items.map((item) => {
            const active = item.value === locale;
            return (
              <button
                className={cx(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                  active
                    ? "bg-[color-mix(in_srgb,var(--primary)_14%,white)] font-semibold text-[var(--primary)]"
                    : "text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--surface-alt)_72%,white)]",
                )}
                key={item.value}
                onClick={() => {
                  setLocale(item.value);
                  setOpen(false);
                  onSelect?.();
                }}
                role="menuitem"
                type="button"
              >
                <span>{item.longLabel}</span>
                {active ? (
                  <svg
                    aria-hidden
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
