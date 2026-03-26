import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Funnel Builder",
  description: "Pages Next.js construites dynamiquement depuis un JSON.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
