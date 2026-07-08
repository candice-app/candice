import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { siteMetadata, schemaOrg } from "./metadata";
import CookieBanner from "@/components/CookieBanner";
import ScrollMemory from "@/components/layout/ScrollMemory";
import PerfBeacon from "@/components/layout/PerfBeacon";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        <a href="#main-content" className="skip-to-content">
          Passer au contenu principal
        </a>
        {/* F3 : restauration du scroll — tous les shells, tous les retours */}
        <ScrollMemory />
        {/* F2 : instrumentation perf TEMPORAIRE (diagnostic device réel) */}
        <PerfBeacon />
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
