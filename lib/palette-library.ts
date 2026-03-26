export interface PalettePreviewDefinition {
  value: string;
  label: string;
  description: string;
  colors: [string, string, string, string];
  isDark?: boolean;
}

export type PaletteCategory = "Dark" | "Neutre" | "Flashy" | "Premium" | "Nature" | "Tech";

export const PALETTE_LIBRARY: readonly PalettePreviewDefinition[] = [
  { value: "Bleu corporate", label: "Bleu corporate", description: "SaaS clair, propre et B2B.", colors: ["#0f172a", "#1d4ed8", "#38bdf8", "#f8fafc"] },
  { value: "Noir et blanc premium", label: "Noir et blanc premium", description: "Monochrome premium avec fond sombre reel.", colors: ["#0f172a", "#111827", "#f8fafc", "#1f2937"], isDark: true },
  { value: "Midnight SaaS", label: "Midnight SaaS", description: "Fond sombre premium, accents froids.", colors: ["#020617", "#1d4ed8", "#22d3ee", "#0f172a"], isDark: true },
  { value: "Teal dark studio", label: "Teal dark studio", description: "Dark teal, moderne et produit.", colors: ["#071c1c", "#14b8a6", "#67e8f9", "#0b2525"], isDark: true },
  { value: "Rose / orange vibrant", label: "Rose / orange vibrant", description: "Conversion, lifestyle, impact.", colors: ["#431407", "#f97316", "#ec4899", "#fff7ed"] },
  { value: "Forest editorial", label: "Forest editorial", description: "Nature premium, storytelling.", colors: ["#14532d", "#15803d", "#86efac", "#f0fdf4"] },
  { value: "Lavande product", label: "Lavande product", description: "Tech douce, moderne et rassurante.", colors: ["#312e81", "#8b5cf6", "#c4b5fd", "#f5f3ff"] },
  { value: "Sunset luxe", label: "Sunset luxe", description: "Chaleureux, premium et lifestyle.", colors: ["#7c2d12", "#f97316", "#fb7185", "#fff7ed"] },
  { value: "Sand editorial", label: "Sand editorial", description: "Beige chic pour marque elegante.", colors: ["#44403c", "#b45309", "#f59e0b", "#fafaf9"] },
  { value: "Ocean neon dark", label: "Ocean neon dark", description: "Dark profond avec accents aqua.", colors: ["#082f49", "#06b6d4", "#67e8f9", "#0f172a"], isDark: true },
  { value: "Cherry velvet", label: "Cherry velvet", description: "Rouge profond, luxe et impact.", colors: ["#4c0519", "#e11d48", "#fb7185", "#fff1f2"] },
  { value: "Jade premium", label: "Jade premium", description: "Vert raffine pour offre premium.", colors: ["#052e2b", "#10b981", "#6ee7b7", "#ecfdf5"] },
  { value: "Amber finance", label: "Amber finance", description: "Confiance, richesse et clarte.", colors: ["#451a03", "#d97706", "#fbbf24", "#fffbeb"] },
  { value: "Arctic glass", label: "Arctic glass", description: "Clinique, net et high-end.", colors: ["#0f172a", "#38bdf8", "#bae6fd", "#f8fafc"] },
  { value: "Aubergine nocturne", label: "Aubergine nocturne", description: "Dark violet pour produit premium.", colors: ["#1e1b4b", "#7c3aed", "#c084fc", "#2e1065"], isDark: true },
  { value: "Clay boutique", label: "Clay boutique", description: "Terre cuite elegante et artisanale.", colors: ["#7c2d12", "#c2410c", "#fdba74", "#fff7ed"] },
  { value: "Cobalt pulse", label: "Cobalt pulse", description: "Blue startup nerveux et propre.", colors: ["#172554", "#2563eb", "#60a5fa", "#eff6ff"] },
  { value: "Peach studio", label: "Peach studio", description: "Creatif, doux et tendance.", colors: ["#7c2d12", "#fb923c", "#fda4af", "#fff7ed"] },
  { value: "Graphite mint", label: "Graphite mint", description: "Sombre minimal avec mint vif.", colors: ["#111827", "#10b981", "#99f6e4", "#1f2937"], isDark: true },
  { value: "Indigo cosmos", label: "Indigo cosmos", description: "Spatial, tech et ambitieux.", colors: ["#1e1b4b", "#4f46e5", "#818cf8", "#eef2ff"] },
  { value: "Ruby noir", label: "Ruby noir", description: "Luxe sombre avec accent rubis.", colors: ["#111111", "#dc2626", "#fb7185", "#1f172a"], isDark: true },
  { value: "Sage minimal", label: "Sage minimal", description: "Calme, naturel et apaisant.", colors: ["#334155", "#84cc16", "#bef264", "#f7fee7"] },
  { value: "Solar flare", label: "Solar flare", description: "Energie, conversion et impact.", colors: ["#7f1d1d", "#f59e0b", "#fde047", "#fff7ed"] },
  { value: "Lagoon resort", label: "Lagoon resort", description: "Frais, premium et feel good.", colors: ["#164e63", "#06b6d4", "#67e8f9", "#ecfeff"] },
  { value: "Platinum UI", label: "Platinum UI", description: "Neutre premium pour interfaces chic.", colors: ["#1f2937", "#6b7280", "#d1d5db", "#f9fafb"] },
  { value: "Mocha grid", label: "Mocha grid", description: "Cafe design, chaleureux et editorial.", colors: ["#3f2c23", "#8b5e3c", "#d6b38a", "#faf6f1"] },
  { value: "Berry cream", label: "Berry cream", description: "Frais, feminin et e-commerce.", colors: ["#831843", "#db2777", "#f9a8d4", "#fdf2f8"] },
  { value: "Electric lime dark", label: "Electric lime dark", description: "Dark edgy avec accent acide.", colors: ["#0f172a", "#84cc16", "#d9f99d", "#1e293b"], isDark: true },
  { value: "Copper craft", label: "Copper craft", description: "Artisanat haut de gamme et caractere.", colors: ["#431407", "#b45309", "#f59e0b", "#fef3c7"] },
  { value: "Orchid glow", label: "Orchid glow", description: "Beauty brand, doux mais vibrant.", colors: ["#581c87", "#c026d3", "#e879f9", "#fdf4ff"] },
  { value: "Storm revenue", label: "Storm revenue", description: "B2B sombre, sobre et solide.", colors: ["#0f172a", "#334155", "#38bdf8", "#1e293b"], isDark: true },
  { value: "Lemon editorial", label: "Lemon editorial", description: "Clair, lifestyle et optimiste.", colors: ["#3f3f46", "#eab308", "#fde047", "#fefce8"] },
  { value: "Terracotta home", label: "Terracotta home", description: "Deco, habitat et authenticite.", colors: ["#7c2d12", "#ea580c", "#fdba74", "#fff7ed"] },
  { value: "Ice blue clinic", label: "Ice blue clinic", description: "Sante, confiance et purete.", colors: ["#0c4a6e", "#0ea5e9", "#7dd3fc", "#f0f9ff"] },
  { value: "Emerald night", label: "Emerald night", description: "Dark elegant avec vert luxueux.", colors: ["#022c22", "#059669", "#34d399", "#064e3b"], isDark: true },
  { value: "Coral startup", label: "Coral startup", description: "Startup moderne, jeune et visible.", colors: ["#7c2d12", "#f43f5e", "#fb7185", "#fff1f2"] },
  { value: "Obsidian gold", label: "Obsidian gold", description: "Noir luxe avec touche doree.", colors: ["#0a0a0a", "#ca8a04", "#facc15", "#1c1917"], isDark: true },
  { value: "Sky revenue", label: "Sky revenue", description: "SaaS lumineux et orienté croissance.", colors: ["#1e3a8a", "#3b82f6", "#93c5fd", "#eff6ff"] },
  { value: "Mint paper", label: "Mint paper", description: "Editorial clair avec vert frais.", colors: ["#134e4a", "#14b8a6", "#99f6e4", "#f0fdfa"] },
  { value: "Velvet plum", label: "Velvet plum", description: "Violet chic pour marque sophistiquee.", colors: ["#3b0764", "#9333ea", "#d8b4fe", "#faf5ff"] },
  { value: "Slate orange dark", label: "Slate orange dark", description: "Dark tech avec accent orange vif.", colors: ["#111827", "#f97316", "#fdba74", "#1f2937"], isDark: true },
  { value: "Rose champagne", label: "Rose champagne", description: "Elegant, feminin et premium.", colors: ["#881337", "#f472b6", "#fbcfe8", "#fdf2f8"] },
  { value: "Nordic pine", label: "Nordic pine", description: "Nordique, stable et naturel.", colors: ["#164e63", "#0f766e", "#5eead4", "#f0fdfa"] },
] as const;

export const PALETTE_CATEGORY_ORDER: readonly PaletteCategory[] = ["Dark", "Neutre", "Flashy", "Premium", "Nature", "Tech"] as const;

export const PALETTE_CATEGORY_DESCRIPTIONS: Record<PaletteCategory, string> = {
  Dark: "Couleurs sombres, elegantes et bien contrastees.",
  Neutre: "Couleurs propres, sobries et polyvalentes.",
  Flashy: "Couleurs vives, visibles et orientees conversion.",
  Premium: "Luxe, editorial et image de marque raffinee.",
  Nature: "Tons organiques, frais et apaisants.",
  Tech: "Couleurs modernes pour un service innovant.",
};

export function findPaletteDefinition(value: string) {
  return PALETTE_LIBRARY.find((palette) => palette.value.toLowerCase() === value.trim().toLowerCase());
}

export function inferPaletteCategory(palette: PalettePreviewDefinition): PaletteCategory {
  const normalized = `${palette.value} ${palette.label} ${palette.description}`.toLowerCase();
  if (palette.isDark) return "Dark";
  if (/(vibrant|sunset|cherry|peach|solar|berry|coral|orchid|rose|electric|flare|lime)/.test(normalized)) return "Flashy";
  if (/(forest|jade|sage|lagoon|mint|emerald|nordic|pine|teal|ocean|nature)/.test(normalized)) return "Nature";
  if (/(corporate|saas|product|cobalt|arctic|indigo|storm|sky|clinic|revenue|tech|ui)/.test(normalized)) return "Tech";
  if (/(premium|luxe|editorial|platinum|champagne|velvet|obsidian|sand|mocha|clay|copper|ruby|boutique)/.test(normalized)) return "Premium";
  return "Neutre";
}

export function paletteToTheme(palette: PalettePreviewDefinition) {
  const [base, accent, secondary, surface] = palette.colors;
  const background = palette.isDark ? base : surface;
  const textPrimary = palette.isDark ? "#ffffff" : base;
  const textSecondary = palette.isDark ? "#cbd5e1" : "#475569";
  const muted = surface;

  return {
    name: palette.value,
    primaryColor: accent,
    secondaryColor: secondary,
    accentColor: accent,
    backgroundColor: background,
    surfaceColor: palette.isDark ? surface : "#ffffff",
    surfaceAltColor: muted,
    textColor: textPrimary,
    mutedTextColor: textSecondary,
    borderColor: palette.isDark ? "#334155" : "#dbe4f0",
    buttonTextColor: palette.isDark ? "#ffffff" : "#ffffff",
    palette: {
      primary: accent,
      secondary,
      background,
      textPrimary,
      textSecondary,
      accent,
      muted,
    },
  };
}
