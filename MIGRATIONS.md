# Migrations Supabase

## Ordre d'exécution
1. supabase-schema.sql (initial)
2. supabase-migration-2.sql (phone, photo_url, gift_wishlist)
3. supabase-migration-3.sql (archived_at, last_reminder_sent_at, profile_share_requests)

## Pour exécuter une migration
1. Aller sur https://supabase.com/dashboard
2. Sélectionner le projet candice
3. Aller dans "SQL Editor"
4. Coller le contenu du fichier .sql
5. Cliquer sur "Run"

## État actuel
- [x] supabase-schema.sql appliqué
- [x] supabase-migration-2.sql appliqué
- [ ] supabase-migration-3.sql à appliquer
