#!/usr/bin/env python3
"""ORDRE DES MIGRATIONS — déterministe, portable, et qui REFUSE ce qu'il ne comprend pas.

`sort -V` n'existe pas sur le sort BSD de macOS, et `sort -t- -k3` prend « 2.sql » comme clé
pour supabase-migration-2.sql. On trie donc ici, en Python, présent sur le Mac comme ailleurs.

EXCLUSIONS EXPLICITES — jamais un glob : un fichier de rollback appliqué dans l'ordre
défferait ce que la migration précédente vient de poser.

Imprime aussi, pour chaque fichier, le mode d'exécution : un fichier qui porte son propre
BEGIN;/COMMIT; ne doit PAS être passé à `psql -1` — son COMMIT refermerait la transaction
externe, et l'atomicité annoncée serait fausse.
"""
import re, sys, pathlib

# EXCLUSIONS EXPLICITES, chacune avec son motif. Jamais un glob, jamais une heuristique :
# une migration écartée à tort est aussi grave qu'une migration de trop.
EXCLUS = {
    'supabase-migration-101-ROLLBACK-grants.sql':
        "rollback : appliqué dans l'ordre, il déferait la 101 juste après l'avoir posée.",
    'supabase-migration-85-rename-profile-notes-policy.sql':
        "correction de dérive, NON REJOUABLE — elle renomme une policy créée à la main dans "
        "la console. Sur une base neuve, supabase-schema.sql ligne 181 crée déjà la policy "
        "sous son nom final : l'ancien nom n'existe jamais, il n'y a rien à renommer. "
        "Le fichier le dit lui-même : « one-shot, le renommage n'est pas rejouable ».",
}
FORME = re.compile(r'^supabase-migration-(\d+)([a-z]*)(?:-.*)?\.sql$')

racine = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
# Reprise : --depuis N n'imprime que les migrations de numéro >= N.
depuis = 0
for a in sys.argv[2:]:
    if a.startswith('--depuis='):
        depuis = int(a.split('=', 1)[1])
fichiers, refuses = [], []
for p in sorted(racine.glob('supabase-migration-*.sql')):
    if p.name in EXCLUS:
        continue
    m = FORME.match(p.name)
    if not m:
        refuses.append(p.name)
        continue
    fichiers.append((int(m.group(1)), m.group(2), p))

if refuses:
    print('ARRÊT — fichiers hors forme attendue, place inconnue dans l’ordre :', file=sys.stderr)
    for n in refuses:
        print('  ' + n, file=sys.stderr)
    sys.exit(2)

fichiers.sort(key=lambda t: (t[0], t[1]))
for nom, motif in sorted(EXCLUS.items()):
    print(f'EXCLUE\t{nom}\t{motif}', file=sys.stderr)
for num, _, p in fichiers:
    if num < depuis:
        continue
    texte = p.read_text(encoding='utf-8', errors='replace')
    propre = re.search(r'^\s*BEGIN\s*;', texte, re.M | re.I) is not None
    # CONCURRENTLY, VACUUM : incompatibles avec toute transaction, même celle du fichier.
    hors_tx = re.search(r'CONCURRENTLY|^\s*VACUUM|ALTER\s+SYSTEM', texte, re.M | re.I) is not None
    mode = 'HORS_TRANSACTION' if hors_tx else ('TRANSACTION_PROPRE' if propre else 'ENVELOPPE_PSQL')
    print(f'{mode}\t{p.name}')
