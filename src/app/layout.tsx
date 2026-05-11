import type { Metadata } from "next";
import "./globals.css";
import { siteMetadata, schemaOrg } from "./metadata";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#main-content" className="skip-to-content">
          Passer au contenu principal
        </a>
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
