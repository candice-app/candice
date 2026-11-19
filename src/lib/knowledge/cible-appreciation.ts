// LA CIBLE D'UNE RELATION ENVERS UNE ENTITÉ — lue dans les mots (19 nov., 19h56).
//
// « Une appréciation ne doit pas changer de cible pendant l'extraction. » « J'adore l'ambiance du
// Café de Flore » dit une appréciation de l'AMBIANCE ; elle n'établit pas « LOVE » envers le café.
// « J'aimerais découvrir la cuisine du Japon » ne dit pas l'envie d'aller au Japon.
//
// Le modèle déclare la cible ; cette fonction la VÉRIFIE dans le texte, et ne peut que refuser :
//   · le nom de l'entité doit figurer dans la réponse (sinon : indéterminée) ;
//   · dans SA phrase, un verbe d'appréciation ou de souhait doit porter sur LUI :
//       « j'adore Patagonia », « j'aimerais aller au Japon », « Patagonia, je l'adore »,
//       « Patagonia me plaît », « j'adore cette marque » (désignateur de son genre) ;
//   · s'il porte sur autre chose (« l'ambiance de… », « la cuisine du… », « y » + objet), c'est un
//     ASPECT : aucune relation n'est écrite envers l'entité.
// Dans le doute, « indeterminee » : la relation n'est pas écrite (la phrase reste en connaissance ouverte).

export type Cible = 'referent' | 'aspect' | 'indeterminee';

const bas = (s: string) => s.normalize('NFC').toLowerCase().replace(/[’ʼ`]/g, "'");
const VERBE = /(?<![\p{L}])(?:ador\p{L}*|aim\p{L}*|appr[ée]ci\p{L}*|d[ée]test\p{L}*|kiff\p{L}*|raffol\p{L}*|pr[ée]f[èée]r\p{L}*|hais|ha[ïi]\p{L}*|[ée]vit\p{L}*|voudr\p{L}*|veux|souhait\p{L}*|r[êe]v\p{L}*|envie)/gu;
const EN_TETE = /^(?:(?:beaucoup|vraiment|surtout|tellement|bien|trop|toujours|énormément|enormement|aussi|particulièrement|particulierement|absolument|carrément|carrement|pas|plus|jamais|du tout|un jour|enfin)(?:\s+|$))+/;
// Le souhait passe par un verbe d'action vers l'entité (« aller au », « visiter », « essayer »).
const VERS = /^(?:(?:de|d')\s*)?(?:aller|visiter|d[ée]couvrir|voir|revoir|essayer|tester|go[uû]ter|avoir|poss[ée]der|acheter|m'offrir|partir|retourner|faire|lire|[ée]couter|regarder)\s+/;
const PREPOSITION = /^(?:(?:à|a|au|aux|en|chez|dans|sur|vers)\s+)/;
const ARTICLE = /^(?:(?:le|la|les|un|une|des|du)\s+|l')/;
const DESIGNATEUR = /^(?:(?:cette|cet|ces|ce)\s+)(?:marque|maison|enseigne|endroit|lieu|établissement|etablissement|restaurant|resto|hôtel|hotel|ville|pays|région|region|île|ile|destination|artiste|auteur|autrice|écrivain|ecrivain|chanteur|chanteuse|groupe|réalisateur|realisateur|livre|roman|album|film|série|serie|œuvre|oeuvre|musée|musee|boutique|café|cafe|bar|spa|activité|activite|sport)\b/;
const SUJET = /^\s*,?\s*(?:me|m')\s*(?:pla[iî]\p{L}*|plu|intrigu\p{L}*|fascin\p{L}*|attir\p{L}*|fai[ts] r[êe]ver|touch\p{L}*|passionn\p{L}*|intéress\p{L}*|interess\p{L}*|séduit|seduit|enchant\p{L}*|émeu\p{L}*|emeu\p{L}*)/u;

/** La cible de la relation envers `label`, d'après les mots de `texte`. */
export function cibleDUneEntite(texte: string, label: string): { cible: Cible; objet?: string } {
  const t = bas(texte), l = bas(label).trim();
  if (l.length === 0) return { cible: 'indeterminee' };
  const verdicts: { cible: Cible; objet?: string }[] = [];
  for (let pos = t.indexOf(l); pos >= 0; pos = t.indexOf(l, pos + 1)) {
    let g = 0, d = t.length;
    for (const m of t.matchAll(/[.!?\n]/g)) { const a = m.index!; if (a < pos) g = a + 1; else if (a >= pos + l.length) { d = a; break; } }
    // « Patagonia me plaît » : l'entité est le SUJET d'un verbe d'appréciation.
    if (SUJET.test(t.slice(pos + l.length, d))) { verdicts.push({ cible: 'referent' }); continue; }
    for (const m of t.slice(g, d).matchAll(VERBE)) {
      const dv = g + m.index!, fv = dv + m[0].length;
      const gauche = t.slice(g, dv);
      const clause = gauche.slice(Math.max(gauche.lastIndexOf(','), gauche.lastIndexOf(':'), gauche.lastIndexOf(';'), gauche.lastIndexOf('—')) + 1);
      const enY = /(?:^|\s|')y(?:\s|$)|\b[jmns]'y\b/.test(clause);
      const reste = t.slice(fv, d);
      const coupe = reste.search(/[,:;—]/);
      let objet = (coupe < 0 ? reste : reste.slice(0, coupe));
      let decale = fv + (objet.length - objet.trimStart().length); objet = objet.trimStart();
      const avancer = (re: RegExp) => { const x = re.exec(objet); if (x) { decale += x[0].length; objet = objet.slice(x[0].length); } };
      avancer(EN_TETE); avancer(VERS); avancer(PREPOSITION); avancer(ARTICLE);
      objet = objet.trimEnd();
      if (objet.length === 0) {
        // « Patagonia, je l'adore » / « Patagonia, j'adore » : l'entité nommée plus tôt dans la phrase.
        verdicts.push({ cible: !enY && pos < dv ? 'referent' : 'indeterminee' }); continue;
      }
      if (decale === pos || objet.startsWith(l)) { verdicts.push({ cible: 'referent', objet }); continue; }
      if (!enY && DESIGNATEUR.test(objet) && pos < dv) { verdicts.push({ cible: 'referent', objet }); continue; }
      // Un verbe qui ne touche pas l'entité dans cette phrase (« j'adore l'ambiance du Café de Flore »).
      verdicts.push({ cible: pos >= fv && pos < fv + reste.length ? 'aspect' : 'indeterminee', objet });
    }
  }
  return verdicts.find((v) => v.cible === 'referent') ?? verdicts.find((v) => v.cible === 'aspect') ?? { cible: 'indeterminee' };
}
