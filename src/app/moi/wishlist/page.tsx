// MA WISHLIST V2 — envies du pilote pour lui-même, strictement privées.
// Reproduction de Candice_Maquette_Wishlist_V2.html.

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getAuthClaims } from "@/utils/supabase/claims";
import V4Shell from "@/components/layout/V4Shell";
import WishlistV2Client, { type WishlistItemV2, type ContactLite } from "./WishlistV2Client";
import type { Occasion, EnvyLevel } from "@/lib/wishlist/labels";

const WL_SELECT =
  "id, title, brand, web_link, size_ref, price_indicative, occasion, note_text, envy_level, target_recipients, photo_url, created_at";

export default async function WishlistPage() {
  const supabase = await createClient();
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect("/login?next=/moi/wishlist");
  const userId = claims.sub as string;

  const [{ data: rows }, { data: contactRows }] = await Promise.all([
    supabase.from("my_wishlist_items").select(WL_SELECT)
      .eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("contacts").select("id, name").eq("user_id", userId).order("name"),
  ]);

  // Signer les photos stockées en bucket (path) ; les URLs OpenGraph (http) telles quelles.
  const admin = createAdminClient();
  const items: WishlistItemV2[] = await Promise.all(
    ((rows ?? []) as unknown as Array<Record<string, unknown>>).map(async r => {
      const photo = (r.photo_url as string | null) ?? null;
      let signed: string | null = null;
      if (photo) {
        if (/^https?:\/\//i.test(photo)) signed = photo;
        else signed = (await admin.storage.from("contact-photos").createSignedUrl(photo, 3600)).data?.signedUrl ?? null;
      }
      return {
        id: r.id as string,
        title: r.title as string,
        brand: (r.brand as string | null) ?? null,
        web_link: (r.web_link as string | null) ?? null,
        size_ref: (r.size_ref as string | null) ?? null,
        price_indicative: (r.price_indicative as string | null) ?? null,
        occasion: (r.occasion as Occasion | null) ?? null,
        note_text: (r.note_text as string | null) ?? null,
        envy_level: (r.envy_level as EnvyLevel | null) ?? null,
        target_recipients: (r.target_recipients as string[] | null) ?? [],
        photo_url: photo,
        photoSignedUrl: signed,
        created_at: r.created_at as string,
      };
    }),
  );
  const contacts = ((contactRows ?? []) as ContactLite[]);

  return (
    <V4Shell active="profile" noBrandBar>
      <div data-page-ready="wishlist">
        <WishlistV2Client userId={userId} initialItems={items} contacts={contacts} />
      </div>
    </V4Shell>
  );
}
