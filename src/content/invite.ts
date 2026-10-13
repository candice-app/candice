// CONTENU — invitation, trois modes, page d'arrivée, inscription, notifications, relances.
//
// Copy ARBITRÉE par Estelle (finale, à intégrer telle quelle). PREMIER mécanisme de clés de
// contenu du produit (il n'en existait aucun ; la copy était en dur dans les composants).
//
// RÈGLES (Estelle) :
//  1. Le prénom est TOUJOURS le jeton {Prénom}, résolu au rendu via resolvePronoun. Jamais « Julie »
//     (exemple du document). Jamais un pronom par défaut.
//  2. AUCUNE durée annoncée nulle part — le jeton {durée} n'existe pas (les mentions fixes
//     « premier mois offert » / « 9 € par mois » sont de la copy finale, pas des variables).
//  3. Le pilote doit pouvoir ÉDITER le corps de l'e-mail (invite.email.body) et du message court
//     (invite.short.body) avant envoi — exigence portée par l'UI d'invitation, pas par ce module.
//
// ⚠ ACCORD GENRÉ EN ATTENTE (chantier app-copy, hors questionnaire) : ces textes portent des
//    accords féminins sur le proche (« elle-même », « d'elle », « la connaître ») car l'exemple
//    d'Estelle est féminin. {Prénom} est tokenisé ; les accords ne le sont PAS. La règle « on
//    accorde dès que le genre est connu, neutre sinon » s'applique à cartes/notifications/copie app
//    (cf. onboarding-incognito-v1.md §6) mais les variantes d'accord ne sont pas encore livrées.
//    Je stocke le verbatim validé et je signale — je n'invente aucune tokenisation de pronom.
//
// Paragraphes multiples = tableau de chaînes (un élément par paragraphe).

export type ContentValue = string | readonly string[];

export const INVITE_CONTENT = {
  // ── Écran de choix des trois modes ──────────────────────────────────────
  'mode.direct.label': 'Inviter {Prénom}',
  'mode.direct.badge': 'Recommandé',
  'mode.direct.body': [
    'C’est {Prénom} qui se présente à Candice. Elle peut ensuite partager ses nouvelles envies, ses découvertes, ce qui lui plaît ou ce dont elle a besoin. Candice apprend à connaître {Prénom} au fil du temps et te conseille avec toujours plus de justesse.',
    'Vous découvrez aussi vos analyses personnelles et votre analyse commune.',
  ],
  'mode.direct.verdict': 'Une connaissance qui évolue avec {Prénom}.',

  'mode.cotecote.label': 'Répondre côte à côte',
  'mode.cotecote.body': [
    'Tu remplis le parcours avec {Prénom}, sans création de compte.',
    'Candice recueille ses réponses une seule fois. Elle ne pourra ensuite ni l’interroger, ni connaître ses nouvelles envies ou les changements dans sa vie. Cette première photographie peut rapidement devenir incomplète.',
  ],
  'mode.cotecote.verdict': 'Une connaissance figée au jour du questionnaire.',

  'mode.incognito.label': 'Renseigner ce que tu sais de {Prénom}',
  'mode.incognito.body': [
    'Tu réponds sans faire participer {Prénom}. Candice s’appuie uniquement sur ce que tu crois savoir de {Prénom} : ses goûts, ses habitudes, ses envies.',
    'Même en étant très proches, on ne connaît pas toujours les désirs, les besoins ou les changements de l’autre. Candice ne peut pas les vérifier directement auprès de {Prénom}.',
  ],
  'mode.incognito.verdict': 'Une connaissance indirecte, forcément partielle.',

  // ligne unique sous les trois cartes
  'mode.footer': 'Dans tous les cas, {Prénom} ne voit jamais ce que tu prépares.',

  // ── Parcours incognito — rappel affiché une seule fois en entrée ─────────
  'incognito.reminder': [
    'Parle à Candice de {Prénom} telle que tu la connais.',
    'Réponds à partir de ce que tu sais vraiment d’elle. Si tu hésites, passe à la suite.',
  ],

  // ── E-mail d'invitation (éditable avant envoi — règle 3) ─────────────────
  'invite.email.subject': '{Prénom}, j’aimerais partager une expérience avec toi',
  'invite.email.body': [
    '{Prénom},',
    'J’utilise Candice pour mieux connaître les personnes qui comptent pour moi, et trouver les attentions, les cadeaux ou les expériences qui leur correspondent vraiment.',
    'J’aimerais t’y associer. Candice prendra le temps de faire ta connaissance : tu découvriras ton analyse personnelle, et nous découvrirons ce qu’elle révèle de nous deux — nos affinités, nos différences, ce qui fait la singularité de notre relation. Et ce que je choisirai pour toi ne sera plus ce que je devine, mais ce que tu m’auras dit.',
    'Prends un moment au calme : elle te demandera ce qui te touche, ce dont tu as besoin, ce qui te fait du bien. Cette première découverte ne se fait qu’une fois ; ensuite, elle reviendra ponctuellement vers toi, à ton rythme.',
    'Voici ton lien :',
    '[lien]',
  ],

  // ── Message court — SMS / messagerie (éditable avant envoi — règle 3) ─────
  'invite.short.body':
    '{Prénom}, j’aimerais partager quelque chose avec toi. Candice prendra le temps de te connaître : tu découvriras ton analyse personnelle, nous découvrirons ce qui nous rapproche et ce qui nous distingue, et je saurai enfin ce qui te fait vraiment plaisir. C’est ici : [lien]',

  // ── Page d'arrivée du lien — sept blocs ──────────────────────────────────
  'landing.header': ['Candice', '{Prénom} aimerait partager cette expérience avec toi.'],
  'landing.what': [
    'Candice est une conciergerie relationnelle. Elle aide {Prénom} à connaître ses proches avec justesse, et à choisir pour chacun ce qui lui correspond vraiment — une attention, un cadeau, une expérience.',
    'Elle y met le temps qu’il faut : elle écoute, elle retient, elle affine. Aujourd’hui, c’est à toi qu’elle vient parler.',
  ],
  'landing.benefits': [
    'Ton analyse. Ce qui te touche, ce dont tu as besoin, ce qui te ressemble. Elle est à toi.',
    'Votre analyse commune. Ce qui vous rapproche, ce qui vous distingue, la manière dont vous vous comprenez.',
    'Et {Prénom} saura ce qui te fait vraiment plaisir. Pas ce qu’on devine : ce que tu dis.',
    'Candice peut aussi devenir ton copilote. Pour les gens qui comptent pour toi, à ton tour.',
  ],
  'landing.how': [
    'Prends un moment au calme. Candice te demandera ce qui te touche, ce dont tu as besoin, ce qui te fait du bien. Rien de compliqué.',
    'Ce premier temps ne se fait qu’une fois. Ensuite, elle revient de temps en temps vers toi, à ton rythme. Jamais plus.',
  ],
  'landing.privacy': [
    'Ton analyse personnelle est à toi, dans ton espace.',
    '{Prénom} reçoit ce que Candice comprend de toi — des idées justes, au bon moment. Jamais tes réponses elles-mêmes.',
    'L’analyse commune, vous la partagez.',
  ],
  'landing.cta': 'Commencer',
  'landing.cta.note':
    'À la fin, tu créeras ton espace pour garder ton analyse. C’est gratuit, et aucune carte bancaire n’est demandée.',
  'landing.offer':
    'Toi aussi, tu as des gens qui comptent. Candice peut t’aider à savoir ce qui leur fait vraiment plaisir — le premier mois est offert, sans carte bancaire.',

  // ── Écran d'inscription — fin du parcours ────────────────────────────────
  'signup.title': 'Ton analyse est prête.',
  'signup.subtitle':
    'Crée ton espace pour la garder — c’est gratuit, et aucune carte bancaire n’est demandée.',
  'signup.uses': [
    'Ton espace te sert à trois choses.',
    'Retrouver ton analyse quand tu veux, et la voir s’affiner à mesure que Candice te connaît.',
    'Revoir et corriger tes réponses à tout moment. Ce sont les tiennes.',
    'Partager tes résultats si tu en as envie, ou les garder pour toi.',
  ],
  'signup.cta': 'Créer mon espace',
  // Phrase de CONSENTEMENT EXPLICITE (rédigée par Estelle) : sous le bouton, AU-DESSUS de la ligne
  // tarifaire. Fonde l'enregistrement de consentement — jamais la FK. Porte sur l'usage dérivé
  // (le seul demandé) ; même frontière que landing.privacy, répétition voulue.
  'signup.consent':
    'En créant ton espace, tu permets à Candice de s’appuyer sur ce que tu lui dis pour aider {Prénom} à choisir juste — jamais tes réponses elles-mêmes, seulement ce qu’elle en comprend.',
  'signup.cta.note':
    'Le premier mois est offert. Ensuite, Candice reste accessible sans rien payer, et l’abonnement est à 9 € par mois si tu veux qu’elle s’occupe de tes proches.',

  // ── Notifications ────────────────────────────────────────────────────────
  'notif.proche.push.title': '{Prénom} t’invite à deux voix',
  'notif.proche.push.body': 'Ton analyse, et ce que Candice comprend de vous deux.',
  'notif.proche.banner.title': '{Prénom} t’invite à deux voix.',
  'notif.proche.banner.body':
    'Tu découvriras ton analyse personnelle, et vous découvrirez ce qui vous rapproche et ce qui vous distingue.',
  'notif.proche.banner.cta': 'Commencer',
  'notif.pilote.push.title': '{Prénom} a fait connaissance avec Candice',
  'notif.pilote.push.body': 'Votre analyse commune est prête.',
  'notif.pilote.banner.title': '{Prénom} a fait connaissance avec Candice.',
  'notif.pilote.banner.body':
    'Son analyse lui appartient. La vôtre vous attend : ce qui vous rapproche, ce qui vous distingue, la manière dont vous vous comprenez.',
  'notif.pilote.banner.cta': 'Découvrir',

  // ── Relances — graduées sur l'ENGAGEMENT, jamais sur le silence ──────────
  // Lien reçu jamais ouvert → aucune au proche ; une ligne refermable au pilote, UNE fois.
  'relance.pilote.unopened':
    '{Prénom} n’a pas encore pris ce moment. Tu peux lui renvoyer ton message quand tu veux.',
  // Commencé pas terminé → une, à 48 h.
  'relance.proche.started': 'Ton analyse est presque là. Il te reste quelques minutes, quand tu veux.',
  // Terminé sans compte → deux, à 24 h puis à 7 jours. JAMAIS de 3e relance.
  'relance.proche.done.1': 'Ton analyse t’attend.',
  'relance.proche.done.2':
    'Ton analyse et celle de ta relation avec {Prénom} sont prêtes. Ton espace les garde.',
} as const satisfies Record<string, ContentValue>;

export type InviteContentKey = keyof typeof INVITE_CONTENT;
