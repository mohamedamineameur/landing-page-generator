"use client";

import React from "react";
import {
  BenefitsSection,
  ComparisonSection,
  CountdownSection,
  CtaBannerSection,
  FooterSection,
  FaqSection,
  GallerySection,
  HeroSection,
  ImageSection,
  LeadFormSection,
  LogoCloudSection,
  NavbarSection,
  PricingSection,
  RichTextSection,
  StatsSection,
  StepsSection,
  TestimonialsSection,
  TrustBarSection,
  VideoSection,
} from "@/components/sections";

// ==============================
// Types communs
// ==============================

export type KnownComponentType =
  | "hero"
  | "benefits"
  | "testimonials"
  | "form"
  | "faq"
  | "cta_banner"
  | "trust_bar"
  | "stats"
  | "steps"
  | "comparison"
  | "image"
  | "gallery"
  | "video"
  | "rich_text"
  | "countdown"
  | "pricing"
  | "logo_cloud"
  | "navbar"
  | "footer";

export interface CtaAction {
  label: string;
  action: string;
}

export interface BaseSection<TType extends string, TProps> {
  type: TType;
  variant?: string;
  props: TProps;
}

// ==============================
// Props de chaque composant
// ==============================

export interface HeroProps {
  eyebrow?: string;
  headline: string;
  subheadline: string;
  primaryCta?: CtaAction;
  secondaryCta?: CtaAction;
  badges?: string[];
  stats?: Array<{
    value: string;
    label: string;
  }>;
  media?: {
    kind: "image" | "video";
    style: string;
    src?: string;
  };
}

export interface BenefitsProps {
  title: string;
  subtitle?: string;
  columns?: number;
  items: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

export interface TestimonialsProps {
  title: string;
  items: Array<{
    name: string;
    role: string;
    quote: string;
    rating: number;
  }>;
}

export interface FormField {
  type: "text" | "email" | "tel" | "number" | "textarea" | "select";
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormProps {
  title: string;
  submitLabel: string;
  fields: FormField[];
  successMessage: string;
}

export interface FaqProps {
  title: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export interface CtaBannerProps {
  headline: string;
  subheadline: string;
  primaryCta: CtaAction;
}

export interface TrustBarProps {
  items: string[];
}

export interface StatsProps {
  items: Array<{
    value: string;
    label: string;
    progress?: number;
  }>;
  animate?: boolean;
}

export interface StepsProps {
  title: string;
  items: Array<{
    step: string;
    title: string;
    description: string;
  }>;
}

export interface ComparisonProps {
  columns: string[];
  rows: string[][];
}

export interface ImageProps {
  src: string;
  alt: string;
}

export interface GalleryProps {
  title?: string;
  subtitle?: string;
  items: Array<{
    src: string;
    alt: string;
  }>;
}

export interface VideoProps {
  url: string;
}

export interface RichTextProps {
  content: string;
  align?: "left" | "center" | "right";
}

export interface CountdownProps {
  endAt: string;
  label: string;
}

export interface PricingProps {
  plans: Array<{
    name: string;
    price: string;
    features: string[];
    highlight?: boolean;
  }>;
}

export interface LogoCloudProps {
  logos: string[];
}

export interface NavbarProps {
  logoText: string;
  links: Array<{
    label: string;
    href: string;
  }>;
  cta?: CtaAction;
  sticky?: boolean;
  transparent?: boolean;
  showOnScroll?: boolean;
}

export interface FooterProps {
  columns: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
}

// ==============================
// Map type -> props
// ==============================

export interface ComponentPropsMap {
  hero: HeroProps;
  benefits: BenefitsProps;
  testimonials: TestimonialsProps;
  form: FormProps;
  faq: FaqProps;
  cta_banner: CtaBannerProps;
  trust_bar: TrustBarProps;
  stats: StatsProps;
  steps: StepsProps;
  comparison: ComparisonProps;
  image: ImageProps;
  gallery: GalleryProps;
  video: VideoProps;
  rich_text: RichTextProps;
  countdown: CountdownProps;
  pricing: PricingProps;
  logo_cloud: LogoCloudProps;
  navbar: NavbarProps;
  footer: FooterProps;
}

// ==============================
// Types des sections dynamiques
// ==============================

export type HeroSectionData = BaseSection<"hero", HeroProps>;
export type BenefitsSectionData = BaseSection<"benefits", BenefitsProps>;
export type TestimonialsSectionData = BaseSection<"testimonials", TestimonialsProps>;
export type FormSectionData = BaseSection<"form", FormProps>;
export type FaqSectionData = BaseSection<"faq", FaqProps>;
export type CtaBannerSectionData = BaseSection<"cta_banner", CtaBannerProps>;
export type TrustBarSectionData = BaseSection<"trust_bar", TrustBarProps>;
export type StatsSectionData = BaseSection<"stats", StatsProps>;
export type StepsSectionData = BaseSection<"steps", StepsProps>;
export type ComparisonSectionData = BaseSection<"comparison", ComparisonProps>;
export type ImageSectionData = BaseSection<"image", ImageProps>;
export type GallerySectionData = BaseSection<"gallery", GalleryProps>;
export type VideoSectionData = BaseSection<"video", VideoProps>;
export type RichTextSectionData = BaseSection<"rich_text", RichTextProps>;
export type CountdownSectionData = BaseSection<"countdown", CountdownProps>;
export type PricingSectionData = BaseSection<"pricing", PricingProps>;
export type LogoCloudSectionData = BaseSection<"logo_cloud", LogoCloudProps>;
export type NavbarSectionData = BaseSection<"navbar", NavbarProps>;
export type FooterSectionData = BaseSection<"footer", FooterProps>;

export type KnownPageSection =
  | HeroSectionData
  | BenefitsSectionData
  | TestimonialsSectionData
  | FormSectionData
  | FaqSectionData
  | CtaBannerSectionData
  | TrustBarSectionData
  | StatsSectionData
  | StepsSectionData
  | ComparisonSectionData
  | ImageSectionData
  | GallerySectionData
  | VideoSectionData
  | RichTextSectionData
  | CountdownSectionData
  | PricingSectionData
  | LogoCloudSectionData
  | NavbarSectionData
  | FooterSectionData;

export interface UnknownSectionData extends BaseSection<string, Record<string, unknown>> {}

export type PageSection = KnownPageSection | UnknownSectionData;

// ==============================
// Signature composant dynamique
// ==============================

export type DynamicSectionComponent<TProps> = React.ComponentType<
  TProps & { variant?: string }
>;

export interface ComponentRegistryEntry<TProps> {
  component: DynamicSectionComponent<TProps>;
  allowedVariants?: string[];
  description: string;
}

// ==============================
// Registry principal
// ==============================

export const componentRegistry: {
  [K in KnownComponentType]: ComponentRegistryEntry<ComponentPropsMap[K]>;
} = {
  hero: {
    component: HeroSection,
    allowedVariants: ["centered", "split", "image_right", "form_right"],
    description: "Main hero section at the top of the page",
  },
  benefits: {
    component: BenefitsSection,
    allowedVariants: ["cards", "list", "icons", "split"],
    description: "List of benefits or advantages",
  },
  testimonials: {
    component: TestimonialsSection,
    allowedVariants: ["grid", "carousel", "single"],
    description: "Customer testimonials",
  },
  form: {
    component: LeadFormSection,
    allowedVariants: ["stacked", "inline", "card"],
    description: "Lead capture form",
  },
  faq: {
    component: FaqSection,
    description: "Frequently asked questions",
  },
  cta_banner: {
    component: CtaBannerSection,
    description: "Call to action section",
  },
  trust_bar: {
    component: TrustBarSection,
    description: "Trust elements (badges, guarantees)",
  },
  stats: {
    component: StatsSection,
    allowedVariants: ["cards", "progress"],
    description: "Key metrics display",
  },
  steps: {
    component: StepsSection,
    description: "Step by step process",
  },
  comparison: {
    component: ComparisonSection,
    description: "Comparison table",
  },
  image: {
    component: ImageSection,
    description: "Image block",
  },
  gallery: {
    component: GallerySection,
    allowedVariants: ["grid", "carousel", "masonry", "stacked", "split"],
    description: "Gallery of images",
  },
  video: {
    component: VideoSection,
    description: "Video block",
  },
  rich_text: {
    component: RichTextSection,
    description: "Text content",
  },
  countdown: {
    component: CountdownSection,
    description: "Countdown timer",
  },
  pricing: {
    component: PricingSection,
    description: "Pricing cards",
  },
  logo_cloud: {
    component: LogoCloudSection,
    description: "Client logos",
  },
  navbar: {
    component: NavbarSection,
    description: "Top navigation",
  },
  footer: {
    component: FooterSection,
    description: "Footer section",
  },
};

// ==============================
// Helpers
// ==============================

export function isSupportedComponentType(value: string): value is KnownComponentType {
  return value in componentRegistry;
}

export function isValidVariant(type: KnownComponentType, variant?: string): boolean {
  if (!variant) return true;
  const allowedVariants = componentRegistry[type].allowedVariants;
  if (!allowedVariants) return true;
  return allowedVariants.includes(variant);
}

// ==============================
// Fallback composant inconnu
// ==============================

export function UnknownSection({
  type,
  variant,
}: {
  type: string;
  variant?: string;
}) {
  return (
    <div
      className="section notice-warning"
      style={{
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        background: '#fff7ed',
        color: '#9a3412',
      }}
    >
      Unknown section type: <strong>{type}</strong>
      {variant ? ` (variant: ${variant})` : ''}
    </div>
  );
}

// ==============================
// Renderer d'une section
// ==============================

export function renderSection(section: PageSection, key?: React.Key) {
  if (!isSupportedComponentType(section.type)) {
    return (
      <UnknownSection
        key={key}
        type={section.type}
        variant={section.variant}
      />
    );
  }

  const registryEntry = componentRegistry[section.type];

  if (!isValidVariant(section.type, section.variant)) {
    return (
      <div
        key={key}
        className="section notice-danger"
        style={{
          padding: '16px',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          background: '#fef2f2',
          color: '#991b1b',
        }}
      >
        Invalid variant "<strong>{section.variant}</strong>" for component "
        <strong>{section.type}</strong>"
      </div>
    );
  }

  const Component = registryEntry.component as React.ComponentType<Record<string, unknown>>;

  return (
    <Component
      key={key}
      sectionIndex={typeof key === "number" ? key : undefined}
      variant={section.variant}
      {...(section.props as Record<string, unknown>)}
    />
  );
}

// ==============================
// Renderer de page complète
// ==============================

export interface DynamicPageProps {
  sections: PageSection[];
}

export function DynamicPageRenderer({ sections }: DynamicPageProps) {
  return <>{sections.map((section, index) => renderSection(section, index))}</>;
}