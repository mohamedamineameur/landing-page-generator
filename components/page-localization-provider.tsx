"use client";

import { createContext } from "react";

export interface PageLocalizationContextValue {
  locale: string;
  direction: "ltr" | "rtl";
  isRTL: boolean;
  supportedLocales: string[];
  translationContext?: string;
  translationsEnabled: boolean;
  setLocale: (nextLocale: string) => void;
}

export const PageLocalizationContext = createContext<PageLocalizationContextValue>({
  locale: "fr",
  direction: "ltr",
  isRTL: false,
  supportedLocales: ["fr"],
  translationContext: undefined,
  translationsEnabled: false,
  setLocale: () => undefined,
});

export function PageLocalizationProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PageLocalizationContextValue;
}) {
  return <PageLocalizationContext.Provider value={value}>{children}</PageLocalizationContext.Provider>;
}
