// P2.11 STOP C — rangée de fin de fiche : « Partager mon profil » +
// « Ma wishlist » (mêmes gestes que le header, sans remonter en haut).
// Adaptation fond clair : primaire pine plein, secondaire contour pine.
// Point 13 : la wishlist V1 est réelle — lien vers l'écran.

import Link from "next/link";
import { T2, Icon } from "./ui";

export default function BottomCtas() {
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
      <Link href="/moi/wishlist" style={{
        flex: 1, minHeight: 50, borderRadius: 6, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 14, fontWeight: 600,
        border: `1px solid rgba(23,62,49,.3)`, color: T2.pine,
        textDecoration: "none",
      }}>
        <Icon name="plus" size={15} style={{ marginRight: 7 }} />Ma wishlist
      </Link>
    </div>
  );
}
