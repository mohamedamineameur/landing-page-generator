import type { PageSection } from "@/component-registry";

export interface LocalizedTextMap {
  [locale: string]: string;
}

export interface PageTheme {
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
  palette?: {
    primary?: string;
    secondary?: string;
    background?: string;
    textPrimary?: string;
    textSecondary?: string;
    accent?: string;
    muted?: string;
  };
}

export interface PageLocalization {
  locale?: string;
  direction?: "ltr" | "rtl";
  isRTL?: boolean;
  supportedLocales?: string[];
  translationContext?: string;
  translationsEnabled?: boolean;
}

export interface PagePayload {
  slug: string;
  title: string | LocalizedTextMap;
  theme?: PageTheme;
  localization?: PageLocalization;
  sections: PageSection[];
}

type ValidationResult =
  | { success: true; data: PagePayload }
  | { success: false; errors: string[] };

const SUPPORTED_SECTION_TYPES = [
  "navbar",
  "hero",
  "benefits",
  "trust_bar",
  "stats",
  "form",
  "testimonials",
  "faq",
  "cta_banner",
  "comparison",
  "image",
  "gallery",
  "video",
  "rich_text",
  "countdown",
  "pricing",
  "logo_cloud",
  "steps",
  "footer",
] as const;

const CTA_ACTIONS = [
  "scroll_to_form",
  "scroll_to_section",
  "open_modal",
  "navigate",
  "submit_form",
  "start_quiz",
  "book_call",
  "download",
  "copy_code",
  "play_video",
] as const;

const FORM_FIELD_TYPES = ["text", "email", "tel", "number", "textarea", "select"] as const;
const HERO_VARIANTS = ["centered", "split", "image_right", "form_right"] as const;
const BENEFITS_VARIANTS = ["cards", "list", "icons", "split"] as const;
const TESTIMONIALS_VARIANTS = ["grid", "carousel", "single"] as const;
const FORM_VARIANTS = ["stacked", "inline", "card"] as const;
const GALLERY_VARIANTS = ["grid", "carousel", "masonry", "stacked", "split"] as const;
const STATS_VARIANTS = ["cards", "progress"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isLocaleMapKey(value: string) {
  return value === "default" || isLocaleString(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isColorString(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function normalizeLocale(value: string) {
  const [language, region] = value.trim().replace(/_/g, "-").split("-");

  if (!language) {
    return "";
  }

  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
}

function isLocaleString(value: unknown): value is string {
  return typeof value === "string" && /^[a-z]{2,3}([_-][a-zA-Z]{2,4})?$/.test(value.trim());
}

function isLocalizedTextMap(value: unknown, requireNonEmpty = true): value is LocalizedTextMap {
  if (!isObject(value)) {
    return false;
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return false;
  }

  return entries.every(([key, nestedValue]) => {
    if (!isLocaleMapKey(key)) {
      return false;
    }

    return requireNonEmpty ? isNonEmptyString(nestedValue) : typeof nestedValue === "string";
  });
}

function isTextLike(value: unknown, requireNonEmpty = true): value is string | LocalizedTextMap {
  return requireNonEmpty ? isNonEmptyString(value) || isLocalizedTextMap(value, true) : isOptionalString(value) || isLocalizedTextMap(value, false);
}

function isOptionalTextLike(value: unknown): value is string | LocalizedTextMap | undefined {
  return value === undefined || isTextLike(value, false);
}

function isTextLikeArray(value: unknown, requireNonEmpty = true): value is Array<string | LocalizedTextMap> {
  return Array.isArray(value) && value.every((item) => isTextLike(item, requireNonEmpty));
}

function resolveTextPreview(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (!isLocalizedTextMap(value, true)) {
    return "";
  }

  const preferredEntry = Object.entries(value).find(([key]) => key === "default" || key.startsWith("fr") || key.startsWith("en"));
  return preferredEntry?.[1] ?? Object.values(value)[0] ?? "";
}

function isRtlLocale(locale?: string) {
  if (!locale) return false;
  const language = normalizeLocale(locale).split("-")[0];
  return ["ar", "fa", "he", "ur"].includes(language);
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

function normalizeCornerStyle(value: unknown): PageTheme["cornerStyle"] | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  const compact = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!compact) {
    return undefined;
  }

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

function getBenefitsAnchorId(title: unknown) {
  const titleText = resolveTextPreview(title).toLowerCase();
  return titleText && titleText.includes("creation")
    ? "creations"
    : "benefits";
}

function getSectionAnchorId(section: unknown) {
  if (!isObject(section) || !isNonEmptyString(section.type) || !isObject(section.props)) {
    return null;
  }

  switch (section.type) {
    case "hero":
      return "content";
    case "benefits":
      return getBenefitsAnchorId(section.props.title);
    case "testimonials":
      return "testimonials";
    case "form":
      return "lead-form";
    case "faq":
      return "faq";
    case "cta_banner":
      return "cta-banner";
    case "trust_bar":
      return "trust-bar";
    case "stats":
      return "stats";
    case "steps":
      return "steps";
    case "comparison":
      return "comparison";
    case "image":
      return "gallery";
    case "gallery":
      return "gallery";
    case "video":
      return "video";
    case "rich_text":
      return "rich-text";
    case "countdown":
      return "countdown";
    case "pricing":
      return "pricing";
    case "logo_cloud":
      return "logos";
    case "footer":
      return "footer";
    default:
      return null;
  }
}

function collectSectionAnchors(sections: unknown[]) {
  const anchors: string[] = [];

  sections.forEach((section) => {
    const anchor = getSectionAnchorId(section);

    if (anchor && !anchors.includes(anchor)) {
      anchors.push(anchor);
    }
  });

  return anchors;
}

function normalizeAnchor(value: string) {
  return value.trim().replace(/^#+/, "").trim().toLowerCase();
}

function resolveNavbarLinkHref(label: unknown, href: unknown, availableAnchors: string[]) {
  const anchors = new Set(availableAnchors);
  const labelText = resolveTextPreview(label).toLowerCase();
  const hrefText = isNonEmptyString(href) ? href.toLowerCase() : "";
  const normalizedHref = isNonEmptyString(href) ? normalizeAnchor(href) : "";

  if (normalizedHref && anchors.has(normalizedHref)) {
    return `#${normalizedHref}`;
  }

  const haystack = `${labelText} ${hrefText}`;
  const candidates: string[] = [];

  if (/(accueil|home|hero|top)/.test(haystack)) candidates.push("content");
  if (/(fonction|feature|benefit|avantage)/.test(haystack)) candidates.push("benefits", "creations");
  if (/(creation|portfolio|galerie)/.test(haystack)) candidates.push("creations", "gallery", "benefits");
  if (/(avis|testimonial|temoign)/.test(haystack)) candidates.push("testimonials");
  if (/(inscription|signup|register|contact|demo|essai|start|commencer|form)/.test(haystack)) candidates.push("lead-form");
  if (/(faq|question)/.test(haystack)) candidates.push("faq");
  if (/(prix|tarif|pricing|plan|offre)/.test(haystack)) candidates.push("pricing");
  if (/(compar)/.test(haystack)) candidates.push("comparison");
  if (/(etape|process|comment)/.test(haystack)) candidates.push("steps");
  if (/(stat|chiffre|resultat|metric)/.test(haystack)) candidates.push("stats");
  if (/(logo|partenaire|client)/.test(haystack)) candidates.push("logos");
  if (/(video)/.test(haystack)) candidates.push("video");
  if (/(texte|article|contenu)/.test(haystack)) candidates.push("rich-text");
  if (/(compte|rebours|deadline|timer)/.test(haystack)) candidates.push("countdown");
  if (/(cta|action)/.test(haystack)) candidates.push("cta-banner", "lead-form");
  if (/(footer|bas de page)/.test(haystack)) candidates.push("footer");

  const matchedAnchor = candidates.find((candidate) => anchors.has(candidate));

  if (matchedAnchor) {
    return `#${matchedAnchor}`;
  }

  const fallbackAnchor = availableAnchors.find((anchor) => anchor !== "footer") ?? availableAnchors[0] ?? "content";
  return `#${fallbackAnchor}`;
}

function normalizeNavbarCtaAction(action: unknown, availableAnchors: string[]) {
  if (!isNonEmptyString(action)) {
    return action;
  }

  if (action === "scroll_to_form" || action === "scroll_to_section") {
    return action;
  }

  const normalizedHref = normalizeAnchor(action);

  if (availableAnchors.includes(normalizedHref)) {
    return `#${normalizedHref}`;
  }

  return availableAnchors.includes("lead-form") ? "scroll_to_form" : "scroll_to_section";
}

function validateNavbarAnchors(sections: unknown[], errors: string[]) {
  const anchors = new Set(collectSectionAnchors(sections));

  sections.forEach((section, index) => {
    if (!isObject(section) || section.type !== "navbar" || !isObject(section.props)) {
      return;
    }

    if (Array.isArray(section.props.links)) {
      section.props.links.forEach((link, linkIndex) => {
        if (!isObject(link) || !isNonEmptyString(link.href)) {
          return;
        }

        if (!link.href.startsWith("#")) {
          errors.push(`sections[${index}].props.links[${linkIndex}].href doit pointer vers une section interne.`);
          return;
        }

        if (!anchors.has(normalizeAnchor(link.href))) {
          errors.push(`sections[${index}].props.links[${linkIndex}].href pointe vers une section inexistante.`);
        }
      });
    }

    if (isObject(section.props.cta) && isNonEmptyString(section.props.cta.action)) {
      const action = section.props.cta.action;

      if (action !== "scroll_to_form" && action !== "scroll_to_section" && !action.startsWith("#")) {
        errors.push(`sections[${index}].props.cta.action doit rester dans la page.`);
      }

      if (action.startsWith("#") && !anchors.has(normalizeAnchor(action))) {
        errors.push(`sections[${index}].props.cta.action pointe vers une section inexistante.`);
      }
    }
  });
}

function normalizeFormFieldType(value: unknown) {
  if (FORM_FIELD_TYPES.includes(value as (typeof FORM_FIELD_TYPES)[number])) {
    return value as (typeof FORM_FIELD_TYPES)[number];
  }

  switch (value) {
    case "radio":
    case "checkbox":
      return "select";
    case "date":
    case "time":
    case "url":
    case "hidden":
      return "text";
    default:
      return "text";
  }
}

function validateCta(value: unknown, path: string, errors: string[]) {
  if (!isObject(value)) {
    errors.push(`${path} doit etre un objet.`);
    return;
  }

  if (!isTextLike(value.label)) {
    errors.push(`${path}.label est requis.`);
  }

  if (!isNonEmptyString(value.action)) {
    errors.push(`${path}.action est requis.`);
  } else if (!CTA_ACTIONS.includes(value.action as (typeof CTA_ACTIONS)[number]) && !value.action.startsWith("#")) {
    errors.push(`${path}.action n'est pas supporte.`);
  }
}

function validateTheme(value: unknown, errors: string[]) {
  if (value === undefined) {
    return;
  }

  if (!isObject(value)) {
    errors.push("theme doit etre un objet.");
    return;
  }

  const themeKeys = [
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "backgroundColor",
    "surfaceColor",
    "surfaceAltColor",
    "textColor",
    "mutedTextColor",
    "borderColor",
    "buttonTextColor",
    "successColor",
    "warningColor",
  ] as const;

  for (const key of themeKeys) {
    if (value[key] !== undefined && !isColorString(value[key])) {
      errors.push(`theme.${key} doit etre une couleur hexadecimale.`);
    }
  }

  if (value.name !== undefined && typeof value.name !== "string") {
    errors.push("theme.name doit etre une chaine.");
  }

  if (
    value.cornerStyle !== undefined &&
    value.cornerStyle !== "sharp" &&
    value.cornerStyle !== "balanced" &&
    value.cornerStyle !== "rounded"
  ) {
    errors.push("theme.cornerStyle doit etre sharp, balanced ou rounded.");
  }

  if (value.palette !== undefined) {
    if (!isObject(value.palette)) {
      errors.push("theme.palette doit etre un objet.");
    } else {
      const paletteKeys = [
        "primary",
        "secondary",
        "background",
        "textPrimary",
        "textSecondary",
        "accent",
        "muted",
      ] as const;

      for (const key of paletteKeys) {
        if (value.palette[key] !== undefined && !isColorString(value.palette[key])) {
          errors.push(`theme.palette.${key} doit etre une couleur hexadecimale.`);
        }
      }
    }
  }
}

function validateLocalization(value: unknown, errors: string[]) {
  if (value === undefined) {
    return;
  }

  if (!isObject(value)) {
    errors.push("localization doit etre un objet.");
    return;
  }

  if (value.locale !== undefined && !isLocaleString(value.locale)) {
    errors.push("localization.locale doit etre un code langue valide de type fr, en, ar ou fr-FR.");
  }

  if (value.direction !== undefined && value.direction !== "ltr" && value.direction !== "rtl") {
    errors.push('localization.direction doit etre "ltr" ou "rtl".');
  }

  if (value.isRTL !== undefined && !isBoolean(value.isRTL)) {
    errors.push("localization.isRTL doit etre un boolean.");
  }

  if (value.supportedLocales !== undefined) {
    if (!Array.isArray(value.supportedLocales)) {
      errors.push("localization.supportedLocales doit etre un tableau.");
    } else {
      value.supportedLocales.forEach((locale, index) => {
        if (!isLocaleString(locale)) {
          errors.push(`localization.supportedLocales[${index}] doit etre un code langue valide.`);
        }
      });
    }
  }

  if (value.translationContext !== undefined && !isOptionalString(value.translationContext)) {
    errors.push("localization.translationContext doit etre une chaine si renseigne.");
  }

  if (value.translationsEnabled !== undefined && !isBoolean(value.translationsEnabled)) {
    errors.push("localization.translationsEnabled doit etre un boolean.");
  }
}

function validateSection(section: unknown, index: number, errors: string[]) {
  const path = `sections[${index}]`;

  if (!isObject(section)) {
    errors.push(`${path} doit etre un objet.`);
    return;
  }

  if (!isNonEmptyString(section.type)) {
    errors.push(`${path}.type est requis.`);
    return;
  }

  if (!SUPPORTED_SECTION_TYPES.includes(section.type as (typeof SUPPORTED_SECTION_TYPES)[number])) {
    errors.push(`${path}.type "${section.type}" n'est pas supporte.`);
  }

  if (section.variant !== undefined && typeof section.variant !== "string") {
    errors.push(`${path}.variant doit etre une chaine.`);
  }

  if (!isObject(section.props)) {
    errors.push(`${path}.props doit etre un objet.`);
    return;
  }

  const props = section.props;

  switch (section.type) {
    case "navbar":
      if (!isTextLike(props.logoText)) errors.push(`${path}.props.logoText est requis.`);
      if (!Array.isArray(props.links)) errors.push(`${path}.props.links doit etre un tableau.`);
      if (Array.isArray(props.links)) {
        props.links.forEach((link, linkIndex) => {
          if (!isObject(link) || !isTextLike(link.label) || !isNonEmptyString(link.href)) {
            errors.push(`${path}.props.links[${linkIndex}] est invalide.`);
          }
        });
      }
      if (props.cta !== undefined) validateCta(props.cta, `${path}.props.cta`, errors);
      break;
    case "hero":
      if (section.variant !== undefined && !HERO_VARIANTS.includes(section.variant as (typeof HERO_VARIANTS)[number])) {
        errors.push(`${path}.variant n'est pas supporte pour hero.`);
      }
      if (!isTextLike(props.headline)) errors.push(`${path}.props.headline est requis.`);
      if (!isTextLike(props.subheadline)) errors.push(`${path}.props.subheadline est requis.`);
      if (props.primaryCta !== undefined) validateCta(props.primaryCta, `${path}.props.primaryCta`, errors);
      if (props.secondaryCta !== undefined) validateCta(props.secondaryCta, `${path}.props.secondaryCta`, errors);
      if (props.badges !== undefined && !isTextLikeArray(props.badges)) {
        errors.push(`${path}.props.badges doit etre un tableau de chaines.`);
      }
      if (props.stats !== undefined) {
        if (!Array.isArray(props.stats)) {
          errors.push(`${path}.props.stats doit etre un tableau.`);
        } else {
          props.stats.forEach((item, itemIndex) => {
            if (!isObject(item) || !isTextLike(item.value) || !isTextLike(item.label)) {
              errors.push(`${path}.props.stats[${itemIndex}] est invalide.`);
            }
          });
        }
      }
      if (props.media !== undefined) {
        if (!isObject(props.media)) {
          errors.push(`${path}.props.media doit etre un objet.`);
        } else {
          if (props.media.kind !== "image" && props.media.kind !== "video") {
            errors.push(`${path}.props.media.kind doit etre "image" ou "video".`);
          }
          if (!isNonEmptyString(props.media.style)) {
            errors.push(`${path}.props.media.style est requis.`);
          }
          if (props.media.src !== undefined && typeof props.media.src !== "string") {
            errors.push(`${path}.props.media.src doit etre une chaine.`);
          }
        }
      }
      break;
    case "benefits":
      if (section.variant !== undefined && !BENEFITS_VARIANTS.includes(section.variant as (typeof BENEFITS_VARIANTS)[number])) {
        errors.push(`${path}.variant n'est pas supporte pour benefits.`);
      }
      if (!isTextLike(props.title)) errors.push(`${path}.props.title est requis.`);
      if (!Array.isArray(props.items) || props.items.length === 0) {
        errors.push(`${path}.props.items doit etre un tableau non vide.`);
      } else {
        props.items.forEach((item, itemIndex) => {
          if (!isObject(item) || !isTextLike(item.title) || !isTextLike(item.description) || !isNonEmptyString(item.icon)) {
            errors.push(`${path}.props.items[${itemIndex}] est invalide.`);
          }
        });
      }
      break;
    case "trust_bar":
      if (!isTextLikeArray(props.items) || props.items.length === 0) {
        errors.push(`${path}.props.items doit etre un tableau de chaines non vide.`);
      }
      break;
    case "stats":
      if (section.variant !== undefined && !STATS_VARIANTS.includes(section.variant as (typeof STATS_VARIANTS)[number])) {
        errors.push(`${path}.variant n'est pas supporte pour stats.`);
      }
      if (!Array.isArray(props.items) || props.items.length === 0) {
        errors.push(`${path}.props.items doit etre un tableau non vide.`);
      } else {
        props.items.forEach((item, itemIndex) => {
          if (!isObject(item) || !isTextLike(item.value) || !isTextLike(item.label)) {
            errors.push(`${path}.props.items[${itemIndex}] est invalide.`);
            return;
          }

          if (
            item.progress !== undefined &&
            (typeof item.progress !== "number" || item.progress < 0 || item.progress > 100)
          ) {
            errors.push(`${path}.props.items[${itemIndex}].progress doit etre un nombre entre 0 et 100.`);
          }
        });
      }
      if (props.animate !== undefined && typeof props.animate !== "boolean") {
        errors.push(`${path}.props.animate doit etre un boolean.`);
      }
      break;
    case "form":
      if (section.variant !== undefined && !FORM_VARIANTS.includes(section.variant as (typeof FORM_VARIANTS)[number])) {
        errors.push(`${path}.variant n'est pas supporte pour form.`);
      }
      if (!isTextLike(props.title)) errors.push(`${path}.props.title est requis.`);
      if (!isTextLike(props.submitLabel)) errors.push(`${path}.props.submitLabel est requis.`);
      if (!isTextLike(props.successMessage)) errors.push(`${path}.props.successMessage est requis.`);
      if (!Array.isArray(props.fields) || props.fields.length === 0) {
        errors.push(`${path}.props.fields doit etre un tableau non vide.`);
      } else {
        props.fields.forEach((field, fieldIndex) => {
          if (!isObject(field)) {
            errors.push(`${path}.props.fields[${fieldIndex}] est invalide.`);
            return;
          }
          if (!FORM_FIELD_TYPES.includes(field.type as (typeof FORM_FIELD_TYPES)[number])) {
            errors.push(`${path}.props.fields[${fieldIndex}].type n'est pas supporte.`);
          }
          if (!isNonEmptyString(field.name) || !isTextLike(field.label) || typeof field.required !== "boolean") {
            errors.push(`${path}.props.fields[${fieldIndex}] est invalide.`);
          }
          if (field.placeholder !== undefined && !isOptionalTextLike(field.placeholder)) {
            errors.push(`${path}.props.fields[${fieldIndex}].placeholder doit etre une chaine ou un objet de traductions.`);
          }
          if (field.options !== undefined && !isTextLikeArray(field.options)) {
            errors.push(`${path}.props.fields[${fieldIndex}].options doit etre un tableau de chaines.`);
          }
        });
      }
      break;
    case "testimonials":
      if (section.variant !== undefined && !TESTIMONIALS_VARIANTS.includes(section.variant as (typeof TESTIMONIALS_VARIANTS)[number])) {
        errors.push(`${path}.variant n'est pas supporte pour testimonials.`);
      }
      if (!isTextLike(props.title)) errors.push(`${path}.props.title est requis.`);
      if (!Array.isArray(props.items) || props.items.length === 0) {
        errors.push(`${path}.props.items doit etre un tableau non vide.`);
      } else {
        props.items.forEach((item, itemIndex) => {
          if (!isObject(item) || !isTextLike(item.name) || !isTextLike(item.role) || !isTextLike(item.quote) || typeof item.rating !== "number") {
            errors.push(`${path}.props.items[${itemIndex}] est invalide.`);
          }
        });
      }
      break;
    case "faq":
      if (!isTextLike(props.title)) errors.push(`${path}.props.title est requis.`);
      if (!Array.isArray(props.items) || props.items.length === 0) {
        errors.push(`${path}.props.items doit etre un tableau non vide.`);
      } else {
        props.items.forEach((item, itemIndex) => {
          if (!isObject(item) || !isTextLike(item.question) || !isTextLike(item.answer)) {
            errors.push(`${path}.props.items[${itemIndex}] est invalide.`);
          }
        });
      }
      break;
    case "cta_banner":
      if (!isTextLike(props.headline)) errors.push(`${path}.props.headline est requis.`);
      if (!isTextLike(props.subheadline)) errors.push(`${path}.props.subheadline est requis.`);
      validateCta(props.primaryCta, `${path}.props.primaryCta`, errors);
      break;
    case "comparison":
      if (!isTextLikeArray(props.columns) || props.columns.length === 0) {
        errors.push(`${path}.props.columns doit etre un tableau de chaines non vide.`);
      }
      if (!Array.isArray(props.rows) || props.rows.some((row) => !Array.isArray(row) || !row.every((item) => isTextLike(item)))) {
        errors.push(`${path}.props.rows doit etre un tableau de lignes texte.`);
      }
      break;
    case "image":
      if (!isNonEmptyString(props.src) || !isTextLike(props.alt)) {
        errors.push(`${path}.props.src et props.alt sont requis.`);
      }
      break;
    case "gallery":
      if (section.variant !== undefined && !GALLERY_VARIANTS.includes(section.variant as (typeof GALLERY_VARIANTS)[number])) {
        errors.push(`${path}.variant n'est pas supporte pour gallery.`);
      }
      if (!Array.isArray(props.items) || props.items.length === 0) {
        errors.push(`${path}.props.items doit etre un tableau non vide.`);
      } else {
        props.items.forEach((item, itemIndex) => {
          if (!isObject(item) || !isNonEmptyString(item.src) || !isTextLike(item.alt)) {
            errors.push(`${path}.props.items[${itemIndex}] est invalide.`);
          }
        });
      }
      if (!isOptionalTextLike(props.title)) {
        errors.push(`${path}.props.title doit etre une chaine si renseigne.`);
      }
      if (!isOptionalTextLike(props.subtitle)) {
        errors.push(`${path}.props.subtitle doit etre une chaine si renseigne.`);
      }
      break;
    case "video":
      if (!isNonEmptyString(props.url)) errors.push(`${path}.props.url est requis.`);
      break;
    case "rich_text":
      if (!isTextLike(props.content)) errors.push(`${path}.props.content est requis.`);
      if (props.align !== undefined && !["left", "center", "right"].includes(String(props.align))) {
        errors.push(`${path}.props.align doit etre left, center ou right.`);
      }
      break;
    case "countdown":
      if (!isNonEmptyString(props.endAt) || !isTextLike(props.label)) {
        errors.push(`${path}.props.endAt et props.label sont requis.`);
      }
      break;
    case "pricing":
      if (!Array.isArray(props.plans) || props.plans.length === 0) {
        errors.push(`${path}.props.plans doit etre un tableau non vide.`);
      } else {
        props.plans.forEach((plan, planIndex) => {
          if (!isObject(plan) || !isTextLike(plan.name) || !isTextLike(plan.price) || !isTextLikeArray(plan.features)) {
            errors.push(`${path}.props.plans[${planIndex}] est invalide.`);
          }
        });
      }
      break;
    case "logo_cloud":
      if (!isStringArray(props.logos) || props.logos.length === 0) {
        errors.push(`${path}.props.logos doit etre un tableau de chaines non vide.`);
      }
      break;
    case "steps":
      if (!isTextLike(props.title)) errors.push(`${path}.props.title est requis.`);
      if (!Array.isArray(props.items) || props.items.length === 0) {
        errors.push(`${path}.props.items doit etre un tableau non vide.`);
      } else {
        props.items.forEach((item, itemIndex) => {
          if (!isObject(item) || !isTextLike(item.step) || !isTextLike(item.title) || !isTextLike(item.description)) {
            errors.push(`${path}.props.items[${itemIndex}] est invalide.`);
          }
        });
      }
      break;
    case "footer":
      if (!Array.isArray(props.columns) || props.columns.length === 0) {
        errors.push(`${path}.props.columns doit etre un tableau non vide.`);
      } else {
        props.columns.forEach((column, columnIndex) => {
          if (!isObject(column) || !isTextLike(column.title) || !Array.isArray(column.links)) {
            errors.push(`${path}.props.columns[${columnIndex}] est invalide.`);
            return;
          }
          column.links.forEach((link, linkIndex) => {
            if (!isObject(link) || !isTextLike(link.label) || !isNonEmptyString(link.href)) {
              errors.push(`${path}.props.columns[${columnIndex}].links[${linkIndex}] est invalide.`);
            }
          });
        });
      }
      break;
    default:
      break;
  }
}

export function normalizePagePayloadForRuntime(value: unknown): unknown {
  if (!isObject(value)) {
    return value;
  }

  const normalizedRoot: Record<string, unknown> = {
    ...value,
  };

  if (isObject(value.theme)) {
    const theme = { ...value.theme } as Record<string, unknown>;
    const palette =
      isObject(theme.palette) ? { ...theme.palette } : isObject(theme.colors) ? { ...theme.colors } : null;
    const normalizedCornerStyle = normalizeCornerStyle(theme.cornerStyle);

    if (palette) {
      const primary = isColorString(palette.primary) ? palette.primary : undefined;
      const secondary = isColorString(palette.secondary) ? palette.secondary : primary;
      const accent = isColorString(palette.accent) ? palette.accent : secondary;
      const background = isColorString(palette.background) ? palette.background : undefined;
      const textPrimary = isColorString(palette.textPrimary) ? palette.textPrimary : undefined;
      const textSecondary = isColorString(palette.textSecondary) ? palette.textSecondary : undefined;
      const muted = isColorString(palette.muted) ? palette.muted : undefined;
      const darkBackground = background ? isDarkColor(background) : false;
      const primaryIsDark = primary ? isDarkColor(primary) : true;

      theme.palette = {
        primary,
        secondary,
        background,
        textPrimary,
        textSecondary,
        accent,
        muted,
      };

      if (primary) theme.primaryColor = primary;
      if (secondary) theme.secondaryColor = secondary;
      if (accent) theme.accentColor = accent;
      if (background) theme.backgroundColor = background;
      if (textPrimary) theme.textColor = textPrimary;
      if (textSecondary) theme.mutedTextColor = textSecondary;
      if (muted) theme.surfaceAltColor = muted;

      if (!isColorString(theme.surfaceColor)) {
        theme.surfaceColor = darkBackground ? "#111827" : "#ffffff";
      }

      if (!isColorString(theme.surfaceAltColor)) {
        theme.surfaceAltColor = darkBackground ? "#1f2937" : "#eef4ff";
      }

      if (!isColorString(theme.borderColor)) {
        theme.borderColor = darkBackground ? "#334155" : "#dbe4f0";
      }

      if (!isColorString(theme.buttonTextColor)) {
        theme.buttonTextColor = primaryIsDark ? "#ffffff" : "#0f172a";
      }

      if (!isColorString(theme.successColor)) {
        theme.successColor = "#15803d";
      }

      if (!isColorString(theme.warningColor)) {
        theme.warningColor = "#d97706";
      }
    }

    if (normalizedCornerStyle) {
      theme.cornerStyle = normalizedCornerStyle;
    }

    delete theme.colors;
    normalizedRoot.theme = theme;
  }

  if (isObject(value.localization)) {
    const localization = { ...value.localization } as Record<string, unknown>;
    const locale = isLocaleString(localization.locale) ? normalizeLocale(localization.locale) : undefined;
    const supportedLocales = Array.isArray(localization.supportedLocales)
      ? localization.supportedLocales
          .filter((item): item is string => isLocaleString(item))
          .map((item) => normalizeLocale(item))
      : locale
        ? [locale]
        : [];
    const uniqueSupportedLocales = Array.from(new Set(supportedLocales));
    const inferredRtl = isBoolean(localization.isRTL)
      ? localization.isRTL
      : isRtlLocale(locale ?? uniqueSupportedLocales[0]);
    const direction =
      localization.direction === "rtl" || localization.direction === "ltr"
        ? localization.direction
        : inferredRtl
          ? "rtl"
          : "ltr";

    normalizedRoot.localization = {
      ...localization,
      ...(locale ? { locale } : {}),
      ...(uniqueSupportedLocales.length > 0 ? { supportedLocales: uniqueSupportedLocales } : {}),
      ...(isOptionalString(localization.translationContext) && localization.translationContext?.trim()
        ? { translationContext: localization.translationContext.trim() }
        : {}),
      direction,
      isRTL: direction === "rtl",
      translationsEnabled:
        isBoolean(localization.translationsEnabled)
          ? localization.translationsEnabled
          : uniqueSupportedLocales.length > 1,
    };
  }

  if (!Array.isArray(value.sections)) {
    return normalizedRoot;
  }

  const normalizedSections = value.sections.map((section) => {
    if (!isObject(section) || !isObject(section.props) || !isNonEmptyString(section.type)) {
      return section;
    }

    const props = { ...section.props };
    let type = section.type;
    let variant = section.variant;

    if (type === "navbar" && !isNonEmptyString(props.logoText) && isNonEmptyString(props.logo)) {
      props.logoText = props.logo;
    }

    if (type === "hero" && isObject(props.media)) {
      const media = { ...props.media };

      if (!isNonEmptyString(media.kind) && isNonEmptyString(media.type)) {
        media.kind = media.type;
      }

      if (!isNonEmptyString(media.style)) {
        media.style = isNonEmptyString(props.tone) ? props.tone : "professional";
      }

      props.media = media;
    }

    if (type === "footer_extended") {
      type = "footer";
      props.columns = Array.isArray(props.columns) ? props.columns : [];
      delete props.logo;
      delete props.description;
      delete props.socialLinks;
    }

    if (type === "features_grid") {
      type = "benefits";
      variant = "cards";
      props.title = isNonEmptyString(props.title) ? props.title : "Fonctionnalites";
      props.columns = typeof props.columns === "number" ? props.columns : 3;
      props.items = Array.isArray(props.items)
        ? props.items.map((item) => {
            if (!isObject(item)) {
              return item;
            }

            return {
              title: isNonEmptyString(item.title) ? item.title : "Element",
              description: isNonEmptyString(item.description) ? item.description : "",
              icon: "AutoAwesomeRounded",
            };
          })
        : [];
    }

    if (type === "form" && Array.isArray(props.fields)) {
      props.fields = props.fields.map((field, fieldIndex) => {
        if (!isObject(field)) {
          return field;
        }

        const normalizedType = normalizeFormFieldType(field.type);
        const normalizedField: Record<string, unknown> = {
          ...field,
          type: normalizedType,
          name: isNonEmptyString(field.name) ? field.name : `field_${fieldIndex + 1}`,
          label: isNonEmptyString(field.label) ? field.label : `Champ ${fieldIndex + 1}`,
          required: typeof field.required === "boolean" ? field.required : false,
        };

        if (normalizedType === "select") {
          normalizedField.options = isStringArray(field.options) && field.options.length > 0
            ? field.options
            : ["Option 1", "Option 2"];
        }

        return normalizedField;
      });
    }

    return {
      ...section,
      type,
      variant,
      props,
    };
  });

  const availableAnchors = collectSectionAnchors(normalizedSections);

  normalizedRoot.sections = normalizedSections.map((section) => {
    if (!isObject(section) || section.type !== "navbar" || !isObject(section.props)) {
      return section;
    }

    const props = { ...section.props };

    if (Array.isArray(props.links)) {
      props.links = props.links
        .filter((link) => isObject(link) && isNonEmptyString(link.label))
        .map((link) => ({
          ...link,
          href: resolveNavbarLinkHref(link.label, link.href, availableAnchors),
        }));
    }

    if (isObject(props.cta)) {
      props.cta = {
        ...props.cta,
        action: normalizeNavbarCtaAction(props.cta.action, availableAnchors),
      };
    }

    return {
      ...section,
      props,
    };
  });

  return normalizedRoot;
}

export function validatePagePayload(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(value)) {
    return { success: false, errors: ["Le JSON racine doit etre un objet."] };
  }

  if (!isNonEmptyString(value.slug)) {
    errors.push("slug est requis.");
  }

  if (!isTextLike(value.title)) {
    errors.push("title est requis.");
  }

  validateTheme(value.theme, errors);
  validateLocalization(value.localization, errors);

  if (!Array.isArray(value.sections) || value.sections.length === 0) {
    errors.push("sections doit etre un tableau non vide.");
  } else {
    value.sections.forEach((section, index) => {
      validateSection(section, index, errors);
    });

    validateNavbarAnchors(value.sections, errors);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: value as unknown as PagePayload };
}

export const dslPromptSummary = `
DSL autorise:
- Racine: { slug, title, theme?, localization?, sections[] }
- sections[].type autorises: ${SUPPORTED_SECTION_TYPES.join(", ")}
- Variants hero: ${HERO_VARIANTS.join(", ")}
- Variants benefits: ${BENEFITS_VARIANTS.join(", ")}
- Variants testimonials: ${TESTIMONIALS_VARIANTS.join(", ")}
- Variants form: ${FORM_VARIANTS.join(", ")}
- Variants gallery: ${GALLERY_VARIANTS.join(", ")}
- Variants stats: ${STATS_VARIANTS.join(", ")}
- CTA action autorisees: ${CTA_ACTIONS.join(", ")}
- Form field types autorises: ${FORM_FIELD_TYPES.join(", ")}
- theme optionnel avec couleurs hexadecimales; "theme.palette" est accepte et prefere comme source de verite.
- localization optionnel = { locale?, direction?: "ltr" | "rtl", isRTL?: boolean, supportedLocales?: string[], translationContext?: string, translationsEnabled?: boolean }
- Les champs texte visibles peuvent etre soit une chaine simple, soit un objet de traductions du type { fr: "...", en: "...", ar: "..." }.
- Retourne strictement du JSON valide sans markdown, sans commentaire, sans texte additionnel.
`.trim();

export const runtimeSupportedPromptSpec = `
IMPORTANT:
Le fichier components.json contient un catalogue DSL large, mais le runtime actuel ne rend que ce sous-ensemble.
Tu dois generer UNIQUEMENT des sections de ce sous-ensemble:
${SUPPORTED_SECTION_TYPES.join(", ")}

Contraintes runtime exactes:
- localization = { locale?: string, direction?: "ltr" | "rtl", isRTL?: boolean, supportedLocales?: string[], translationContext?: string, translationsEnabled?: boolean }
- Si la langue principale est arabe, hebreu, persan ou ourdou, utilise direction "rtl" et isRTL true.
- Si plusieurs langues sont prevues, renseigne supportedLocales avec tous les codes langues et translationsEnabled true.
- Pour les champs texte visibles, tu peux utiliser soit "string", soit un objet localise: { fr: "...", en: "...", ar: "..." }.
- Si plusieurs langues sont demandees, prefere les objets localises pour headline, subheadline, titles, labels, questions, answers, CTA et textes visibles majeurs.
- navbar.props = { logoText: string, links: [{ label, href }], cta?: { label, action } }
- Tous les liens du header doivent pointer uniquement vers des sections internes de la page.
- navbar.props.links[].href doit toujours etre une ancre interne valide de la forme #section-id.
- Interdiction absolue dans le header: /autre-page, URL externe, URL cassée, ancre inexistante.
- navbar.props.cta.action doit rester dans la page: scroll_to_form, scroll_to_section ou #section-id valide.
- hero.props.media = { kind: "image" | "video", style: string, src?: string }
- gallery.props = { title?: string, subtitle?: string, items: [{ src, alt }] }
- gallery.variant autorises = ${GALLERY_VARIANTS.join(", ")}
- stats.variant autorises = ${STATS_VARIANTS.join(", ")}
- stats.props = { items: [{ value, label, progress?: number }], animate?: boolean }
- benefits.variant autorises = ${BENEFITS_VARIANTS.join(", ")}
- testimonials.variant autorises = ${TESTIMONIALS_VARIANTS.join(", ")}
- form.variant autorises = ${FORM_VARIANTS.join(", ")}
- form.props.fields[].type autorises pour le runtime actuel = ${FORM_FIELD_TYPES.join(", ")}
- Si tu as besoin d'un choix unique ou multiple, utilise "select" avec options[] au lieu de radio/checkbox.
- N'utilise jamais: features_grid, footer_extended, hero_split, hero_centered, hero_with_form, hero_with_stats, hero_with_testimonials, hero_video, hero_minimal, hero_product, hero_search, hero_countdown
- N'utilise jamais d'autres types qui ne sont pas dans la liste runtime ci-dessus.
`.trim();
