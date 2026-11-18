import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { construireExport } from '@/lib/account/export';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.id;
  const admin = createAdminClient();

  // Un seul constructeur pour les deux routes : complet, paginé, sans les données des autres.
  const exportData = await construireExport(admin, { id: uid, email: user.email, created_at: user.created_at });
  if (exportData.lectures_incompletes.length > 0) {
    // Un export tronqué qui se présenterait comme complet serait pire qu'une erreur.
    console.error('[account/export] lectures incomplètes', exportData.lectures_incompletes.join(' | '));
    return NextResponse.json({ error: "L'export n'a pas pu être constitué en entier. Réessaie dans un instant." }, { status: 500 });
  }

  const filename = `candice-export-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
