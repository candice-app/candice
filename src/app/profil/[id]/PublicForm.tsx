"use client";

import { useState } from "react";
import Link from "next/link";

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 18, fontWeight: 300, color: "var(--txt)",
  marginBottom: 12, display: "block",
  textTransform: "none", letterSpacing: "-0.3px",
};

interface MultiSelectProps {
  options: { value: string; label: string; description?: string }[];
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}

function MultiSelect({ options, values, onChange, max = 3 }: MultiSelectProps) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter(x => x !== v));
    else if (values.length < max) onChange([...values, v]);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txts)", fontStyle: "italic" }}>
          Jusqu&apos;à {max} réponses, de la plus importante à la moins importante
        </p>
        {values.length > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 500, color: "var(--terra)",
            marginLeft: 12, flexShrink: 0,
            background: "var(--t2)", padding: "2px 8px",
            borderRadius: 10, border: "0.5px solid var(--t3)",
          }}>
            {values.length}/{max}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const rank = values.indexOf(opt.value);
          const selected = rank !== -1;
          const disabled = !selected && values.length >= max;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => !disabled && toggle(opt.value)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                gap: 2, padding: "10px 16px", borderRadius: 6,
                border: selected ? "none" : "0.5px solid var(--iv3)",
                background: selected ? "var(--terra)" : "#fff",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                userSelect: "none", textAlign: "left", maxWidth: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {selected && (
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: "var(--br)", color: "#fff",
                    fontSize: 9, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {rank + 1}
                  </span>
                )}
                <span style={{
                  fontSize: 14, fontWeight: selected ? 500 : 400,
                  color: selected ? "#fff" : "var(--txt)",
                }}>
                  {opt.label}
                </span>
              </div>
              {opt.description && (
                <span style={{
                  fontSize: 11, fontWeight: 300, lineHeight: 1.35,
                  color: selected ? "rgba(255,255,255,0.85)" : "var(--txtm)",
                  opacity: selected ? 1 : 0.65,
                  paddingLeft: selected ? 24 : 0,
                  overflowWrap: "break-word", wordBreak: "break-word",
                }}>
                  {opt.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuccessState() {
  const [ctaDismissed, setCtaDismissed] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card-light" style={{ textAlign: "center", padding: "40px 24px" }}>
        <p style={{ fontSize: 22, marginBottom: 12 }}>✓</p>
        <h2 style={{ fontSize: 16, fontWeight: 400, color: "var(--txt)", marginBottom: 8 }}>
          Merci ! Ta fiche a bien été enregistrée.
        </h2>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txtm)", lineHeight: 1.6 }}>
          La personne qui t&apos;a envoyé ce lien va pouvoir mieux prendre soin de toi.
        </p>
      </div>

      {!ctaDismissed && (
        <div style={{ background: "var(--iv)", border: "0.5px solid var(--iv3)", borderRadius: "var(--r-md)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txtm)", lineHeight: 1.6 }}>
            Envie de garder ta fiche et de la partager avec d&apos;autres personnes qui veulent te faire plaisir ?
            Crée ton compte Candice gratuitement.
          </p>
          <Link href="/register" style={{ display: "block", textAlign: "center", textDecoration: "none", background: "var(--terra)", color: "#fff", padding: "10px 20px", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 400 }}>
            Créer mon compte gratuit →
          </Link>
          <button
            onClick={() => setCtaDismissed(true)}
            style={{ fontSize: 11, fontWeight: 300, color: "var(--txts)", background: "none", border: "none", cursor: "pointer", textAlign: "center" }}
          >
            Non merci
          </button>
        </div>
      )}
    </div>
  );
}

interface Props {
  contactId: string;
  userId: string;
}

const join = (arr: string[]) => arr.join(",") || null;

export default function PublicForm({ contactId, userId }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loveLanguage, setLoveLanguage] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState<string[]>([]);
  const [stressResponse, setStressResponse] = useState<string[]>([]);
  const [socialEnergy, setSocialEnergy] = useState<string[]>([]);
  const [appreciationStyle, setAppreciationStyle] = useState<string[]>([]);
  const [conflictResolution, setConflictResolution] = useState<string[]>([]);
  const [decisionMaking, setDecisionMaking] = useState<string[]>([]);
  const [emotionalExpression, setEmotionalExpression] = useState<string[]>([]);
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [recognitionPreference, setRecognitionPreference] = useState<string[]>([]);
  const [boundaries, setBoundaries] = useState<string[]>([]);
  const [growthMindset, setGrowthMindset] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState("");
  const [favoriteFoods, setFavoriteFoods] = useState("");
  const [giftPreference, setGiftPreference] = useState<string[]>([]);
  const [conversationTopics, setConversationTopics] = useState("");
  const [thingsToAvoid, setThingsToAvoid] = useState("");
  const [bestContactMethod, setBestContactMethod] = useState<string[]>([]);
  const [importantDates, setImportantDates] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/profil/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId, userId,
        love_language: join(loveLanguage),
        communication_style: join(communicationStyle),
        stress_response: join(stressResponse),
        social_energy: join(socialEnergy),
        appreciation_style: join(appreciationStyle),
        conflict_resolution: join(conflictResolution),
        decision_making: join(decisionMaking),
        emotional_expression: join(emotionalExpression),
        core_values: join(coreValues),
        recognition_preference: join(recognitionPreference),
        boundaries: join(boundaries),
        growth_mindset: join(growthMindset),
        hobbies: hobbies || null,
        favorite_foods: favoriteFoods || null,
        gift_preference: join(giftPreference),
        conversation_topics: conversationTopics || null,
        things_to_avoid: thingsToAvoid || null,
        best_contact_method: join(bestContactMethod),
        important_dates: importantDates || null,
        additional_notes: additionalNotes || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); setLoading(false); return; }
    setSubmitted(true);
  };

  if (submitted) return <SuccessState />;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && <p style={{ fontSize: 12, color: "#E05252" }}>{error}</p>}

      {/* Profil psychologique */}
      <div className="card-light" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 400, color: "var(--txt)", marginBottom: 4 }}>Qui es-tu ?</h2>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txtm)" }}>
            Réponds instinctivement — il n&apos;y a pas de mauvaise réponse.
          </p>
        </div>

        <div>
          <label style={FIELD_LABEL}>Je me sens le plus aimé(e) quand…</label>
          <MultiSelect values={loveLanguage} onChange={setLoveLanguage} options={[
            { value: "words", label: "On me dit des mots doux", description: "Compliments, encouragements, reconnaissance verbale" },
            { value: "acts", label: "On m'aide concrètement", description: "Quelqu'un qui allège ma charge sans que je demande" },
            { value: "gifts", label: "On me fait un cadeau réfléchi", description: "Quelque chose choisi pour moi spécifiquement" },
            { value: "time", label: "On est vraiment présent", description: "Attention sans partage, qualité du moment" },
            { value: "touch", label: "On me serre dans ses bras", description: "Proximité physique, réconfort corporel" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Pour communiquer, je préfère…</label>
          <MultiSelect values={communicationStyle} onChange={setCommunicationStyle} options={[
            { value: "direct", label: "Aller droit au but", description: "Clair, efficace, sans détour" },
            { value: "emotional", label: "Parler de ce que je ressens", description: "Les émotions d'abord, le rationnel ensuite" },
            { value: "analytical", label: "Tout analyser en profondeur", description: "Je réfléchis avant de parler, j'aime la profondeur" },
            { value: "casual", label: "Garder ça léger, avec humour", description: "Je préfère rire qu'être trop sérieux(se)" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Quand je suis stressé(e), j&apos;ai tendance à…</label>
          <MultiSelect values={stressResponse} onChange={setStressResponse} options={[
            { value: "withdraws", label: "Me retirer, avoir besoin de calme", description: "Je recharge seul(e), je parle quand je suis prêt(e)" },
            { value: "seeks_support", label: "En parler, me confier", description: "J'ai besoin qu'on m'écoute et qu'on soit là" },
            { value: "action_oriented", label: "Agir, me mettre en mouvement", description: "Je canalise l'énergie dans des tâches concrètes" },
            { value: "internalizes", label: "Garder pour moi, faire bonne figure", description: "Je gère en silence, je n'aime pas inquiéter" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Mon énergie sociale…</label>
          <MultiSelect values={socialEnergy} onChange={setSocialEnergy} options={[
            { value: "very_introverted", label: "Je recharge vraiment seul(e)", description: "Les interactions me coûtent beaucoup d'énergie" },
            { value: "introverted", label: "Je préfère les petits groupes", description: "Les grands groupes me fatiguent vite" },
            { value: "ambivert", label: "Ça dépend des jours", description: "Tantôt besoin de monde, tantôt de solitude" },
            { value: "extroverted", label: "J'aime être entouré(e)", description: "Les autres me rechargent, j'aime le contact" },
            { value: "very_extroverted", label: "Plus c'est animé, mieux c'est", description: "Je m'ennuie seul(e), j'ai besoin de stimulation" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Ce qui me touche vraiment, c&apos;est quand…</label>
          <MultiSelect values={appreciationStyle} onChange={setAppreciationStyle} options={[
            { value: "verbal", label: "On me dit sincèrement merci", description: "Une reconnaissance exprimée à voix haute" },
            { value: "practical", label: "On m'aide sans que je demande", description: "Quelqu'un qui voit ce dont j'ai besoin et agit" },
            { value: "gifts", label: "On me fait un cadeau qui me ressemble", description: "Un cadeau précis qui montre qu'on me connaît" },
            { value: "time", label: "On me consacre du temps de qualité", description: "Une conversation profonde, une activité partagée" },
            { value: "physical", label: "On me serre dans ses bras", description: "Un câlin, une accolade, un geste affectueux" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Face à un désaccord, je…</label>
          <MultiSelect values={conflictResolution} onChange={setConflictResolution} options={[
            { value: "direct", label: "En parle directement", description: "Je préfère crever l'abcès plutôt que laisser traîner" },
            { value: "processes_first", label: "Ai besoin de temps avant d'en parler", description: "Je dois digérer avant de pouvoir en parler sereinement" },
            { value: "avoids", label: "Évite le conflit autant que possible", description: "Les tensions m'épuisent, je préfère tourner la page" },
            { value: "humor", label: "Dédramatise avec l'humour", description: "Je désamorce avec une blague, je relativise" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Pour mes grandes décisions, je…</label>
          <MultiSelect values={decisionMaking} onChange={setDecisionMaking} options={[
            { value: "logic", label: "Analyse les pour et les contre", description: "Je pèse les faits, les risques, les conséquences" },
            { value: "intuition", label: "Fais confiance à mon instinct", description: "Mon ressenti guide mes choix plus que la raison" },
            { value: "consensus", label: "Demande l'avis des proches", description: "Les retours des autres m'aident à me positionner" },
            { value: "research", label: "Fais des recherches approfondies", description: "J'ai besoin d'informations complètes avant de décider" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>J&apos;exprime mes émotions…</label>
          <MultiSelect values={emotionalExpression} onChange={setEmotionalExpression} options={[
            { value: "openly", label: "Assez librement", description: "Je partage facilement mes ressentis, je ne me cache pas" },
            { value: "selectively", label: "Avec quelques personnes de confiance", description: "Je m'ouvre uniquement à ceux en qui j'ai vraiment confiance" },
            { value: "through_actions", label: "Par mes actes plus que par mes mots", description: "Je montre ce que je ressens plutôt que je le dis" },
            { value: "rarely", label: "Rarement, je préfère garder ça pour moi", description: "J'intériorise beaucoup, je gère mes émotions seul(e)" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Dans une relation, ce qui compte le plus pour moi…</label>
          <MultiSelect values={coreValues} onChange={setCoreValues} options={[
            { value: "loyalty", label: "La loyauté", description: "Être là inconditionnellement, même dans les moments difficiles" },
            { value: "growth", label: "La profondeur, grandir ensemble", description: "S'élever, s'interroger, évoluer à deux" },
            { value: "fun", label: "Le fun, rire ensemble", description: "Partager des bons moments, être complices" },
            { value: "stability", label: "La stabilité, la constance", description: "Compter sur l'autre, pas de surprises désagréables" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Quand je réussis quelque chose, je préfère…</label>
          <MultiSelect values={recognitionPreference} onChange={setRecognitionPreference} options={[
            { value: "public", label: "Être célébré(e) ouvertement", description: "Être mis(e) en avant, félicité(e) devant les autres" },
            { value: "private", label: "Qu'on me le dise en privé", description: "Un mot sincère, juste entre nous" },
            { value: "personal", label: "La satisfaction personnelle me suffit", description: "L'accomplissement lui-même est ma récompense" },
            { value: "celebrate", label: "Fêter ça avec mes proches", description: "Partager le bonheur autour d'un repas ou d'une sortie" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Ce dont j&apos;ai le plus besoin…</label>
          <MultiSelect values={boundaries} onChange={setBoundaries} options={[
            { value: "space", label: "Du temps seul(e)", description: "Ne pas être sollicité(e) en permanence, avoir mes moments" },
            { value: "emotional", label: "Ne pas me sentir envahi(e)", description: "Ne pas porter les émotions des autres sur mes épaules" },
            { value: "time", label: "Qu'on respecte mon planning", description: "Pouvoir organiser mon agenda sans pression" },
            { value: "privacy", label: "Que ma vie privée reste la mienne", description: "Garder certaines choses pour moi, sans devoir tout expliquer" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Pour grandir, j&apos;aime surtout…</label>
          <MultiSelect values={growthMindset} onChange={setGrowthMindset} options={[
            { value: "experiences", label: "Vivre des expériences nouvelles", description: "Voyager, tester des choses, sortir de ma zone de confort" },
            { value: "structured", label: "Lire, me former de façon structurée", description: "Livres, formations, podcasts, cours en ligne" },
            { value: "reflective", label: "Réfléchir, écrire, m'observer", description: "Journal, méditation, introspection, thérapie" },
            { value: "community", label: "Échanger avec les autres", description: "Discussions inspirantes, mentors, groupes de pratique" },
          ]} />
        </div>
      </div>

      {/* Préférences */}
      <div className="card-light" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 400, color: "var(--txt)", marginBottom: 4 }}>Tes préférences.</h2>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txtm)" }}>Les détails qui changent tout.</p>
        </div>

        <div>
          <label style={FIELD_LABEL}>Mes loisirs et passions</label>
          <textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} rows={2}
            placeholder="ex. escalade, séries coréennes, cuisiner pour les autres…" />
        </div>

        <div>
          <label style={FIELD_LABEL}>Ce que j&apos;adore manger</label>
          <textarea value={favoriteFoods} onChange={(e) => setFavoriteFoods(e.target.value)} rows={2}
            placeholder="ex. cuisine japonaise, pizzas napolitaines, allergique aux fruits de mer…" />
        </div>

        <div>
          <label style={FIELD_LABEL}>Pour les cadeaux, je préfère…</label>
          <MultiSelect values={giftPreference} onChange={setGiftPreference} options={[
            { value: "experiences", label: "Des expériences", description: "Sorties, voyages, concerts, dîners" },
            { value: "physical", label: "Des objets à garder", description: "Quelque chose de tangible que je peux utiliser ou exposer" },
            { value: "both", label: "Les deux me touchent", description: "L'intention compte plus que la catégorie" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Les sujets qui m&apos;allument vraiment</label>
          <textarea value={conversationTopics} onChange={(e) => setConversationTopics(e.target.value)} rows={2}
            placeholder="ex. startups, psychologie, voyages, foot…" />
        </div>

        <div>
          <label style={FIELD_LABEL}>Ce qu&apos;il vaut mieux éviter avec moi</label>
          <textarea value={thingsToAvoid} onChange={(e) => setThingsToAvoid(e.target.value)} rows={2}
            placeholder="ex. les surprises, annuler à la dernière minute…" />
        </div>

        <div>
          <label style={FIELD_LABEL}>La meilleure façon de me contacter</label>
          <MultiSelect values={bestContactMethod} onChange={setBestContactMethod} options={[
            { value: "text", label: "SMS", description: "Un message court suffit, je réponds à mon rythme" },
            { value: "call", label: "Appel", description: "Je préfère entendre la voix, c'est plus direct" },
            { value: "email", label: "E-mail", description: "Pour les choses importantes ou les messages longs" },
            { value: "in_person", label: "En vrai, de préférence", description: "Rien ne vaut une vraie conversation face à face" },
          ]} />
        </div>

        <div>
          <label style={FIELD_LABEL}>Mes dates importantes</label>
          <textarea value={importantDates} onChange={(e) => setImportantDates(e.target.value)} rows={2}
            placeholder="ex. anniversaire : 14 juin…" />
        </div>

        <div>
          <label style={FIELD_LABEL}>Autre chose à savoir sur moi</label>
          <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={3}
            placeholder="Ce que tu voudrais que les gens qui t'aiment sachent…" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "12px 20px" }}>
        {loading ? "Enregistrement…" : "Envoyer mes réponses →"}
      </button>
    </form>
  );
}
