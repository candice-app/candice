import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteMetadata, schemaOrg } from "./metadata";
import CookieBanner from "@/components/CookieBanner";
import ScrollMemory from "@/components/layout/ScrollMemory";

// Polices AUTO-HÉBERGÉES (woff2 dans src/app/fonts) — le build ne dépend PLUS du réseau Google Fonts.
// Mêmes variables CSS qu'avant (--font-fraunces / --font-dm-sans) → aucun changement côté app.
// Fichiers = variantes variables @fontsource (Fraunces standard : wght+opsz, normal+italic ; DM Sans : wght).
const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-latin-standard-normal.woff2", style: "normal" },
    { path: "./fonts/fraunces-latin-standard-italic.woff2", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = localFont({
  src: "./fonts/dm-sans-latin-wght-normal.woff2",
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

// R2 : viewport verrouillé — pas de zoom/pincement sur mobile (comportement app).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        <a href="#main-content" className="skip-to-content">
          Passer au contenu principal
        </a>
        {/* F3 : restauration du scroll — tous les shells, tous les retours.
            S'appuie sur les marqueurs [data-page-ready] posés sur le contenu
            réel de chaque page (contenu peint = budget de restauration réglé). */}
        <ScrollMemory />
        {children}
        <CookieBanner />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </body>
    </html>
  );
}
