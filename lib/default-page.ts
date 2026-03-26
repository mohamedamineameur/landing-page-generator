import { type RuntimePagePayload } from "@/components/page-runtime-view";

export const DEFAULT_RUNTIME_PAGE: RuntimePagePayload = {
  slug: "application-mobile-landing",
  title: "Application Mobile - Inscription",
  localization: {
    locale: "fr",
    direction: "ltr",
    isRTL: false,
    translationsEnabled: false,
    supportedLocales: ["fr"],
  },
  theme: {
    name: "generated_theme",
    cornerStyle: "balanced",
    primaryColor: "#6b7280",
    secondaryColor: "#9ca3af",
    accentColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    surfaceColor: "#ffffff",
    surfaceAltColor: "#f3f4f6",
    textColor: "#111827",
    mutedTextColor: "#6b7280",
    borderColor: "#d1d5db",
    buttonTextColor: "#111827",
    successColor: "#15803d",
    warningColor: "#d97706",
    palette: {
      primary: "#6b7280",
      secondary: "#9ca3af",
      background: "#f9fafb",
      textPrimary: "#111827",
      textSecondary: "#6b7280",
      accent: "#d1d5db",
      muted: "#f3f4f6",
    },
  },
  sections: [
    {
      type: "navbar",
      props: {
        logoText: "AmineMobile",
        links: [
          { label: "Accueil", href: "#content" },
          { label: "Avantages", href: "#benefits" },
          { label: "Temoignages", href: "#testimonials" },
          { label: "FAQ", href: "#faq" },
          { label: "Inscription", href: "#lead-form" },
        ],
        cta: {
          label: "Creer un compte",
          action: "scroll_to_form",
        },
        sticky: true,
        transparent: false,
        showOnScroll: false,
      },
    },
    {
      type: "hero",
      props: {
        eyebrow: "Decouvrez notre application",
        headline: "Simplifiez votre quotidien avec notre application mobile",
        subheadline: "Inscrivez-vous des maintenant et profitez d'une experience fluide et intuitive.",
        primaryCta: {
          label: "Creer un compte",
          action: "scroll_to_form",
        },
        media: {
          kind: "image",
          style: "max-w-md rounded-lg shadow",
          src: "/generated/application-mobile-landing-1-1774378138724.png",
        },
        tone: "neutral",
      },
    },
    {
      type: "benefits",
      variant: "cards",
      props: {
        title: "Pourquoi choisir notre application ?",
        subtitle: "Des fonctionnalites pensees pour vous faciliter la vie",
        columns: 3,
        items: [
          {
            title: "Interface intuitive",
            description: "Naviguez facilement grace a une interface claire et epuree.",
            icon: "layers",
          },
          {
            title: "Securite renforcee",
            description: "Vos donnees sont protegees avec les meilleurs standards de securite.",
            icon: "shield",
          },
          {
            title: "Support 24/7",
            description: "Une equipe dediee pour repondre a toutes vos questions a tout moment.",
            icon: "phone",
          },
        ],
      },
    },
    {
      type: "testimonials",
      variant: "carousel",
      props: {
        title: "Ils nous font confiance",
        items: [
          {
            name: "Sophie Martin",
            role: "Utilisatrice satisfaite",
            quote:
              "L'application a vraiment change ma facon de gerer mes taches quotidiennes. Simple et efficace !",
            rating: 5,
          },
          {
            name: "Julien Dupont",
            role: "Professionnel",
            quote: "Une solution mobile fiable et securisee que je recommande a tous mes collegues.",
            rating: 4,
          },
          {
            name: "Claire Bernard",
            role: "Etudiante",
            quote: "Design epure et fonctionnalites pratiques, parfaite pour mon organisation personnelle.",
            rating: 5,
          },
        ],
      },
    },
    {
      type: "faq",
      props: {
        title: "Questions frequentes",
        items: [
          {
            question: "Comment creer un compte ?",
            answer: "Cliquez sur le bouton 'Creer un compte' et remplissez le formulaire d'inscription.",
          },
          {
            question: "L'application est-elle gratuite ?",
            answer: "Oui, l'application est entierement gratuite avec des fonctionnalites de base accessibles a tous.",
          },
          {
            question: "Puis-je utiliser l'application sur plusieurs appareils ?",
            answer: "Oui, votre compte est synchronise sur tous vos appareils connectes.",
          },
        ],
      },
    },
    {
      type: "form",
      variant: "card",
      props: {
        title: "Inscrivez-vous des maintenant",
        submitLabel: "Creer un compte",
        fields: [
          {
            type: "text",
            name: "fullname",
            label: "Nom complet",
            required: true,
            placeholder: "Votre nom complet",
          },
          {
            type: "email",
            name: "email",
            label: "Adresse email",
            required: true,
            placeholder: "exemple@domaine.com",
          },
          {
            type: "tel",
            name: "phone",
            label: "Numero de telephone",
            required: false,
            placeholder: "+33 6 12 34 56 78",
          },
          {
            type: "text",
            name: "password",
            label: "Mot de passe",
            required: true,
            placeholder: "Choisissez un mot de passe securise",
          },
        ],
        successMessage: "Merci pour votre inscription ! Un email de confirmation vous a ete envoye.",
      },
    },
    {
      type: "footer",
      props: {
        columns: [
          {
            title: "AppMobile",
            links: [
              { label: "Accueil", href: "#hero" },
              { label: "Avantages", href: "#benefits" },
              { label: "Temoignages", href: "#testimonials" },
              { label: "FAQ", href: "#faq" },
              { label: "Inscription", href: "#form" },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: "Support", href: "#faq" },
              { label: "Email", href: "mailto:support@appmobile.com" },
              { label: "amine@gmail.com", href: "mailto:amine@gmail.com" },
            ],
          },
        ],
      },
    },
  ],
};
