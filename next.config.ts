import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // P1.4 STOP C — cache client des segments dynamiques (défaut Next 15+ :
  // 0 s → chaque navigation refetchait tout : squelettes systématiques,
  // scroll perdu). 180 s : retours instantanés sans squelette ; les
  // éditions rafraîchissent via router.refresh(), non affecté.
  experimental: {
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/comment-ca-marche",
        destination: "/fonctionnement",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
