"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BenefitsProps,
  ComparisonProps,
  CountdownProps,
  CtaBannerProps,
  CtaAction,
  FooterProps,
  FormField,
  FormProps,
  FaqProps,
  GalleryProps,
  HeroProps,
  ImageProps,
  LogoCloudProps,
  NavbarProps,
  PricingProps,
  RichTextProps,
  StatsProps,
  StepsProps,
  TestimonialsProps,
  TrustBarProps,
  VideoProps,
} from "@/component-registry";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  EditableText,
  InlineEditButton,
  type PageEditorPathSegment,
  usePageInlineEditor,
} from "@/components/page-inline-editor";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getBenefitsSectionId(title: string) {
  return title.toLowerCase().includes("creation") ? "creations" : "benefits";
}

function getActionHref(action: string) {
  if (action === "scroll_to_form") return "#lead-form";
  if (action === "scroll_to_section") return "#content";
  return action;
}

function sectionPath(sectionIndex: number | undefined, ...segments: PageEditorPathSegment[]) {
  if (sectionIndex === undefined) {
    return undefined;
  }

  return ["sections", sectionIndex, "props", ...segments];
}

function Icon({ name, className }: { name?: string; className?: string }) {
  const normalized = (name ?? "").toLowerCase();
  const base = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (normalized) {
    case "phone":
    case "localphonerounded":
      return (
        <svg {...base}>
          <path d="M6 4h3l2 5-2 2a16 16 0 0 0 4 4l2-2 5 2v3c0 1-1 2-2 2C10.8 20 4 13.2 4 6c0-1 1-2 2-2Z" />
        </svg>
      );
    case "layers":
    case "layersrounded":
      return (
        <svg {...base}>
          <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z" />
          <path d="m3 12 9 4.5 9-4.5" />
          <path d="m3 16.5 9 4.5 9-4.5" />
        </svg>
      );
    case "shield":
    case "securityrounded":
      return (
        <svg {...base}>
          <path d="M12 3c3 2 5.5 2.8 8 3v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6c2.5-.2 5-1 8-3Z" />
        </svg>
      );
    case "check":
    case "checkcirclerounded":
      return (
        <svg {...base}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case "star":
      return (
        <svg {...base}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2l-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      );
    case "user":
      return (
        <svg {...base}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );
    default:
      return (
        <svg {...base}>
          <path d="M12 4v16" />
          <path d="M4 12h16" />
        </svg>
      );
  }
}

function useInViewOnce<TElement extends Element>(threshold = 0.2) {
  const ref = useRef<TElement | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    if (hasEnteredView) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setHasEnteredView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasEnteredView, threshold]);

  return { ref, hasEnteredView };
}

function extractNumericMetric(value: string) {
  const match = value.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;

  const raw = match[0];
  const numericValue = Number(raw.replace(",", "."));
  if (Number.isNaN(numericValue)) return null;

  const startIndex = match.index ?? 0;
  const suffix = value.slice(startIndex + raw.length);
  const normalizedSuffix = suffix.trim().toLowerCase();
  let scale = 1;

  if (normalizedSuffix.startsWith("k")) scale = 1000;
  else if (normalizedSuffix.startsWith("m")) scale = 1000000;
  else if (normalizedSuffix.startsWith("b")) scale = 1000000000;

  return {
    value: numericValue * scale,
    decimals: raw.includes(".") || raw.includes(",") ? 1 : 0,
    scale,
    prefix: value.slice(0, startIndex),
    suffix,
  };
}

function formatMetricValue(template: string, nextValue: number) {
  const numericMetric = extractNumericMetric(template);
  if (!numericMetric) return template;

  const displayValue = nextValue / numericMetric.scale;
  return `${numericMetric.prefix}${displayValue.toLocaleString("fr-FR", {
    minimumFractionDigits: numericMetric.decimals,
    maximumFractionDigits: numericMetric.decimals,
  })}${numericMetric.suffix}`;
}

function AnimatedMetricValue({ value, shouldAnimate }: { value: string; shouldAnimate?: boolean }) {
  const [displayValue, setDisplayValue] = useState(() => (shouldAnimate ? formatMetricValue(value, 0) : value));

  useEffect(() => {
    const numericMetric = extractNumericMetric(value);
    if (!shouldAnimate || !numericMetric || numericMetric.suffix.includes("/")) {
      setDisplayValue(value);
      return;
    }

    let animationFrame = 0;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const linearProgress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - (1 - linearProgress) * (1 - linearProgress) * (1 - linearProgress);
      setDisplayValue(formatMetricValue(value, numericMetric.value * easedProgress));
      if (linearProgress < 1) animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [shouldAnimate, value]);

  return <>{displayValue}</>;
}

function Section({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <section className="py-10 md:py-14" id={id}>
      <div className="mx-auto w-[min(1120px,calc(100%-32px))]">{children}</div>
    </section>
  );
}

function ActionButton({
  cta,
  kind = "primary",
  labelPath,
  label,
}: {
  cta?: CtaAction;
  kind?: "primary" | "secondary";
  labelPath?: PageEditorPathSegment[];
  label?: string;
}) {
  const editor = usePageInlineEditor();
  if (!cta) return null;
  const isEditingLink = Boolean(labelPath && editor.enabled && editor.editMode);

  const common =
    "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border px-5 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]";
  const tone =
    kind === "primary"
      ? "border-transparent bg-[var(--primary)] text-[var(--button-text)] shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_26%,transparent)]"
      : "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] text-[var(--text)]";

  const buttonNode = (
    <a
      className={`${common} ${tone}`}
      href={getActionHref(cta.action)}
      onClick={(event) => {
        if (!isEditingLink || !labelPath) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        editor.openEditor({
          path: labelPath,
          label: label ?? "le texte du bouton",
          value: cta.label,
        });
      }}
    >
      {cta.label}
    </a>
  );

  if (!labelPath) {
    return buttonNode;
  }

  return (
    <span className="group/page-edit inline-flex items-center gap-2">
      {buttonNode}
      <InlineEditButton
        label={label ?? "le texte du bouton"}
        path={labelPath}
        value={cta.label}
      />
    </span>
  );
}

function ControlButton({
  direction,
  onClick,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--border)_78%,white)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] text-[var(--text)] shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.16)]"
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        {direction === "left" ? (
          <>
            <path d="M15 5l-7 7 7 7" />
            <path d="M9 12h10" />
          </>
        ) : (
          <>
            <path d="M9 5l7 7-7 7" />
            <path d="M5 12h10" />
          </>
        )}
      </svg>
    </button>
  );
}

function PaginationDot({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className={cx(
        "rounded-full transition duration-200",
        active
          ? "h-2.5 w-7 bg-[var(--primary)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
          : "h-2.5 w-2.5 bg-[color-mix(in_srgb,var(--border)_88%,white)] hover:bg-[var(--primary)]/50",
      )}
      onClick={onClick}
      type="button"
    />
  );
}

function DisclosureIcon({ open }: { open: boolean }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--border)_78%,white)] bg-[color-mix(in_srgb,var(--surface)_94%,white)] text-[var(--text)] shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <svg
        aria-hidden
        className={cx("h-4 w-4 transition duration-200", open && "rotate-180")}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

function GalleryImageFrame({
  src,
  alt,
  height,
  srcEditPath,
  srcEditLabel,
  loadingMode = "lazy",
  priority = "auto",
}: {
  src: string;
  alt: string;
  height: number;
  srcEditPath?: PageEditorPathSegment[];
  srcEditLabel?: string;
  loadingMode?: "eager" | "lazy";
  priority?: "high" | "low" | "auto";
}) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = typeof src === "string" ? src.trim() : "";

  useEffect(() => {
    setHasLoaded(false);
    setHasError(false);
  }, [resolvedSrc]);

  useEffect(() => {
    if (!resolvedSrc) {
      setHasError(true);
      setHasLoaded(false);
      return;
    }

    let isCancelled = false;
    const image = new window.Image();
    image.decoding = "async";

    image.onload = () => {
      if (!isCancelled) {
        setHasLoaded(true);
        setHasError(false);
      }
    };

    image.onerror = () => {
      if (!isCancelled) {
        setHasError(true);
        setHasLoaded(false);
      }
    };

    image.src = resolvedSrc;

    if (image.complete) {
      if (image.naturalWidth > 0) {
        setHasLoaded(true);
        setHasError(false);
      } else {
        setHasError(true);
        setHasLoaded(false);
      }
    }

    return () => {
      isCancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [resolvedSrc]);

  return (
    <div
      className="group/page-edit relative grid overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--image-frame-bg)] p-4"
      style={{ minHeight: height }}
    >
      <InlineEditButton
        alwaysVisible
        className="absolute right-3 top-3 z-10"
        label={srcEditLabel ?? "l'image"}
        path={srcEditPath}
        value={src}
      />
      {!hasLoaded && !hasError ? (
        <div className="absolute inset-4 grid place-items-center rounded-[calc(var(--radius-card)-8px)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface)_92%,white),color-mix(in_srgb,var(--surface-alt)_72%,white))] text-center text-sm text-[var(--text-muted)]">
          <div className="grid gap-2">
            <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,white)]" />
            <p>Chargement du visuel...</p>
          </div>
        </div>
      ) : null}
      {hasError ? (
        <div className="absolute inset-4 grid place-items-center rounded-[calc(var(--radius-card)-8px)] border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_94%,white)] px-4 text-center text-sm text-[var(--text-muted)]">
          {resolvedSrc ? "Impossible de charger cette image." : "Source d'image vide."}
        </div>
      ) : null}
      <img
        alt={alt}
        className={cx(
          "mx-auto block h-auto max-h-full w-auto max-w-full object-contain transition-opacity duration-300",
          hasLoaded && !hasError ? "opacity-100" : "opacity-0",
        )}
        decoding="async"
        fetchPriority={priority}
        loading={loadingMode}
        onError={() => {
          setHasError(true);
          setHasLoaded(false);
        }}
        onLoad={() => {
          setHasLoaded(true);
          setHasError(false);
        }}
        src={resolvedSrc}
        style={{ maxHeight: height - 32 }}
      />
    </div>
  );
}

function renderField(field: FormField, sectionIndex?: number, fieldIndex?: number) {
  const label = (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-[var(--text)]">{field.label}</span>
      <InlineEditButton
        alwaysVisible
        className="h-6 w-6 shrink-0"
        label={`le libelle du champ ${field.name}`}
        path={sectionPath(sectionIndex, "fields", fieldIndex ?? 0, "label")}
        value={field.label}
      />
    </div>
  );
  const inputClasses = "w-full rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)]";

  if (field.type === "select") {
    return (
      <label className="field" key={field.name}>
        {label}
        <select className={inputClasses} defaultValue="" name={field.name} required={field.required}>
          <option disabled value="">
            {field.placeholder ?? "Choisissez une option"}
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="field" key={field.name}>
        {label}
        <textarea className={inputClasses} name={field.name} placeholder={field.placeholder} required={field.required} rows={4} />
      </label>
    );
  }

  return (
    <label className="field" key={field.name}>
      {label}
      <input className={inputClasses} name={field.name} placeholder={field.placeholder} required={field.required} type={field.type} />
    </label>
  );
}

function getAutoFitColumnsStyle(columns: number) {
  const safeColumns = Math.min(Math.max(columns, 1), 4);
  const minWidth = safeColumns >= 4 ? 180 : safeColumns === 3 ? 220 : 260;

  return {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`,
  };
}

export function HeroSection({
  variant = "split",
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  badges,
  media,
  stats,
  sectionIndex,
}: HeroProps & { variant?: string; sectionIndex?: number }) {
  const centered = variant === "centered";
  const hasMedia = Boolean(media?.src || media?.kind);

  function renderMedia() {
    return (
      <div className="group/page-edit relative overflow-hidden rounded-[var(--radius-section)] border border-[var(--border)] bg-[var(--surface)]" style={{ minHeight: 320 }}>
        <InlineEditButton
          alwaysVisible
          className="absolute right-4 top-4 z-10"
          label="l'image du hero"
          path={sectionPath(sectionIndex, "media", "src")}
          value={media?.src ?? ""}
        />
        {media?.kind === "image" && media.src ? (
          <img alt={headline} className="block h-full min-h-[320px] w-full object-cover lg:min-h-[360px]" src={media.src} />
        ) : (
          <div className="grid h-full min-h-[320px] place-items-center gap-2 p-8 text-center">
            <Icon className="h-8 w-8 text-[var(--primary)]" name={media?.kind === "video" ? "sparkles" : "star"} />
            <p className="text-lg font-semibold text-[var(--text)]">{media?.kind === "video" ? "Video" : "Visuel"}</p>
            <p className="text-[var(--text-muted)]">{media?.src ?? "Placeholder genere depuis la configuration JSON."}</p>
            <p className="text-sm text-[var(--text-muted)]">Style: {media?.style ?? "professional"}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Section id="content">
      <div
        className={cx("section-card hero", !centered && hasMedia && "lg:grid-cols-2")}
        style={{
          padding: "clamp(24px, 5vw, 48px)",
          borderRadius: "var(--radius-section)",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--surface) 88%, white), color-mix(in srgb, var(--surface-alt) 92%, white))",
          textAlign: centered ? "center" : "left",
        }}
      >
        <div className={cx("grid gap-6", centered && "justify-items-center")}>
          {eyebrow ? (
            <EditableText
              as="p"
              className="hero-eyebrow"
              label="l'accroche du hero"
              path={sectionPath(sectionIndex, "eyebrow")}
              value={eyebrow}
            />
          ) : null}
          <EditableText
            as="h1"
            className=""
            label="le titre principal"
            multiline
            path={sectionPath(sectionIndex, "headline")}
            value={headline}
          />
          <EditableText
            as="p"
            className="text-lg text-[var(--text-muted)]"
            label="le sous-titre du hero"
            multiline
            path={sectionPath(sectionIndex, "subheadline")}
            value={subheadline}
          />
          <div className="action-row">
            <ActionButton cta={primaryCta} label="le texte du bouton principal du hero" labelPath={sectionPath(sectionIndex, "primaryCta", "label")} />
            <ActionButton cta={secondaryCta} kind="secondary" label="le texte du bouton secondaire du hero" labelPath={sectionPath(sectionIndex, "secondaryCta", "label")} />
          </div>
          {badges?.length ? (
            <div className="badge-row">
              {badges.map((badge, badgeIndex) => (
                <EditableText
                  as="span"
                  className="inline-flex items-center rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-sm font-medium text-[var(--primary)]"
                  key={`${badge}-${badgeIndex}`}
                  label={`le badge ${badgeIndex + 1}`}
                  path={sectionPath(sectionIndex, "badges", badgeIndex)}
                  value={badge}
                />
              ))}
            </div>
          ) : null}
          {stats?.length ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((item, itemIndex) => (
                <div className="card" key={`${item.label}-${item.value}-${itemIndex}`} style={{ borderRadius: "var(--radius-card)" }}>
                  <EditableText
                    as="p"
                    className="text-3xl font-bold text-[var(--text)]"
                    label={`la valeur de statistique ${itemIndex + 1}`}
                    path={sectionPath(sectionIndex, "stats", itemIndex, "value")}
                    value={item.value}
                  />
                  <EditableText
                    as="p"
                    className="mt-1 text-sm text-[var(--text-muted)]"
                    label={`le libelle de statistique ${itemIndex + 1}`}
                    path={sectionPath(sectionIndex, "stats", itemIndex, "label")}
                    value={item.label}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {!centered && hasMedia ? renderMedia() : null}
        {centered && hasMedia ? <div className="mx-auto w-full max-w-4xl">{renderMedia()}</div> : null}
      </div>
    </Section>
  );
}

export function BenefitsSection({
  variant = "cards",
  title,
  subtitle,
  columns = 3,
  items,
  sectionIndex,
}: BenefitsProps & { variant?: string; sectionIndex?: number }) {
  return (
    <Section id={getBenefitsSectionId(title)}>
      <div className="section-card p-6 md:p-8" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="mb-6 grid gap-2">
          <EditableText as="h2" label="le titre de la section avantages" path={sectionPath(sectionIndex, "title")} value={title} />
          {subtitle ? (
            <EditableText
              as="p"
              className="text-[var(--text-muted)]"
              label="le sous-titre de la section avantages"
              multiline
              path={sectionPath(sectionIndex, "subtitle")}
              value={subtitle}
            />
          ) : null}
        </div>
        <div className="grid gap-6" style={getAutoFitColumnsStyle(columns)}>
          {items.map((item, itemIndex) => (
            <div className="card h-full" key={`${item.title}-${itemIndex}`} style={{ borderRadius: "var(--radius-card)" }}>
              <div className="grid gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--primary)] text-[var(--button-text)]">
                  <Icon className="h-6 w-6" name={item.icon} />
                </div>
                <EditableText
                  as="h3"
                  className="text-xl font-semibold text-[var(--text)]"
                  label={`le titre de l'avantage ${itemIndex + 1}`}
                  path={sectionPath(sectionIndex, "items", itemIndex, "title")}
                  value={item.title}
                />
                <EditableText
                  as="p"
                  className="text-[var(--text-muted)]"
                  label={`la description de l'avantage ${itemIndex + 1}`}
                  multiline
                  path={sectionPath(sectionIndex, "items", itemIndex, "description")}
                  value={item.description}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function TestimonialsSection({
  title,
  items,
  variant = "grid",
  sectionIndex,
}: TestimonialsProps & { variant?: string; sectionIndex?: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = items.length === 0 ? 0 : activeIndex % items.length;

  function renderTestimonialCard(item: TestimonialsProps["items"][number], itemIndex: number) {
    return (
      <div className="card" key={`${item.name}-${item.quote}-${itemIndex}`} style={{ borderRadius: "var(--radius-card)" }}>
        <div className="grid gap-4">
          <div className="flex gap-1">
            {Array.from({ length: item.rating }).map((_, index) => (
              <Icon className="h-4 w-4 text-[var(--primary)]" key={`${item.name}-${index}`} name="star" />
            ))}
          </div>
          <p className="group/page-edit text-[var(--text-muted)]">
            &quot;{item.quote}&quot;
            <InlineEditButton
              label={`le temoignage ${itemIndex + 1}`}
              multiline
              path={sectionPath(sectionIndex, "items", itemIndex, "quote")}
              value={item.quote}
            />
          </p>
          <div>
            <EditableText
              as="p"
              className="font-semibold text-[var(--text)]"
              label={`le nom du client ${itemIndex + 1}`}
              path={sectionPath(sectionIndex, "items", itemIndex, "name")}
              value={item.name}
            />
            <EditableText
              as="p"
              className="text-sm text-[var(--text-muted)]"
              label={`le role du client ${itemIndex + 1}`}
              path={sectionPath(sectionIndex, "items", itemIndex, "role")}
              value={item.role}
            />
          </div>
        </div>
      </div>
    );
  }

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }

  return (
    <Section id="testimonials">
      <div className="section-card p-6 md:p-8" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="grid gap-6">
          <EditableText as="h2" label="le titre des temoignages" path={sectionPath(sectionIndex, "title")} value={title} />
          {variant === "carousel" && items.length > 0 ? (
            <div className="grid gap-4">
              {renderTestimonialCard(items[safeIndex], safeIndex)}
              <div className="flex items-center justify-between">
                <ControlButton direction="left" label="Temoignage precedent" onClick={goToPrevious} />
                <div className="flex gap-2">
                  {items.map((item, index) => (
                    <PaginationDot
                      active={index === safeIndex}
                      key={`${item.name}-${index}-dot`}
                      label={`Aller au temoignage ${index + 1}`}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
                <ControlButton direction="right" label="Temoignage suivant" onClick={goToNext} />
              </div>
            </div>
          ) : variant === "single" && items.length > 0 ? (
            renderTestimonialCard(items[0], 0)
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, itemIndex) => renderTestimonialCard(item, itemIndex))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export function LeadFormSection({
  variant = "stacked",
  title,
  submitLabel,
  fields,
  successMessage,
  sectionIndex,
}: FormProps & { variant?: string; sectionIndex?: number }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Section id="lead-form">
      <div className="section-card p-6 md:p-8" id="form" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="grid gap-6">
          <EditableText as="h2" label="le titre du formulaire" path={sectionPath(sectionIndex, "title")} value={title} />
          {submitted ? (
            <EditableText
              as="div"
              className="success-box"
              label="le message de succes du formulaire"
              multiline
              path={sectionPath(sectionIndex, "successMessage")}
              value={successMessage}
            />
          ) : null}
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className={cx("grid gap-4", variant === "inline" && "md:grid-cols-2")}>
              {fields.map((field, fieldIndex) => renderField(field, sectionIndex, fieldIndex))}
            </div>
            <div className="group/page-edit mt-6 inline-flex items-center gap-2">
              <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--primary)] px-5 py-3 font-semibold text-[var(--button-text)] shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_color-mix(in_srgb,var(--primary)_34%,transparent)]" type="submit">
                {submitLabel}
              </button>
              <InlineEditButton
                label="le texte du bouton du formulaire"
                path={sectionPath(sectionIndex, "submitLabel")}
                value={submitLabel}
              />
            </div>
          </form>
        </div>
      </div>
    </Section>
  );
}

export function FaqSection({ title, items, sectionIndex }: FaqProps & { sectionIndex?: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq">
      <div className="section-card p-6 md:p-8" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="grid gap-4">
          <EditableText as="h2" label="le titre de la FAQ" path={sectionPath(sectionIndex, "title")} value={title} />
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div className="rounded-[var(--radius-card)] border border-[var(--border)]" key={`${item.question}-${index}`}>
                <div className="flex items-center gap-3 px-5 py-4 transition hover:bg-[color-mix(in_srgb,var(--surface-alt)_38%,transparent)]">
                  <button className="flex flex-1 items-center justify-between gap-4 text-left" onClick={() => setOpenIndex(isOpen ? null : index)} type="button">
                    <span className="font-semibold text-[var(--text)]">{item.question}</span>
                    <DisclosureIcon open={isOpen} />
                  </button>
                  <InlineEditButton
                    alwaysVisible
                    label={`la question ${index + 1}`}
                    path={sectionPath(sectionIndex, "items", index, "question")}
                    value={item.question}
                  />
                </div>
                {isOpen ? (
                  <EditableText
                    as="div"
                    className="px-5 pb-5 text-[var(--text-muted)]"
                    label={`la reponse ${index + 1}`}
                    multiline
                    path={sectionPath(sectionIndex, "items", index, "answer")}
                    value={item.answer}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

export function CtaBannerSection({
  headline,
  subheadline,
  primaryCta,
  sectionIndex,
}: CtaBannerProps & { sectionIndex?: number }) {
  return (
    <Section id="cta-banner">
      <div className="grid gap-4 rounded-[var(--radius-section)] p-6 text-[var(--button-text)] md:p-8" style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))" }}>
        <EditableText
          as="h3"
          className="text-3xl font-bold text-[var(--button-text)]"
          label="le titre du bandeau CTA"
          multiline
          path={sectionPath(sectionIndex, "headline")}
          value={headline}
        />
        <EditableText
          as="p"
          className="text-[var(--button-text)] opacity-90"
          label="le texte du bandeau CTA"
          multiline
          path={sectionPath(sectionIndex, "subheadline")}
          value={subheadline}
        />
        <ActionButton cta={primaryCta} kind="secondary" label="le texte du bouton CTA" labelPath={sectionPath(sectionIndex, "primaryCta", "label")} />
      </div>
    </Section>
  );
}

export function TrustBarSection({ items, sectionIndex }: TrustBarProps & { sectionIndex?: number }) {
  return (
    <Section id="trust-bar">
      <div className="section-card p-6" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="flex flex-wrap gap-3">
          {items.map((item, itemIndex) => (
            <span
              className="group/page-edit inline-flex items-center gap-2 rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)]"
              key={`${item}-${itemIndex}`}
            >
              <Icon className="h-4 w-4 text-[var(--primary)]" name="check" />
              {item}
              <InlineEditButton
                label={`l'element de confiance ${itemIndex + 1}`}
                path={sectionPath(sectionIndex, "items", itemIndex)}
                value={item}
              />
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function StatsSection({
  items,
  variant = "cards",
  animate = false,
  sectionIndex,
}: StatsProps & { variant?: string; sectionIndex?: number }) {
  const { ref, hasEnteredView } = useInViewOnce<HTMLDivElement>(0.25);
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    if (!animate || !hasEnteredView) {
      setProgressReady(false);
      return;
    }
    const timeout = window.setTimeout(() => setProgressReady(true), 120);
    return () => window.clearTimeout(timeout);
  }, [animate, hasEnteredView]);

  if (variant === "progress") {
    return (
      <Section id="stats">
        <div className="section-card p-6 md:p-8" ref={ref} style={{ borderRadius: "var(--radius-section)" }}>
          <div className="grid gap-5">
            {items.map((item, itemIndex) => {
              const progressValue =
                typeof item.progress === "number"
                  ? Math.min(Math.max(item.progress, 0), 100)
                  : Math.min(Math.max(extractNumericMetric(item.value)?.value ?? 0, 0), 100);

              return (
                <div className="grid gap-2" key={`${item.label}-${item.value}-${itemIndex}`}>
                  <div className="flex items-center justify-between gap-4">
                    <EditableText
                      as="p"
                      className="font-semibold text-[var(--text)]"
                      label={`le libelle de statistique ${itemIndex + 1}`}
                      path={sectionPath(sectionIndex, "items", itemIndex, "label")}
                      value={item.label}
                    />
                    <p className="text-[var(--text-muted)]">
                      <span className="group/page-edit">
                        <AnimatedMetricValue shouldAnimate={animate && hasEnteredView} value={item.value} />
                        <InlineEditButton
                          label={`la valeur de statistique ${itemIndex + 1}`}
                          path={sectionPath(sectionIndex, "items", itemIndex, "value")}
                          value={item.value}
                        />
                      </span>
                    </p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--progress-track)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${animate ? (progressReady ? progressValue : 0) : progressValue}%`,
                        background: "linear-gradient(90deg, var(--primary), var(--primary-dark))",
                        transition: animate ? "width 900ms ease" : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section id="stats">
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4" ref={ref}>
        {items.map((item, itemIndex) => (
          <div className="card" key={`${item.label}-${item.value}-${itemIndex}`} style={{ borderRadius: "var(--radius-card)" }}>
            <p className="group/page-edit text-4xl font-bold text-[var(--text)]">
              <AnimatedMetricValue shouldAnimate={animate && hasEnteredView} value={item.value} />
              <InlineEditButton
                label={`la valeur de statistique ${itemIndex + 1}`}
                path={sectionPath(sectionIndex, "items", itemIndex, "value")}
                value={item.value}
              />
            </p>
            <EditableText
              as="p"
              className="mt-2 text-[var(--text-muted)]"
              label={`le libelle de statistique ${itemIndex + 1}`}
              path={sectionPath(sectionIndex, "items", itemIndex, "label")}
              value={item.label}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

export function StepsSection({ title, items, sectionIndex }: StepsProps & { sectionIndex?: number }) {
  return (
    <Section id="steps">
      <div className="section-card p-6 md:p-8" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="grid gap-6">
          <EditableText as="h2" label="le titre des etapes" path={sectionPath(sectionIndex, "title")} value={title} />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, itemIndex) => (
              <div className="card" key={`${item.step}-${item.title}-${itemIndex}`} style={{ borderRadius: "var(--radius-card)" }}>
                <div className="grid gap-4">
                  <span className="group/page-edit inline-flex w-fit rounded-[var(--radius-chip)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
                    Etape {item.step}
                    <InlineEditButton
                      label={`le numero d'etape ${itemIndex + 1}`}
                      path={sectionPath(sectionIndex, "items", itemIndex, "step")}
                      value={item.step}
                    />
                  </span>
                  <EditableText
                    as="h3"
                    className="text-xl font-semibold text-[var(--text)]"
                    label={`le titre de l'etape ${itemIndex + 1}`}
                    path={sectionPath(sectionIndex, "items", itemIndex, "title")}
                    value={item.title}
                  />
                  <EditableText
                    as="p"
                    className="text-[var(--text-muted)]"
                    label={`la description de l'etape ${itemIndex + 1}`}
                    multiline
                    path={sectionPath(sectionIndex, "items", itemIndex, "description")}
                    value={item.description}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function ComparisonSection({ columns, rows, sectionIndex }: ComparisonProps & { sectionIndex?: number }) {
  return (
    <Section id="comparison">
      <div className="overflow-hidden rounded-[var(--radius-section)] border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="comparison-table">
            <thead>
              <tr>
                {columns.map((column, columnIndex) => (
                  <th key={`${column}-${columnIndex}`}>
                    <EditableText
                      as="span"
                      label={`l'en-tete de colonne ${columnIndex + 1}`}
                      path={sectionPath(sectionIndex, "columns", columnIndex)}
                      value={column}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.join("-")}-${index}`}>
                  {row.map((value, valueIndex) => (
                    <td key={`${value}-${valueIndex}`}>
                      <EditableText
                        as="span"
                        label={`la cellule ${index + 1}-${valueIndex + 1}`}
                        path={sectionPath(sectionIndex, "rows", index, valueIndex)}
                        value={value}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

export function ImageSection({ src, alt, sectionIndex }: ImageProps & { sectionIndex?: number }) {
  return (
    <Section id="gallery">
      <div className="group/page-edit relative overflow-hidden rounded-[var(--radius-section)] border border-[var(--border)]">
        <InlineEditButton
          alwaysVisible
          className="absolute right-4 top-4 z-10"
          label="l'image principale"
          path={sectionPath(sectionIndex, "src")}
          value={src}
        />
        <img alt={alt} className="section-image" src={src} />
      </div>
    </Section>
  );
}

export function GallerySection({
  title,
  subtitle,
  items,
  variant = "grid",
  sectionIndex,
}: GalleryProps & { variant?: string; sectionIndex?: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = items.length === 0 ? 0 : activeIndex % items.length;

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }

  return (
    <Section id="gallery">
      <div className="section-card p-6 md:p-8" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="grid gap-6">
          {title ? (
            <EditableText as="h2" label="le titre de la galerie" path={sectionPath(sectionIndex, "title")} value={title} />
          ) : null}
          {subtitle ? (
            <EditableText
              as="p"
              className="text-[var(--text-muted)]"
              label="le sous-titre de la galerie"
              multiline
              path={sectionPath(sectionIndex, "subtitle")}
              value={subtitle}
            />
          ) : null}

          {variant === "carousel" && items.length > 0 ? (
            <div className="grid gap-4">
              <GalleryImageFrame
                alt={items[safeIndex].alt}
                height={440}
                loadingMode="eager"
                priority="high"
                src={items[safeIndex].src}
                srcEditLabel={`l'image ${safeIndex + 1} de la galerie`}
                srcEditPath={sectionPath(sectionIndex, "items", safeIndex, "src")}
              />
              <div className="flex items-center justify-between">
                <ControlButton direction="left" label="Image precedente" onClick={goToPrevious} />
                <div className="flex gap-2">
                  {items.map((item, index) => (
                    <PaginationDot
                      active={index === safeIndex}
                      key={`${item.alt}-${index}-dot`}
                      label={`Aller a l'image ${index + 1}`}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
                <ControlButton direction="right" label="Image suivante" onClick={goToNext} />
              </div>
            </div>
          ) : variant === "masonry" ? (
            <div className="columns-1 gap-6 md:columns-3">
              {items.map((item, index) => (
                <div className="mb-6" key={`${item.alt}-${index}`}>
                  <GalleryImageFrame
                    alt={item.alt}
                    height={index % 2 === 0 ? 260 : 340}
                    loadingMode="eager"
                    priority={index < 3 ? "high" : "auto"}
                    src={item.src}
                    srcEditLabel={`l'image ${index + 1} de la galerie`}
                    srcEditPath={sectionPath(sectionIndex, "items", index, "src")}
                  />
                </div>
              ))}
            </div>
          ) : variant === "stacked" ? (
            <div className="grid gap-6">
              {items.map((item, index) => (
                <GalleryImageFrame
                  alt={item.alt}
                  height={380}
                  key={`${item.alt}-${index}`}
                  loadingMode="eager"
                  priority={index < 3 ? "high" : "auto"}
                  src={item.src}
                  srcEditLabel={`l'image ${index + 1} de la galerie`}
                  srcEditPath={sectionPath(sectionIndex, "items", index, "src")}
                />
              ))}
            </div>
          ) : variant === "split" && items.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <GalleryImageFrame
                alt={items[0].alt}
                height={420}
                loadingMode="eager"
                priority="high"
                src={items[0].src}
                srcEditLabel="l'image principale de la galerie"
                srcEditPath={sectionPath(sectionIndex, "items", 0, "src")}
              />
              <div className="grid gap-6">
                {items.slice(1, 3).map((item, index) => (
                  <GalleryImageFrame
                    alt={item.alt}
                    height={220}
                    key={`${item.alt}-${index}`}
                    loadingMode="eager"
                    priority="high"
                    src={item.src}
                    srcEditLabel={`l'image ${index + 2} de la galerie`}
                    srcEditPath={sectionPath(sectionIndex, "items", index + 1, "src")}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item, index) => (
                <GalleryImageFrame
                  alt={item.alt}
                  height={300}
                  key={`${item.alt}-${index}`}
                  loadingMode="eager"
                  priority={index < 3 ? "high" : "auto"}
                  src={item.src}
                  srcEditLabel={`l'image ${index + 1} de la galerie`}
                  srcEditPath={sectionPath(sectionIndex, "items", index, "src")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export function VideoSection({ url }: VideoProps) {
  const videoUrl = useMemo(() => {
    if (url.includes("youtube.com/embed")) return url;
    if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/");
    return url;
  }, [url]);

  return (
    <Section id="video">
      <div className="overflow-hidden rounded-[var(--radius-section)] border border-[var(--border)]">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="video-frame"
          src={videoUrl}
          title="Video section"
        />
      </div>
    </Section>
  );
}

export function RichTextSection({ content, align = "left", sectionIndex }: RichTextProps & { sectionIndex?: number }) {
  return (
    <Section id="rich-text">
      <div className={cx("section-card rich-text group/page-edit relative", align === "left" && "rich-text-left", align === "center" && "rich-text-center", align === "right" && "rich-text-right")} style={{ borderRadius: "var(--radius-section)" }}>
        <InlineEditButton
          alwaysVisible
          className="absolute right-4 top-4 z-10"
          label="le contenu riche"
          multiline
          path={sectionPath(sectionIndex, "content")}
          value={content}
        />
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </Section>
  );
}

export function CountdownSection({ endAt, label, sectionIndex }: CountdownProps & { sectionIndex?: number }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function updateRemaining() {
      const endDate = new Date(endAt).getTime();
      const diff = endDate - Date.now();
      if (Number.isNaN(endDate) || diff <= 0) {
        setRemaining("Termine");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [endAt]);

  return (
    <Section id="countdown">
      <div className="card" style={{ borderRadius: "var(--radius-card)" }}>
        <div className="grid gap-2">
          <EditableText
            as="h3"
            className="text-xl font-semibold text-[var(--text)]"
            label="le libelle du compte a rebours"
            path={sectionPath(sectionIndex, "label")}
            value={label}
          />
          <p className="text-4xl font-bold text-[var(--primary)]">{remaining}</p>
        </div>
      </div>
    </Section>
  );
}

export function PricingSection({ plans, sectionIndex }: PricingProps & { sectionIndex?: number }) {
  return (
    <Section id="pricing">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan, planIndex) => (
          <div
            className="card h-full"
            key={`${plan.name}-${planIndex}`}
            style={{
              borderRadius: "var(--radius-card)",
              borderColor: plan.highlight ? "var(--primary)" : "var(--border)",
              boxShadow: plan.highlight ? "0 0 0 2px rgba(0,0,0,0.03)" : "none",
            }}
          >
            <div className="grid gap-4">
              <EditableText
                as="h3"
                className="text-xl font-semibold text-[var(--text)]"
                label={`le nom de l'offre ${planIndex + 1}`}
                path={sectionPath(sectionIndex, "plans", planIndex, "name")}
                value={plan.name}
              />
              <EditableText
                as="p"
                className="text-4xl font-bold text-[var(--primary)]"
                label={`le prix de l'offre ${planIndex + 1}`}
                path={sectionPath(sectionIndex, "plans", planIndex, "price")}
                value={plan.price}
              />
              <div className="grid gap-3">
                {plan.features.map((feature, featureIndex) => (
                  <div className="flex items-center gap-2" key={`${feature}-${featureIndex}`}>
                    <Icon className="h-4 w-4 text-[var(--primary)]" name="check" />
                    <EditableText
                      as="p"
                      className="text-[var(--text-muted)]"
                      label={`la fonctionnalite ${featureIndex + 1} de l'offre ${planIndex + 1}`}
                      path={sectionPath(sectionIndex, "plans", planIndex, "features", featureIndex)}
                      value={feature}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function LogoCloudSection({ logos }: LogoCloudProps) {
  return (
    <Section id="logos">
      <div className="section-card p-6" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {logos.map((logo) => (
            <div className="grid min-h-[100px] place-items-center rounded-[var(--radius-inner)] border border-[var(--border)] p-4" key={logo}>
              <img alt="Logo partenaire" className="max-h-[46px] max-w-full object-contain" src={logo} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function NavbarSection({
  logoText,
  links,
  cta,
  sticky = true,
  transparent = false,
  showOnScroll = false,
  variant = "classic",
  sectionIndex,
}: NavbarProps & { variant?: string; sectionIndex?: number }) {
  const editor = usePageInlineEditor();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const centered = variant === "centered";
  const editorial = variant === "editorial";
  const minimal = variant === "minimal";
  const shouldHideOnScroll = sticky && showOnScroll;
  const spacerClassName = editorial
    ? "h-[68px] lg:h-[84px]"
    : minimal
      ? "h-[68px] lg:h-[64px]"
      : "h-[68px] lg:h-[76px]";

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    document.documentElement.style.overflow = mobileMenuOpen ? "hidden" : "";

    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!shouldHideOnScroll) {
      setHeaderVisible(true);
      return;
    }

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 24) {
        setHeaderVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY + 8) {
        setHeaderVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldHideOnScroll]);

  return (
    <>
      {sticky ? <div aria-hidden className={spacerClassName} /> : null}
      <header
        className={cx(
          "navbar",
          sticky ? "fixed inset-x-0 top-0" : "relative",
          transparent && "navbar-transparent",
          !transparent && "navbar-solid",
          shouldHideOnScroll && (headerVisible ? "translate-y-0" : "-translate-y-full"),
        )}
      >
        <div className={cx("navbar-inner", centered && "lg:grid lg:grid-cols-[1fr_auto_1fr]", editorial && "lg:min-h-[84px]", minimal && "lg:min-h-[64px]")}>
          <EditableText
            as="p"
            className={cx("text-lg font-extrabold text-[var(--text)]", centered && "lg:justify-self-start")}
            label="le logo texte de la navigation"
            path={sectionPath(sectionIndex, "logoText")}
            value={logoText}
          />
          <nav className={cx("nav-links hidden lg:flex", centered && "lg:justify-self-center", editorial && "lg:gap-7", minimal && "lg:gap-5")}>
            {links.map((link, linkIndex) => (
              <span className="group/page-edit inline-flex items-center gap-2" key={`${link.href}-${link.label}-${linkIndex}`}>
                <a
                  className="text-sm font-medium text-[var(--text)] transition hover:text-[var(--primary)]"
                  href={link.href}
                  onClick={(event) => {
                    if (!editor.enabled || !editor.editMode) {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    editor.openEditor({
                      path: sectionPath(sectionIndex, "links", linkIndex, "label"),
                      label: `le lien ${linkIndex + 1} du menu`,
                      value: link.label,
                    });
                  }}
                >
                  {link.label}
                </a>
                <InlineEditButton
                  label={`le lien ${linkIndex + 1} du menu`}
                  path={sectionPath(sectionIndex, "links", linkIndex, "label")}
                  value={link.label}
                />
              </span>
            ))}
          </nav>
          <div className={cx("flex items-center gap-3", centered && "lg:justify-self-end")}>
            <LanguageSwitcher />
            <div className="hidden lg:block">
              <ActionButton cta={cta} label="le bouton de navigation" labelPath={sectionPath(sectionIndex, "cta", "label")} />
            </div>
            <button
              aria-label="Ouvrir le menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
            >
              <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/45"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMobileMenu();
          }}
          role="dialog"
        >
          <div className="ml-auto flex h-full w-[min(92vw,380px)] flex-col gap-6 border-l border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <EditableText
                as="p"
                className="text-lg font-extrabold text-[var(--text)]"
                label="le logo texte du menu mobile"
                path={sectionPath(sectionIndex, "logoText")}
                value={logoText}
              />
              <button
                aria-label="Fermer le menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)]"
                onClick={closeMobileMenu}
                type="button"
              >
                <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="h-px bg-[var(--border)]" />
            <LanguageSwitcher mobile onSelect={closeMobileMenu} />
            <div className="h-px bg-[var(--border)]" />
            <nav className="grid gap-4">
              {links.map((link, linkIndex) => (
                <span className="group/page-edit inline-flex items-center gap-2" key={`${link.href}-${link.label}-mobile-${linkIndex}`}>
                  <a
                    className="text-base font-medium text-[var(--text)]"
                    href={link.href}
                    onClick={(event) => {
                      if (editor.enabled && editor.editMode) {
                        event.preventDefault();
                        event.stopPropagation();
                        editor.openEditor({
                          path: sectionPath(sectionIndex, "links", linkIndex, "label"),
                          label: `le lien mobile ${linkIndex + 1}`,
                          value: link.label,
                        });
                        return;
                      }

                      closeMobileMenu();
                    }}
                  >
                    {link.label}
                  </a>
                  <InlineEditButton
                    label={`le lien mobile ${linkIndex + 1}`}
                    path={sectionPath(sectionIndex, "links", linkIndex, "label")}
                    value={link.label}
                  />
                </span>
              ))}
            </nav>
            <div className="h-px bg-[var(--border)]" />
            <div className="grid" onClick={closeMobileMenu}>
              <ActionButton cta={cta} label="le bouton du menu mobile" labelPath={sectionPath(sectionIndex, "cta", "label")} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function FooterSection({ columns, sectionIndex }: FooterProps & { sectionIndex?: number }) {
  const editor = usePageInlineEditor();
  return (
    <Section id="footer">
      <div className="section-card p-6 md:p-8" style={{ borderRadius: "var(--radius-section)" }}>
        <div className="grid gap-8 md:grid-cols-3">
          {columns.map((column, columnIndex) => (
            <div className="grid gap-3" key={`${column.title}-${columnIndex}`}>
              <EditableText
                as="h3"
                className="text-lg font-semibold text-[var(--text)]"
                label={`le titre de colonne footer ${columnIndex + 1}`}
                path={sectionPath(sectionIndex, "columns", columnIndex, "title")}
                value={column.title}
              />
              {column.links.map((link, linkIndex) => (
                <span className="group/page-edit inline-flex items-center gap-2" key={`${column.title}-${link.href}-${link.label}-${linkIndex}`}>
                  <a
                    className="text-[var(--text-muted)] transition hover:text-[var(--text)]"
                    href={link.href}
                    onClick={(event) => {
                      if (!editor.enabled || !editor.editMode) {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      editor.openEditor({
                        path: sectionPath(sectionIndex, "columns", columnIndex, "links", linkIndex, "label"),
                        label: `le lien ${linkIndex + 1} du footer`,
                        value: link.label,
                      });
                    }}
                  >
                    {link.label}
                  </a>
                  <InlineEditButton
                    label={`le lien ${linkIndex + 1} du footer`}
                    path={sectionPath(sectionIndex, "columns", columnIndex, "links", linkIndex, "label")}
                    value={link.label}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
