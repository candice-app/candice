-- ÉTAT DE PRODUCTION — LECTURE SEULE. Ne modifie rien. À coller dans l'éditeur SQL de Supabase,
-- puis copier le résultat (une seule cellule). Ne contient aucun secret, aucune donnée personnelle :
-- des définitions et des comptages.
select jsonb_pretty(jsonb_build_object(
  'fonction_md5', (select md5(prosrc) from pg_proc where proname = 'garde_contact_consents'),
  'declencheurs', (select jsonb_agg(jsonb_build_object('nom', tgname, 'actif', tgenabled, 'definition', pg_get_triggerdef(oid)))
                     from pg_trigger where tgrelid = 'public.contact_consents'::regclass and not tgisinternal),
  'politiques', (select jsonb_agg(jsonb_build_object('table', c.relname, 'nom', p.polname, 'commande', p.polcmd,
                        'using', pg_get_expr(p.polqual, p.polrelid), 'with_check', pg_get_expr(p.polwithcheck, p.polrelid)) order by c.relname, p.polname)
                   from pg_policy p join pg_class c on c.oid = p.polrelid
                  where c.relname in ('contact_consents', 'profile_analysis', 'person_states')),
  'rls_active', (select jsonb_object_agg(relname, relrowsecurity) from pg_class where relname in ('contact_consents', 'profile_analysis', 'person_states', 'contacts', 'my_profile') and relnamespace = 'public'::regnamespace),
  'droits', (select jsonb_agg(distinct grantee || ':' || privilege_type) from information_schema.role_table_grants
              where table_schema = 'public' and table_name = 'contact_consents' and grantee in ('anon', 'authenticated')),
  'cles_etrangeres', (select jsonb_object_agg(conname, confdeltype) from pg_constraint where conrelid = 'public.contact_consents'::regclass and contype = 'f'),
  'colonnes_lien', (select jsonb_agg(column_name) from information_schema.columns where table_schema = 'public' and table_name = 'contacts' and column_name like 'proche%'),
  'inventaire', jsonb_build_object(
     'consentements', (select count(*) from contact_consents),
     'fiches_reliees_a_un_compte', (select count(*) from contacts where proche_user_id is not null),
     'invitations_utilisees', (select count(*) from invite_links where used_at is not null),
     'liens_de_partage_reclames', (select count(*) from profile_share_links where claimed_at is not null),
     'recommandations_sur_fiche_reliee', (select count(*) from contact_recommendations r join contacts c on c.id = r.contact_id where c.proche_user_id is not null),
     'journal_attentions_sur_fiche_reliee', (select count(*) from attention_log a join contacts c on c.id = a.contact_id where c.proche_user_id is not null),
     'suggestions_sur_fiche_reliee', (select count(*) from proactive_suggestions s join contacts c on c.id = s.contact_id where c.proche_user_id is not null),
     'analyses_de_proche', (select count(*) from profile_analysis where contact_id is not null)
  )
)) as etat_production;
