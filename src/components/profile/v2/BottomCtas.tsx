"use client";

// P2.11 STOP C — rangée de fin de fiche : « Partager mon profil » +
// « Ma wishlist » (mêmes gestes que le header, sans remonter en haut).
// Adaptation fond clair : primaire pine plein, secondaire contour pine.

import { useState } from "react";
import Link from "next/link";
import { T2, Icon } from "./ui";
import { Sheet } from "./Sheet";

export default function BottomCtas() {
  const [wishOpen, setWishOpen] = useState(false);
  return (
    <div style={{ display: "flex", gap: 10, margin: "18px 14px 0" }}>
      <Link href="/moi/partage" style={{
        flex: 1, minHeight: 50, borderRadius: 6, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 14, fontWeight: 600,
        background: T2.pine, color: "#fff", textDecoration: "none",
        boxShadow: "0 6px 16px rgba(23,62,49,.18)",
      }}>
        Partager mon profil
      </Link>
      <button
        onClick={() => setWishOpen(true)}
        style={{
          flex: 1, minHeight: 50, borderRadius: 6, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 14, fontWeight: 600,
          border: `1px solid rgba(23,62,49,.3)`, color: T2.pine,
          background: "none", cursor: "pointer", fontFamily: "var(--font-sans)",
        }}
      >
        <Icon name="plus" size={15} style={{ marginRight: 7 }} />Ma wishlist
      </button>

      <Sheet open={wishOpen} onClose={() => setWishOpen(false)} title="Ma wishlist">
        <p style={{ fontSize: 14, lineHeight: 1.6, color: T2.ink2, marginBottom: 13 }}>
          Ta wishlist arrive bientôt. Tu pourras y déposer tes envies pour que
          tes proches visent toujours juste.
        </p>
      </Sheet>
    </div>
  );
}
