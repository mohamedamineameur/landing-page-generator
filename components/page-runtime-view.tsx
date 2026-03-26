import type React from "react";
import type { PageSection } from "@/component-registry";
import { RuntimePageShell } from "@/components/runtime-page-shell";

interface PageTheme {
  name?: string;
  cornerStyle?: "sharp" | "balanced" | "rounded";
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  surfaceAltColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;
  buttonTextColor?: string;
  successColor?: string;
  warningColor?: string;
}

export interface RuntimePageLocalization {
  locale?: string;
  direction?: "ltr" | "rtl";
  isRTL?: boolean;
  supportedLocales?: string[];
  translationContext?: string;
  translationsEnabled?: boolean;
}

export interface RuntimePagePayload {
  slug: string;
  title: string | Record<string, string>;
  theme?: PageTheme;
  localization?: RuntimePageLocalization;
  sections: PageSection[];
}

function isDarkColor(color?: string) {
  if (!color) return false;

  const normalized =
    color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;

  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return false;

  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance < 0.5;
}

function getCornerTokens(cornerStyle?: PageTheme["cornerStyle"]) {
  switch (cornerStyle) {
    case "sharp":
      return {
        section: "18px",
        card: "12px",
        inner: "8px",
        button: "10px",
        chip: "10px",
      };
    case "rounded":
      return {
        section: "32px",
        card: "24px",
        inner: "18px",
        button: "999px",
        chip: "999px",
      };
    default:
      return {
        section: "24px",
        card: "18px",
        inner: "12px",
        button: "18px",
        chip: "18px",
      };
  }
}

export function PageRuntimeView({
  page,
  editable = false,
}: {
  page: RuntimePagePayload;
  editable?: boolean;
}) {
  const darkTheme = isDarkColor(page.theme?.backgroundColor);
  const cornerTokens = getCornerTokens(page.theme?.cornerStyle);
  const runtimeSurface =
    darkTheme &&
    page.theme?.surfaceColor &&
    page.theme?.primaryColor &&
    page.theme.surfaceColor.toLowerCase() === page.theme.primaryColor.toLowerCase()
      ? page.theme.surfaceAltColor ?? "#1f2937"
      : page.theme?.surfaceColor ?? (darkTheme ? "#111827" : "#ffffff");
  const runtimeSurfaceAlt = page.theme?.surfaceAltColor ?? (darkTheme ? "#1f2937" : "#eef4ff");

  return (
    <RuntimePageShell
      editable={editable}
      page={page}
      style={
        {
          background: `linear-gradient(180deg, ${page.theme?.backgroundColor ?? "#f8fafc"} 0%, ${runtimeSurfaceAlt} 100%)`,
          "--background": page.theme?.backgroundColor ?? "#f8fafc",
          "--surface": runtimeSurface,
          "--surface-alt": runtimeSurfaceAlt,
          "--surface-muted": darkTheme ? "#1f2937" : runtimeSurfaceAlt,
          "--text": page.theme?.textColor ?? "#0f172a",
          "--text-muted": page.theme?.mutedTextColor ?? "#475569",
          "--primary": page.theme?.primaryColor ?? "#2563eb",
          "--primary-dark": page.theme?.secondaryColor ?? page.theme?.primaryColor ?? "#1d4ed8",
          "--accent": page.theme?.accentColor ?? "#93c5fd",
          "--border": page.theme?.borderColor ?? "#dbe4f0",
          "--button-text": page.theme?.buttonTextColor ?? "#ffffff",
          "--success": page.theme?.successColor ?? "#166534",
          "--success-bg": darkTheme ? "#052e16" : "#f0fdf4",
          "--warning-bg": darkTheme ? "#3f2a13" : "#fff7ed",
          "--warning-text": page.theme?.warningColor ?? "#c58b4e",
          "--danger-bg": darkTheme ? "#3f1d1d" : "#fef2f2",
          "--danger-text": darkTheme ? "#fecaca" : "#991b1b",
          "--progress-track": darkTheme ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.08)",
          "--image-frame-bg": darkTheme ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
          "--shadow": darkTheme
            ? "0 18px 44px rgba(0, 0, 0, 0.34)"
            : "0 12px 32px rgba(15, 23, 42, 0.08)",
          colorScheme: darkTheme ? "dark" : "light",
          "--radius-section": cornerTokens.section,
          "--radius-card": cornerTokens.card,
          "--radius-inner": cornerTokens.inner,
          "--radius-button": cornerTokens.button,
          "--radius-chip": cornerTokens.chip,
        } as React.CSSProperties
      }
    />
  );
}
