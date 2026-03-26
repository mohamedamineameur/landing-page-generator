"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { WorkspacePageShell } from "@/components/workspace-page-shell";
import { authorizedFetch } from "@/lib/client-api";
import { PALETTE_LIBRARY, paletteToTheme, type PalettePreviewDefinition } from "@/lib/palette-library";

interface GenerateResponse {
  success?: boolean;
  message?: string;
  error?: string;
  pageId?: string;
  page?: unknown;
  images?: Array<{ prompt?: string; alt?: string; target?: string }>;
}

const ROBOT_GIF_URL = "/robot.gif";
const GENERATION_INSIGHTS = [
  {
    category: "Conseil",
    title: "Une page efficace parle d'abord d'un resultat concret",
    description: "Le robot cherche a mettre en avant la promesse principale de ton offre pour que le visiteur comprenne vite ce qu'il gagne.",
  },
  {
    category: "Marketing",
    title: "La clarte convertit mieux que la complexite",
    description: "La structure est organisee pour guider l'oeil naturellement vers les benefices, les preuves et l'appel a l'action.",
  },
  {
    category: "Conversion",
    title: "Un bon hero doit donner envie d'aller plus loin",
    description: "Le titre principal, le sous-titre et le bouton sont penses pour capter l'attention des premieres secondes.",
  },
  {
    category: "Automatisation",
    title: "L'IA assemble les sections dans le bon ordre",
    description: "Elle prepare automatiquement une premiere version coherente pour eviter de partir d'une page vide.",
  },
  {
    category: "Reassurance",
    title: "Les preuves de confiance aident souvent a faire passer a l'action",
    description: "Le robot essaie d'integrer des elements rassurants comme des avantages clairs, une FAQ ou des signaux de credibilite.",
  },
  {
    category: "Design",
    title: "Le visuel sert surtout a rendre l'offre plus lisible",
    description: "Les couleurs, les espaces et le rythme de lecture sont ajustes pour garder une page agreable et facile a parcourir.",
  },
] as const;

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

const GUIDED_LANGUAGE_OPTIONS = [
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabe" },
];

const GUIDED_ACTIVITY_OPTIONS = [
  "SaaS",
  "Agence marketing",
  "Cabinet / service local",
  "E-commerce",
  "Formation / coaching",
  "Autre",
];

const GUIDED_OFFER_OPTIONS = [
  "Prise de rendez-vous",
  "Demande de devis",
  "Essai gratuit",
  "Inscription",
  "Telechargement",
  "Autre",
];

const GUIDED_AUDIENCE_OPTIONS = [
  "PME",
  "Independants",
  "Grand public",
  "B2B",
  "B2C",
  "Autre",
];

const GUIDED_OBJECTIVE_OPTIONS = [
  "Generer des leads",
  "Obtenir des appels",
  "Recuperer des inscriptions",
  "Vendre un produit",
  "Presenter une offre",
  "Autre",
];

const GUIDED_STYLE_OPTIONS = [
  "Moderne",
  "Premium",
  "Minimaliste",
  "Rassurant",
  "Dynamique",
  "Autre",
];

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function toProjectSlug(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildGuidedPrompt(values: {
  activity: string;
  offer: string;
  audience: string;
  objective: string;
  style: string;
}) {
  const details = [
    values.activity.trim() ? `Activite: ${values.activity.trim()}.` : "",
    values.offer.trim() ? `Offre ou service: ${values.offer.trim()}.` : "",
    values.audience.trim() ? `Cible: ${values.audience.trim()}.` : "",
    values.objective.trim() ? `Objectif principal: ${values.objective.trim()}.` : "",
    values.style.trim() ? `Style visuel et ton: ${values.style.trim()}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "Cree une landing page complete et convaincante en francais.",
    details,
    "Je veux au minimum un hero fort, une section avantages, une section de reassurance, une FAQ et un formulaire de contact tres visible.",
    "La page doit etre claire, moderne, orientee conversion et facile a modifier ensuite.",
  ]
    .filter(Boolean)
    .join(" ");
}

function resolveGuidedChoice(choice: string, customValue: string) {
  return choice === "Autre" ? customValue.trim() : choice.trim();
}

function getPreviewCornerRadius(cornerStyle: "sharp" | "balanced" | "rounded") {
  switch (cornerStyle) {
    case "sharp":
      return {
        frame: "18px",
        card: "10px",
        chip: "10px",
        button: "10px",
      };
    case "rounded":
      return {
        frame: "32px",
        card: "24px",
        chip: "999px",
        button: "999px",
      };
    default:
      return {
        frame: "24px",
        card: "16px",
        chip: "18px",
        button: "18px",
      };
  }
}

export default function PromptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProject, loading: authLoading } = useAuth();
  const initialMode = searchParams.get("mode") === "guided" ? "guided" : "prompt";
  const isFirstProjectFlow = searchParams.get("first") === "1";
  const [generationMode, setGenerationMode] = useState<"prompt" | "guided">(initialMode);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedPageId, setGeneratedPageId] = useState<string | null>(null);
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const [guidedActivityChoice, setGuidedActivityChoice] = useState(GUIDED_ACTIVITY_OPTIONS[0]);
  const [guidedActivityCustom, setGuidedActivityCustom] = useState("");
  const [guidedOfferChoice, setGuidedOfferChoice] = useState(GUIDED_OFFER_OPTIONS[0]);
  const [guidedOfferCustom, setGuidedOfferCustom] = useState("");
  const [guidedAudienceChoice, setGuidedAudienceChoice] = useState(GUIDED_AUDIENCE_OPTIONS[0]);
  const [guidedAudienceCustom, setGuidedAudienceCustom] = useState("");
  const [guidedObjectiveChoice, setGuidedObjectiveChoice] = useState(GUIDED_OBJECTIVE_OPTIONS[0]);
  const [guidedObjectiveCustom, setGuidedObjectiveCustom] = useState("");
  const [guidedStyleChoice, setGuidedStyleChoice] = useState(GUIDED_STYLE_OPTIONS[0]);
  const [guidedStyleCustom, setGuidedStyleCustom] = useState("");
  const [guidedLocale, setGuidedLocale] = useState("fr");
  const [guidedDirectionMode, setGuidedDirectionMode] = useState<"auto" | "ltr" | "rtl">("auto");
  const [guidedTranslationsEnabled, setGuidedTranslationsEnabled] = useState(false);
  const [guidedSecondaryLocale, setGuidedSecondaryLocale] = useState("en");
  const [guidedTranslationContext, setGuidedTranslationContext] = useState("");
  const [guidedPaletteId, setGuidedPaletteId] = useState(PALETTE_LIBRARY[0]?.value ?? "");
  const [guidedCornerStyle, setGuidedCornerStyle] = useState<"sharp" | "balanced" | "rounded">("balanced");
  const selectedPalette =
    PALETTE_LIBRARY.find((palette) => palette.value === guidedPaletteId) ?? PALETTE_LIBRARY[0];
  const selectedPaletteTheme = useMemo(() => {
    if (!selectedPalette) {
      return null;
    }

    return paletteToTheme(selectedPalette as PalettePreviewDefinition);
  }, [selectedPalette]);
  const guidedThemeConstraint = useMemo<ThemeConstraint | null>(() => {
    if (!selectedPaletteTheme) {
      return null;
    }

    return {
      name: selectedPalette.value,
      cornerStyle: guidedCornerStyle,
      palette: selectedPaletteTheme.palette,
    };
  }, [guidedCornerStyle, selectedPalette, selectedPaletteTheme]);
  const guidedLocalizationConstraint = useMemo<LocalizationConstraint | null>(() => {
    const supportedLocales = Array.from(
      new Set(
        [guidedLocale, guidedTranslationsEnabled ? guidedSecondaryLocale : null]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );
    const inferredDirection =
      guidedDirectionMode === "auto"
        ? ["ar", "fa", "he", "ur"].includes(guidedLocale.split("-")[0]) ? "rtl" : "ltr"
        : guidedDirectionMode;

    return {
      locale: guidedLocale,
      direction: inferredDirection,
      isRTL: inferredDirection === "rtl",
      supportedLocales,
      translationContext: guidedTranslationContext.trim() || undefined,
      translationsEnabled: guidedTranslationsEnabled,
    };
  }, [
    guidedDirectionMode,
    guidedLocale,
    guidedSecondaryLocale,
    guidedTranslationContext,
    guidedTranslationsEnabled,
  ]);
  const guidedActivity = useMemo(
    () => resolveGuidedChoice(guidedActivityChoice, guidedActivityCustom),
    [guidedActivityChoice, guidedActivityCustom],
  );
  const guidedOffer = useMemo(
    () => resolveGuidedChoice(guidedOfferChoice, guidedOfferCustom),
    [guidedOfferChoice, guidedOfferCustom],
  );
  const guidedAudience = useMemo(
    () => resolveGuidedChoice(guidedAudienceChoice, guidedAudienceCustom),
    [guidedAudienceChoice, guidedAudienceCustom],
  );
  const guidedObjective = useMemo(
    () => resolveGuidedChoice(guidedObjectiveChoice, guidedObjectiveCustom),
    [guidedObjectiveChoice, guidedObjectiveCustom],
  );
  const guidedStyle = useMemo(
    () => resolveGuidedChoice(guidedStyleChoice, guidedStyleCustom),
    [guidedStyleChoice, guidedStyleCustom],
  );
  const guidedPreviewRadii = useMemo(() => getPreviewCornerRadius(guidedCornerStyle), [guidedCornerStyle]);
  const finalPrompt = useMemo(
    () =>
      generationMode === "guided"
        ? buildGuidedPrompt({
            activity: guidedActivity,
            offer: guidedOffer,
            audience: guidedAudience,
            objective: guidedObjective,
            style: guidedStyle,
          })
        : prompt,
    [generationMode, guidedActivity, guidedOffer, guidedAudience, guidedObjective, guidedStyle, prompt],
  );

  const promptLength = useMemo(() => finalPrompt.trim().length, [finalPrompt]);
  const currentProjectViewHref = useMemo(() => {
    const projectSlug = toProjectSlug(currentProject?.name ?? null);
    if (projectSlug) {
      return `/view/${projectSlug}`;
    }

    return generatedPageId ? `/view/${generatedPageId}` : "/projects";
  }, [currentProject?.name, generatedPageId]);

  useEffect(() => {
    if (!authLoading && !currentProject) {
      router.replace("/onboarding");
    }
  }, [authLoading, currentProject, router]);

  useEffect(() => {
    if (!isFirstProjectFlow || generationMode !== "prompt" || prompt.trim()) {
      return;
    }

    setPrompt(
      "Cree une landing page moderne et rassurante pour mon offre. Je veux un hero impactant, une section avantages, des preuves de confiance, une FAQ et un formulaire de contact tres visible.",
    );
  }, [generationMode, isFirstProjectFlow, prompt]);

  useEffect(() => {
    if (!isGenerating) {
      setActiveInsightIndex(0);
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const interval = window.setInterval(() => {
      setActiveInsightIndex((currentIndex) => (currentIndex + 1) % GENERATION_INSIGHTS.length);
    }, 7800);

    return () => {
      window.clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, [isGenerating]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentProject) {
      setError("Cree d'abord ton premier projet avant de lancer une generation.");
      return;
    }

    if (generationMode === "guided" && (!guidedActivity || !guidedOffer || !guidedObjective)) {
      setError("Choisis au moins l'activite, l'offre et l'objectif pour generer la page.");
      return;
    }

    if (!finalPrompt.trim()) {
      setError("Le prompt est requis.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedPageId(null);

    try {
      const response = await authorizedFetch("/api/generate-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt.trim(),
          themeConstraint: generationMode === "guided" ? guidedThemeConstraint : undefined,
          localizationConstraint: generationMode === "guided" ? guidedLocalizationConstraint : undefined,
        }),
      });

      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || !payload.success || !payload.page) {
        throw new Error(payload.error ?? "La generation a echoue.");
      }

      const nextSuccessMessage = isFirstProjectFlow
        ? "Ta premiere page est prete. Redirection vers le dashboard..."
        : payload.message ?? "La page a ete generee avec succes.";
      setSuccessMessage(nextSuccessMessage);
      setGeneratedPageId(payload.pageId ?? null);
      setGeneratedImages(
        Array.isArray(payload.images)
          ? payload.images
              .map((image) => image.alt ?? image.prompt ?? image.target ?? "")
              .filter(Boolean)
          : [],
      );
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Une erreur inconnue est survenue.");
    } finally {
      setIsGenerating(false);
    }
  }

  const guidedSidebarContent = (
    <>
      <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Apercu rapide</p>
        <div
          className="mt-4 border p-4 shadow-sm"
          style={{
            borderRadius: guidedPreviewRadii.frame,
            borderColor: selectedPaletteTheme?.palette.muted,
            backgroundColor: selectedPaletteTheme?.palette.background,
          }}
        >
          <div
            className="p-5 shadow-sm"
            style={{
              borderRadius: guidedPreviewRadii.card,
              background: `linear-gradient(135deg, ${selectedPaletteTheme?.palette.primary} 0%, ${selectedPaletteTheme?.palette.secondary} 70%, ${selectedPaletteTheme?.palette.accent} 100%)`,
              color: selectedPaletteTheme?.palette.background,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{
                  borderRadius: guidedPreviewRadii.chip,
                  backgroundColor: "rgba(255,255,255,0.16)",
                }}
              >
                {guidedActivity || "Activite"}
              </span>
              <span
                className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  borderRadius: guidedPreviewRadii.chip,
                  backgroundColor: "rgba(255,255,255,0.10)",
                }}
              >
                {guidedLocalizationConstraint?.direction === "rtl" ? "RTL" : "LTR"}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-4 w-1/3 rounded-full bg-white/25" />
              <div className="h-8 w-5/6 rounded-full bg-white/90" />
              <div className="h-4 w-full rounded-full bg-white/25" />
              <div className="h-4 w-2/3 rounded-full bg-white/25" />
            </div>
            <div className="mt-5 flex gap-3">
              <div
                className="h-10 w-32"
                style={{
                  borderRadius: guidedPreviewRadii.button,
                  backgroundColor: selectedPaletteTheme?.palette.accent,
                }}
              />
              <div
                className="h-10 w-24 border"
                style={{
                  borderRadius: guidedPreviewRadii.button,
                  borderColor: "rgba(255,255,255,0.35)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              />
            </div>
          </div>

          <div
            className="mt-4 border p-4 shadow-sm"
            style={{
              borderRadius: guidedPreviewRadii.card,
              borderColor: selectedPaletteTheme?.palette.muted,
              backgroundColor: "#ffffff",
            }}
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <div
                  className="h-4 w-32 rounded-full"
                  style={{ backgroundColor: selectedPaletteTheme?.palette.textPrimary }}
                />
                <div
                  className="h-3 w-full rounded-full"
                  style={{ backgroundColor: selectedPaletteTheme?.palette.muted }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  selectedPaletteTheme?.palette.primary,
                  selectedPaletteTheme?.palette.secondary,
                  selectedPaletteTheme?.palette.accent,
                  selectedPaletteTheme?.palette.background,
                  selectedPaletteTheme?.palette.muted,
                  selectedPaletteTheme?.palette.textPrimary,
                ].map((color) => (
                  <span
                    className="h-7 w-7 border border-black/5"
                    key={`preview-${color ?? "empty"}`}
                    style={{
                      borderRadius: guidedPreviewRadii.chip,
                      backgroundColor: color,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          La page finale sera generee automatiquement puis ouverte dans le dashboard.
        </p>
      </div>

    </>
  );

  return (
    <WorkspacePageShell>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-8">
        <div className="pointer-events-none fixed right-4 top-4 z-[70]">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/92 px-3 py-3 shadow-[0_16px_36px_rgba(15,23,42,0.12)] backdrop-blur">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
              href="/dashboard"
            >
              Espace de travail
            </Link>
          </div>
        </div>

        <div
          className={cx(
            "mx-auto w-[min(1200px,calc(100%-32px))] pt-16",
            generationMode === "guided" ? "lg:pr-[344px] xl:pr-[376px]" : "",
          )}
        >
          <form
            className="grid gap-6 rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur"
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                {isFirstProjectFlow ? "Premiere page" : "Generation IA"}
              </span>
              <div>
                <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">
                  {isFirstProjectFlow
                    ? "Decris la premiere page de ton projet"
                    : "Decris la page que tu veux generer"}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                  {isFirstProjectFlow
                    ? "Tu es dans l'etape la plus importante : l'IA va creer la premiere version de ta page, puis tu pourras la modifier dans le dashboard."
                    : "Le resultat sera sauvegarde comme nouvelle version effective dans ton projet courant."}
                </p>
              </div>
            </div>

            <div className="flex rounded-full bg-slate-100 p-1">
              <button
                className={cx(
                  "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition",
                  generationMode === "prompt" ? "bg-slate-950 text-white" : "text-slate-600",
                )}
                onClick={() => setGenerationMode("prompt")}
                type="button"
              >
                Prompt libre
              </button>
              <button
                className={cx(
                  "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition",
                  generationMode === "guided" ? "bg-slate-950 text-white" : "text-slate-600",
                )}
                onClick={() => setGenerationMode("guided")}
                type="button"
              >
                Mode guide
              </button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Projet courant</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {currentProject?.name ?? "Aucun projet selectionne"}
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {promptLength} caracteres
                </div>
              </div>
            </div>

            {generationMode === "prompt" ? (
              <>
                <label className="grid gap-3">
                  <span className="text-sm font-semibold text-slate-700">Prompt</span>
                  <textarea
                    className="min-h-[320px] rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={
                      isFirstProjectFlow
                        ? "Ex: Cree une landing page premium en francais pour mon offre, avec hero, avantages, temoignages, FAQ et un formulaire tres visible."
                        : "Ex: Cree une landing page premium pour une application SaaS de gestion d'equipe, en francais, avec hero, benefits, pricing, FAQ et un appel a l'action tres visible."
                    }
                    value={prompt}
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  {[
                    "Landing page SaaS premium en francais avec hero, pricing et FAQ.",
                    "Page en arabe, lecture de droite a gauche, avec hero, temoignages et formulaire.",
                    "Page d'agence moderne en anglais avec sections services, process et contact.",
                  ].map((suggestion) => (
                    <button
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                      key={suggestion}
                      onClick={() => setPrompt(suggestion)}
                      type="button"
                    >
                      Exemple
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Ton activite</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GUIDED_ACTIVITY_OPTIONS.map((option) => (
                      <button
                        className={cx(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          guidedActivityChoice === option
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                        key={option}
                        onClick={() => setGuidedActivityChoice(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {guidedActivityChoice === "Autre" ? (
                    <input
                      className="mt-3 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setGuidedActivityCustom(event.target.value)}
                      placeholder="Precise ton activite"
                      value={guidedActivityCustom}
                    />
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Ce que tu veux obtenir</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GUIDED_OFFER_OPTIONS.map((option) => (
                      <button
                        className={cx(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          guidedOfferChoice === option
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                        key={option}
                        onClick={() => setGuidedOfferChoice(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {guidedOfferChoice === "Autre" ? (
                    <input
                      className="mt-3 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setGuidedOfferCustom(event.target.value)}
                      placeholder="Precise ton offre principale"
                      value={guidedOfferCustom}
                    />
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Ton public cible</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GUIDED_AUDIENCE_OPTIONS.map((option) => (
                      <button
                        className={cx(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          guidedAudienceChoice === option
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                        key={option}
                        onClick={() => setGuidedAudienceChoice(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {guidedAudienceChoice === "Autre" ? (
                    <input
                      className="mt-3 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setGuidedAudienceCustom(event.target.value)}
                      placeholder="Precise ton public"
                      value={guidedAudienceCustom}
                    />
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">L'objectif principal</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GUIDED_OBJECTIVE_OPTIONS.map((option) => (
                      <button
                        className={cx(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          guidedObjectiveChoice === option
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                        key={option}
                        onClick={() => setGuidedObjectiveChoice(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {guidedObjectiveChoice === "Autre" ? (
                    <input
                      className="mt-3 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setGuidedObjectiveCustom(event.target.value)}
                      placeholder="Precise ton objectif"
                      value={guidedObjectiveCustom}
                    />
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Le style souhaite</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GUIDED_STYLE_OPTIONS.map((option) => (
                      <button
                        className={cx(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          guidedStyleChoice === option
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                        key={option}
                        onClick={() => setGuidedStyleChoice(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {guidedStyleChoice === "Autre" ? (
                    <input
                      className="mt-3 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setGuidedStyleCustom(event.target.value)}
                      placeholder="Precise le style souhaite"
                      value={guidedStyleCustom}
                    />
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Langue et localisation</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Langue principale</span>
                      <select
                        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) => setGuidedLocale(event.target.value)}
                        value={guidedLocale}
                      >
                        {GUIDED_LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Direction</span>
                      <select
                        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          setGuidedDirectionMode(event.target.value as "auto" | "ltr" | "rtl")
                        }
                        value={guidedDirectionMode}
                      >
                        <option value="auto">Automatique</option>
                        <option value="ltr">Gauche vers droite</option>
                        <option value="rtl">Droite vers gauche</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <input
                        checked={guidedTranslationsEnabled}
                        className="h-4 w-4 accent-slate-950"
                        onChange={(event) => setGuidedTranslationsEnabled(event.target.checked)}
                        type="checkbox"
                      />
                      <span>Activer le mode multilingue</span>
                    </label>
                    {guidedTranslationsEnabled ? (
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Langue secondaire</span>
                        <select
                          className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          onChange={(event) => setGuidedSecondaryLocale(event.target.value)}
                          value={guidedSecondaryLocale}
                        >
                          {GUIDED_LANGUAGE_OPTIONS.filter((option) => option.value !== guidedLocale).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {guidedTranslationsEnabled ? (
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Contexte de traduction optionnel</span>
                        <textarea
                          className="min-h-[90px] rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          onChange={(event) => setGuidedTranslationContext(event.target.value)}
                          placeholder="Optionnel: ton, vocabulaire metier, mots a conserver..."
                          value={guidedTranslationContext}
                        />
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Style visuel</p>
                  <div className="mt-4 max-h-[360px] overflow-y-auto pr-2">
                    <div className="grid gap-3 md:grid-cols-2">
                      {PALETTE_LIBRARY.map((palette) => (
                        <button
                          className={cx(
                            "rounded-[22px] border bg-white p-4 text-left transition hover:-translate-y-0.5",
                            guidedPaletteId === palette.value
                              ? "border-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.10)]"
                              : "border-slate-200",
                          )}
                          key={palette.value}
                          onClick={() => setGuidedPaletteId(palette.value)}
                          type="button"
                        >
                          <div className="mb-3 flex gap-2">
                            {[
                              ...palette.colors,
                            ].map((color) => (
                              <span
                                className="h-8 w-8 rounded-full border border-black/5"
                                key={`${palette.value}-${color}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{palette.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{palette.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Style des coins</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "sharp", label: "Nets" },
                        { value: "balanced", label: "Equilibres" },
                        { value: "rounded", label: "Arrondis" },
                      ].map((option) => (
                        <button
                          className={cx(
                            "rounded-full border px-4 py-2 text-sm font-semibold transition",
                            guidedCornerStyle === option.value
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          )}
                          key={option.value}
                          onClick={() =>
                            setGuidedCornerStyle(option.value as "sharp" | "balanced" | "rounded")
                          }
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Resume de ta generation</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {finalPrompt.trim() || "Choisis les options ci-dessus pour preparer la page."}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">Langue :</span>{" "}
                      {GUIDED_LANGUAGE_OPTIONS.find((option) => option.value === guidedLocale)?.label ?? guidedLocale}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Direction :</span>{" "}
                      {guidedLocalizationConstraint?.direction === "rtl" ? "RTL" : "LTR"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Palette :</span> {selectedPalette?.label}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Coins :</span>{" "}
                      {guidedCornerStyle === "sharp"
                        ? "Nets"
                        : guidedCornerStyle === "rounded"
                          ? "Arrondis"
                          : "Equilibres"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                href={currentProject ? currentProjectViewHref : "/onboarding"}
                target={generatedPageId ? "_blank" : undefined}
              >
                Voir la page
              </Link>
              <button
                className={cx(
                  "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition",
                  isGenerating
                    ? "cursor-wait bg-slate-400"
                    : "bg-[linear-gradient(135deg,#0f172a,#2563eb)] hover:-translate-y-0.5",
                )}
                disabled={isGenerating}
                type="submit"
              >
                {isGenerating ? "Generation en cours..." : "Generer la page"}
              </button>
            </div>
          </form>

          {generationMode === "guided" ? (
            <>
              <div
                className="fixed top-24 hidden lg:block"
                style={{
                  right: "max(16px, calc((100vw - 1200px) / 2 + 16px))",
                  width: "min(320px, calc(100vw - 32px))",
                }}
              >
                <div className="grid gap-6">{guidedSidebarContent}</div>
              </div>

              <div className="mt-6 grid gap-6 lg:hidden">{guidedSidebarContent}</div>
            </>
          ) : null}
        </div>
      </div>
      {isGenerating ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/45 px-4 py-4 backdrop-blur-sm md:px-6 md:py-6">
          <div className="flex min-h-full items-center justify-center">
            <div className="max-h-[calc(100vh-32px)] w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(241,245,249,0.94)_100%)] shadow-[0_40px_120px_rgba(15,23,42,0.30)] md:max-h-[calc(100vh-48px)]">
              <div className="grid max-h-[inherit] gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="flex min-h-[260px] items-center justify-center border-b border-slate-200/80 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0%,rgba(219,234,254,0.95)_100%)] p-5 lg:min-h-[auto] lg:border-b-0 lg:border-r">
                <img
                  alt="Robot en generation"
                  className="max-h-[240px] w-full max-w-[260px] object-contain drop-shadow-[0_22px_40px_rgba(37,99,235,0.22)] lg:max-h-[340px] lg:max-w-[300px]"
                  src={ROBOT_GIF_URL}
                />
              </div>
                <div className="max-h-[calc(100vh-292px)] overflow-y-auto p-6 md:max-h-[calc(100vh-320px)] md:p-8 lg:max-h-[calc(100vh-48px)]">
                <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  Generation en cours
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Le robot prepare ta page
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Patiente quelques instants. Il transforme ton idee en une premiere page complete, prete a etre relue
                  et ajustee dans le dashboard.
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-fuchsia-500 [animation-delay:-0.25s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.12s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-sky-500" />
                </div>

                <div className="mt-8 min-h-[230px] rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Insight du moment</p>
                  <div className="mt-3">
                    <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                      {GENERATION_INSIGHTS[activeInsightIndex]?.category}
                    </span>
                  </div>
                  <p className="mt-3 min-h-[56px] text-xl font-bold text-slate-950">
                    {GENERATION_INSIGHTS[activeInsightIndex]?.title}
                  </p>
                  <p className="mt-2 min-h-[84px] text-sm leading-7 text-slate-600">
                    {GENERATION_INSIGHTS[activeInsightIndex]?.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {GENERATION_INSIGHTS.map((insight, index) => (
                      <span
                        className={cx(
                          "h-2.5 rounded-full transition-all",
                          index === activeInsightIndex ? "w-8 bg-slate-950" : "w-2.5 bg-slate-300",
                        )}
                        key={`${insight.category}-${insight.title}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                  La fenetre se fermera automatiquement des que la premiere version sera prete.
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspacePageShell>
  );
}
