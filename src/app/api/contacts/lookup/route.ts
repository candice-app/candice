// POST /api/contacts/lookup
//
// RGPD hygiene:
// - POST-only: lookup values never appear in server logs via URL
// - Returns only { found: boolean, userId?: string } — no PII about the found user
// - Caller must be authenticated (pilote session required)
// - Respects is_findable opt-out: users who opted out are not returned
// - Email lookup uses lookup_candice_user_by_email() RPC (SECURITY DEFINER, accesses auth schema)
// - Phone lookup uses lookup_candice_user_by_phone() RPC (SECURITY DEFINER, normalizes both sides)
//
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { email?: string; phone?: string };
  const email = body.email?.trim().toLowerCase() ?? null;
  const phone = body.phone?.trim() ?? null;

  if (!email && !phone) {
    return NextResponse.json({ found: false });
  }

  const admin = createAdminClient();

  // Email lookup — uses SECURITY DEFINER RPC to access auth.users safely
  if (email) {
    const { data: rows } = await admin.rpc("lookup_candice_user_by_email", { p_email: email });
    const found = (rows as Array<{ proche_user_id: string }> | null)?.find(
      r => r.proche_user_id !== user.id
    );
    if (found) {
      return NextResponse.json({ found: true, userId: found.proche_user_id });
    }
  }

  // Phone lookup — uses SECURITY DEFINER RPC with normalization on both sides
  if (phone) {
    const { data: rows } = await admin.rpc("lookup_candice_user_by_phone", { p_phone: phone });
    const found = (rows as Array<{ proche_user_id: string }> | null)?.find(
      r => r.proche_user_id !== user.id
    );
    if (found) {
      return NextResponse.json({ found: true, userId: found.proche_user_id });
    }
  }

  return NextResponse.json({ found: false });
}
