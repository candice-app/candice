# -*- coding: utf-8 -*-
"""Inventaire EXHAUSTIF du classeur : chaque onglet, chaque colonne, ce qu'elle porte.
Aucune ligne, aucune colonne n'est écartée : celles qui sont vides sont NOMMÉES comme
telles, pas omises — une colonne absente de l'inventaire serait indiscernable d'une
colonne oubliée."""
import openpyxl, json, collections

F = 'Candice_Discovery_Referentiel_V5_OPEN_V3.xlsx'
w = openpyxl.load_workbook(F, read_only=True)
inv = {}
for nom in w.sheetnames:
    s = w[nom]
    it = s.iter_rows(values_only=True)
    try: head = next(it)
    except StopIteration: head = ()
    cols = [(str(h) if h is not None else f'(sans_titre_{i})') for i, h in enumerate(head)]
    stats = [{'remplies': 0, 'valeurs': collections.Counter()} for _ in cols]
    n = 0
    for r in it:
        if all(v in (None, '') for v in r): continue
        n += 1
        for i, v in enumerate(r[:len(cols)]):
            if v in (None, ''): continue
            stats[i]['remplies'] += 1
            if len(stats[i]['valeurs']) < 400:
                stats[i]['valeurs'][str(v)[:120]] += 1
    detail = []
    for i, c in enumerate(cols):
        d, nd = stats[i]['remplies'], len(stats[i]['valeurs'])
        ferme = nd <= 25 and d > 0
        detail.append({
            'colonne': c, 'remplies': d, 'taux': round(d / n, 3) if n else 0.0,
            'distinctes_vues': nd,
            'vocabulaire_ferme_probable': ferme,
            'valeurs': sorted(stats[i]['valeurs'])[:25] if ferme else
                       [v for v, _ in stats[i]['valeurs'].most_common(3)],
            'VIDE': d == 0,
        })
    inv[nom] = {'lignes_non_vides': n, 'colonnes': len(cols), 'detail': detail}

with open('/mnt/user-data/outputs/discovery-open-v3-inventaire.json', 'w', encoding='utf-8') as f:
    json.dump(inv, f, ensure_ascii=False, indent=2)

print(f"{len(inv)} onglets\n")
tot_l = tot_c = tot_vides = 0
for nom, d in inv.items():
    vides = [x['colonne'] for x in d['detail'] if x['VIDE']]
    fermes = [x['colonne'] for x in d['detail'] if x['vocabulaire_ferme_probable']]
    tot_l += d['lignes_non_vides']; tot_c += d['colonnes']; tot_vides += len(vides)
    print(f"{nom:34s} {d['lignes_non_vides']:6d} l · {d['colonnes']:2d} col"
          f" · {len(fermes):2d} vocab fermé · {len(vides)} vide(s)")
    if vides: print(f"{'':36s}vides : {', '.join(vides)}")
print(f"\nTOTAL {tot_l} lignes · {tot_c} colonnes · {tot_vides} colonne(s) entièrement vide(s)")
