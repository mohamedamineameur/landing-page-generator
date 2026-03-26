import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { generatePageWithImage } from "@/lib/openai-page-generator";
import { buildPromptWithConstraints } from "@/lib/page-generation-constraints";
import { normalizePagePayloadForRuntime, validatePagePayload, type PagePayload } from "@/lib/page-dsl";
import { createPageVersionForProject, getCurrentWorkspacePage } from "@/lib/workspace";

export const runtime = "nodejs";

interface ThemeConstraint {
  name?: string;
  cornerStyle?: "sharp" | "balanced" | "rounded";
  palette: {
    primary: string;
    secondary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    muted: string;
  };
}

interface LocalizationConstraint {
  locale?: string;
  direction?: "ltr" | "rtl";
  isRTL?: boolean;
  supportedLocales?: string[];
  translationContext?: string;
  translationsEnabled?: boolean;
}

function sanitizePromptInput(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 3000);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function isLocaleString(value: unknown): value is string {
  return typeof value === "string" && /^[a-z]{2,3}([_-][a-zA-Z]{2,4})?$/.test(value.trim());
}

function normalizeLocale(value: string) {
  const [language, region] = value.trim().replace(/_/g, "-").split("-");
  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
}

function inferIsRtl(locale?: string) {
  if (!locale) return false;
  return ["ar", "fa", "he", "ur"].includes(normalizeLocale(locale).split("-")[0]);
}

function isDarkColor(value: string) {
  const normalized = value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    : value;
  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance < 0.5;
}

function normalizeCornerStyle(value: unknown): ThemeConstraint["cornerStyle"] | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  const compact = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (
    compact === "sharp" ||
    compact.includes("sharp") ||
    compact.includes("square") ||
    compact.includes("net") ||
    compact.includes("carre") ||
    compact.includes("angle droit") ||
    compact.includes("angles droits") ||
    compact.includes("pas arrondi") ||
    compact.includes("non arrondi") ||
    compact.includes("not rounded") ||
    compact.includes("no rounded") ||
    compact.includes("straight corner") ||
    compact.includes("straight corners")
  ) {
    return "sharp";
  }

  if (
    compact === "balanced" ||
    compact.includes("balanced") ||
    compact.includes("equilibre") ||
    compact.includes("equilibree") ||
    compact.includes("standard") ||
    compact.includes("normal")
  ) {
    return "balanced";
  }

  if (
    compact === "rounded" ||
    compact.includes("rounded") ||
    compact.includes("round") ||
    compact.includes("arrondi") ||
    compact.includes("souple") ||
    compact.includes("soft")
  ) {
    return "rounded";
  }

  return undefined;
}

function sanitizeThemeConstraint(value: unknown): ThemeConstraint | null {
  if (!isObject(value) || !isObject(value.palette)) {
    return null;
  }

  const palette = value.palette;
  const primary = isHexColor(palette.primary) ? palette.primary : null;
  const secondary = isHexColor(palette.secondary) ? palette.secondary : null;
  const background = isHexColor(palette.background) ? palette.background : null;
  const textPrimary = isHexColor(palette.textPrimary) ? palette.textPrimary : null;
  const textSecondary = isHexColor(palette.textSecondary) ? palette.textSecondary : null;
  const accent = isHexColor(palette.accent) ? palette.accent : null;
  const muted = isHexColor(palette.muted) ? palette.muted : null;

  if (!primary || !secondary || !background || !textPrimary || !textSecondary || !accent || !muted) {
    return null;
  }

  return {
    name: typeof value.name === "string" ? value.name.trim().slice(0, 80) : undefined,
    cornerStyle: normalizeCornerStyle(value.cornerStyle),
    palette: {
      primary,
      secondary,
      background,
      textPrimary,
      textSecondary,
      accent,
      muted,
    },
  };
}

function sanitizeLocalizationConstraint(value: unknown): LocalizationConstraint | null {
  if (!isObject(value)) {
    return null;
  }

  const locale = isLocaleString(value.locale) ? normalizeLocale(value.locale) : undefined;
  const supportedLocales = Array.isArray(value.supportedLocales)
    ? Array.from(
        new Set(
          value.supportedLocales
            .filter((localeValue): localeValue is string => isLocaleString(localeValue))
            .map((localeValue) => normalizeLocale(localeValue)),
        ),
      )
    : locale
      ? [locale]
      : [];
  const inferredDirection =
    value.direction === "rtl" || value.direction === "ltr"
      ? value.direction
      : ((typeof value.isRTL === "boolean" ? value.isRTL : inferIsRtl(locale ?? supportedLocales[0])) ? "rtl" : "ltr");

  if (!locale && supportedLocales.length === 0 && typeof value.translationContext !== "string") {
    return null;
  }

  return {
    ...(locale ? { locale } : {}),
    ...(supportedLocales.length > 0 ? { supportedLocales } : {}),
    ...(typeof value.translationContext === "string" && value.translationContext.trim()
      ? { translationContext: value.translationContext.trim().slice(0, 500) }
      : {}),
    direction: inferredDirection,
    isRTL: inferredDirection === "rtl",
    translationsEnabled:
      typeof value.translationsEnabled === "boolean" ? value.translationsEnabled : supportedLocales.length > 1,
  };
}

function applyThemeConstraint(page: PagePayload, themeConstraint: ThemeConstraint | null) {
  if (!themeConstraint) {
    return page;
  }

  const darkBackground = isDarkColor(themeConstraint.palette.background);
  const primaryIsDark = isDarkColor(themeConstraint.palette.primary);

  const normalized = normalizePagePayloadForRuntime({
    ...page,
    theme: {
      name: themeConstraint.name ?? page.theme?.name,
      cornerStyle: themeConstraint.cornerStyle ?? page.theme?.cornerStyle,
      primaryColor: themeConstraint.palette.primary,
      secondaryColor: themeConstraint.palette.secondary,
      accentColor: themeConstraint.palette.accent,
      backgroundColor: themeConstraint.palette.background,
      surfaceColor: darkBackground ? "#111827" : "#ffffff",
      surfaceAltColor: darkBackground ? themeConstraint.palette.muted : themeConstraint.palette.muted,
      textColor: themeConstraint.palette.textPrimary,
      mutedTextColor: themeConstraint.palette.textSecondary,
      borderColor: darkBackground ? "#334155" : "#dbe4f0",
      buttonTextColor: primaryIsDark ? "#ffffff" : "#0f172a",
      successColor: page.theme?.successColor ?? "#15803d",
      warningColor: page.theme?.warningColor ?? "#d97706",
      ...(themeConstraint.name ? { name: themeConstraint.name } : {}),
      ...(themeConstraint.cornerStyle ? { cornerStyle: themeConstraint.cornerStyle } : {}),
      palette: themeConstraint.palette,
    },
  });
  const validation = validatePagePayload(normalized);

  if (!validation.success) {
    throw new Error(`La palette imposee produit un theme invalide: ${validation.errors.join(" | ")}`);
  }

  return validation.data;
}

function applyLocalizationConstraint(page: PagePayload, localizationConstraint: LocalizationConstraint | null) {
  if (!localizationConstraint) {
    return page;
  }

  const normalized = normalizePagePayloadForRuntime({
    ...page,
    localization: {
      ...page.localization,
      ...localizationConstraint,
      direction: localizationConstraint.direction,
      isRTL: localizationConstraint.isRTL,
      translationsEnabled: localizationConstraint.translationsEnabled,
    },
  });
  const validation = validatePagePayload(normalized);

  if (!validation.success) {
    throw new Error(`La configuration de langue imposee est invalide: ${validation.errors.join(" | ")}`);
  }

  return validation.data;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const body = (await request.json()) as {
      prompt?: unknown;
      themeConstraint?: unknown;
      localizationConstraint?: unknown;
    };
    const prompt = sanitizePromptInput(body.prompt);
    const themeConstraint = sanitizeThemeConstraint(body.themeConstraint);
    const localizationConstraint = sanitizeLocalizationConstraint(body.localizationConstraint);

    if (!prompt) {
      return NextResponse.json(
        { error: "Le prompt est requis." },
        { status: 400 },
      );
    }

    const constrainedPrompt = buildPromptWithConstraints(prompt, themeConstraint, localizationConstraint);
    const result = await generatePageWithImage(constrainedPrompt, auth.user.userId);
    const themedPage = applyThemeConstraint(result.page, themeConstraint);
    const page = applyLocalizationConstraint(themedPage, localizationConstraint);
    const workspace = await getCurrentWorkspacePage(auth.user.userId);

    if (!workspace.currentProject) {
      return NextResponse.json({ error: "Aucun projet courant. Cree d'abord ton premier projet." }, { status: 400 });
    }

    const createdVersion = await createPageVersionForProject(auth.user.userId, workspace.currentProject.id, page);

    return NextResponse.json({
      success: true,
      message: "La page et son image ont ete generees puis sauvegardees dans ton projet.",
      pageId: createdVersion?.pageRecord.id,
      page,
      images: result.images,
      imageDisplay: result.imageDisplay,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue est survenue pendant la generation.",
      },
      { status: 500 },
    );
  }
}
