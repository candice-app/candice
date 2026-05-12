import type { Metadata } from "next";

export const BASE_URL = "https://candice.app";

export const siteMetadata: Metadata = {
  title: {
    default: "Candice — Votre copilote relationnel",
    template: "%s | Candice",
  },
  description:
    "Ne plus jamais oublier ce qui compte pour vos proches. Candice apprend, anticipe et agit pour que vos relations s'approfondissent.",
  keywords: [
    "application cadeau personnalisé",
    "copilote relationnel",
    "CRM personnel",
    "ne plus oublier anniversaires",
    "geste attentionné",
  ],
  openGraph: {
    title: "Candice — Votre copilote relationnel",
    description:
      "Ne plus jamais oublier ce qui compte pour vos proches. Candice apprend, anticipe et agit pour que vos relations s'approfondissent.",
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "Candice",
  },
  twitter: {
    card: "summary_large_image",
    title: "Candice — Votre copilote relationnel",
    description:
      "Ne plus jamais oublier ce qui compte pour vos proches. Candice apprend, anticipe et agit pour que vos relations s'approfondissent.",
    images: [`${BASE_URL}/og-image.png`],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/icon.svg" },
    ],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const schemaOrg = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Candice",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description:
    "Ne plus jamais oublier ce qui compte pour vos proches. Candice apprend, anticipe et agit pour que vos relations s'approfondissent.",
  url: BASE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  inLanguage: "fr-FR",
};
