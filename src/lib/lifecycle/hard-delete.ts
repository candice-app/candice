import type { SupabaseClient } from '@supabase/supabase-js';

export async function hardDeleteUser(userId: string, supabaseAdmin: SupabaseClient): Promise<void> {
  // Delete contact photos from storage
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('id, photo_url')
    .eq('user_id', userId);

  for (const contact of contacts ?? []) {
    if (contact.photo_url) {
      await supabaseAdmin.storage.from('contact-photos').remove([contact.photo_url]).catch(() => {});
    }
  }

  // The ON DELETE CASCADE FK constraints handle the rest of the relational data.
  // We only need to delete the auth user — which triggers cascades on all tables
  // referencing auth.users(id).
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error(`[hard-delete] Failed to delete user ${userId}:`, error.message);
    throw error;
  }

  console.log(`[hard-delete] User ${userId} deleted.`);
}
