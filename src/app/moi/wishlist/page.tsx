// Point 13 — MA WISHLIST (V1) : la liste personnelle de l'utilisateur.
// Vocabulaire verrouillé : wishlist = ce que JE veux recevoir (mon profil) ;
// le « carnet d'envies » (envies repérées pour un proche) est une autre notion.
// Reporté au lot Carnet d'envies : réservation, import URL, priorités, images.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";
import WishlistClient, { type WishlistItemV1 } from "./WishlistClient";

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/moi/wishlist");

  const { data } = await supabase
    .from("my_wishlist_items")
    .select("id, title, url, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <V4Shell active="profile">
      <div data-page-ready="wishlist" style={{ padding: "16px 20px 120px" }}>
        <Link href="/moi" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Ma fiche</span>
        </Link>
        <h1 style={{
          fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
          color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
          margin: "14px 0 6px",
        } as React.CSSProperties}>
          Ma wishlist.
        </h1>
        <p style={{ fontSize: 13.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 20 }}>
          Ce que tu aimerais recevoir — Candice peut s&apos;en inspirer sans jamais
          le dévoiler tel quel.
        </p>

        <WishlistClient userId={user.id} initialItems={(data ?? []) as WishlistItemV1[]} />
      </div>
    </V4Shell>
  );
}
