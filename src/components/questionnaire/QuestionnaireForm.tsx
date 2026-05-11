"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Relationship } from "@/types";

interface RadioGroupProps {
  name: string;
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (v: string) => void;
}

function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "8px 16px", borderRadius: 20,
              border: selected ? "0.5px solid var(--terra)" : "0.5px solid var(--iv3)",
              background: selected ? "var(--t2)" : "#fff",
              cursor: "pointer",
              fontSize: 14, fontWeight: selected ? 400 : 300,
              textTransform: "none" as const, letterSpacing: "normal",
              color: selected ? "var(--terra)" : "var(--txt)",
              marginBottom: 0, userSelect: "none",
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              style={{ display: "none" }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

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

function getSteps(mode: string) {
  if (mode === "link") return ["Informations", "Mode", "Lien envoyé"];
  return ["Informations", "Mode", "Profil", "Préférences"];
}

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 18, fontWeight: 300, color: "var(--txt)",
  marginBottom: 12, display: "block",
  textTransform: "none", letterSpacing: "-0.3px",
};

const SHORT_LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 400, letterSpacing: 2,
  textTransform: "uppercase", color: "var(--txts)",
  marginBottom: 6, display: "block",
};

const join = (arr: string[]) => arr.join(",") || null;

export default function QuestionnaireForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"" | "incognito" | "link">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("friend");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [linkContactId, setLinkContactId] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

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
  const [standing, setStanding] = useState<string[]>([]);
  const [gastronomy, setGastronomy] = useState<string[]>([]);
  const [accommodation, setAccommodation] = useState<string[]>([]);
  const [giftStyle, setGiftStyle] = useState<string[]>([]);
  const [conversationTopics, setConversationTopics] = useState("");
  const [thingsToAvoid, setThingsToAvoid] = useState("");
  const [bestContactMethod, setBestContactMethod] = useState<string[]>([]);
  const [importantDates, setImportantDates] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const profileUrl = linkContactId ? `${origin}/profil/${linkContactId}` : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hey ! J'essaie un truc pour faire plaisir aux gens que j'aime. 5 minutes ? ${profileUrl}`
  )}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNext = () => {
    if (!name.trim()) { setError("Veuillez saisir un prénom."); return; }
    setError("");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChooseIncognito = () => {
    setMode("incognito");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerateLink = async () => {
    setLinkLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non authentifié."); setLinkLoading(false); return; }

    const { data: contact, error: contactErr } = await supabase
      .from("contacts")
      .insert({ user_id: user.id, name: name.trim(), relationship, email: email || null, phone: phone || null })
      .select()
      .single();

    if (contactErr || !contact) {
      setError(contactErr?.message ?? "Impossible de créer le contact.");
      setLinkLoading(false);
      return;
    }

    setLinkContactId(contact.id);
    setMode("link");
    setStep(2);
    setLinkLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Send invite email if contact has an email — non-blocking
    if (email) {
      const senderFirstName = (await supabase.auth.getUser()).data.user?.user_metadata?.full_name?.split(" ")[0] ?? "";
      fetch("/api/emails/questionnaire-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail: email,
          contactFirstName: name.trim(),
          senderFirstName,
          profileUrl: `${origin}/profil/${contact.id}`,
        }),
      }).catch(() => {});
    }
  };

  const handleSubmitIncognito = async () => {
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non authentifié."); setLoading(false); return; }

    const { data: contact, error: contactErr } = await supabase
      .from("contacts")
      .insert({ user_id: user.id, name: name.trim(), relationship, email: email || null, phone: phone || null })
      .select()
      .single();

    if (contactErr || !contact) {
      setError(contactErr?.message ?? "Impossible d'enregistrer le contact.");
      setLoading(false);
      return;
    }

    const { error: respErr } = await supabase.from("questionnaire_responses").insert({
      contact_id: contact.id, user_id: user.id,
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
      standing: join(standing),
      gastronomy: join(gastronomy),
      accommodation: join(accommodation),
      gift_style: join(giftStyle),
      conversation_topics: conversationTopics || null,
      things_to_avoid: thingsToAvoid || null,
      best_contact_method: join(bestContactMethod),
      important_dates: importantDates || null,
      additional_notes: additionalNotes || null,
    });

    if (respErr) { setError(respErr.message); setLoading(false); return; }
    router.push(`/contacts/${contact.id}`);
  };

  const steps = getSteps(mode);
  const isDark = step === 1 || (step === 2 && mode === "link");

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 500,
                border: i < step ? "none" : i === step ? "1px solid var(--terra)" : "0.5px solid var(--brd)",
                background: i < step ? "var(--green)" : "transparent",
                color: i < step ? "#fff" : i === step ? "var(--terra)" : "var(--conf)",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: 300, color: i <= step ? "var(--txtm)" : "var(--txts)" }}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? "var(--terra)" : "var(--brd)", margin: "0 4px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={isDark
        ? { background: "var(--br)", border: "0.5px solid var(--brd2)", borderRadius: "var(--r-md)", padding: "28px 32px" }
        : { background: "var(--iv)", border: "0.5px solid var(--iv3)", borderRadius: "var(--r-md)", padding: "28px 32px" }
      }>

        {error && (
          <p style={{ fontSize: 12, color: "#E05252", marginBottom: 16 }}>{error}</p>
        )}

        {/* ── STEP 0: Basic info ────────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 400, color: "var(--txt)", marginBottom: 4 }}>
                Qui ajoutez-vous ?
              </h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txtm)" }}>
                Informations de base sur cette personne
              </p>
            </div>

            <div>
              <label style={SHORT_LABEL}>Prénom *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Emma"
              />
            </div>

            <div>
              <label style={SHORT_LABEL}>Relation</label>
              <RadioGroup
                name="relationship"
                value={relationship}
                onChange={(v) => setRelationship(v as Relationship)}
                options={[
                  { value: "partner", label: "Partenaire" },
                  { value: "friend", label: "Ami(e)" },
                  { value: "family", label: "Famille" },
                  { value: "colleague", label: "Collègue" },
                  { value: "other", label: "Autre" },
                ]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={SHORT_LABEL}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="facultatif" />
              </div>
              <div>
                <label style={SHORT_LABEL}>Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="facultatif" />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Mode choice ───────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>
                Comment créer le profil de {name} ?
              </h2>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--conf)" }}>
                Choisis une option pour continuer.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* PRIMARY: Il/elle remplit son profil */}
              <button
                onClick={handleGenerateLink}
                disabled={linkLoading}
                style={{
                  textAlign: "left", borderRadius: "var(--r-md)",
                  border: "1.5px solid var(--terra)", padding: "32px",
                  background: "var(--t1)", cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  opacity: linkLoading ? 0.6 : 1,
                  position: "relative",
                }}
              >
                <span style={{
                  position: "absolute", top: 16, right: 16,
                  background: "var(--terra)", color: "#fff",
                  fontSize: 10, fontWeight: 600, letterSpacing: 1,
                  padding: "4px 10px", borderRadius: 20,
                }}>
                  Recommandé ✦
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 500, color: "var(--con)", marginBottom: 10 }}>
                  Il/elle remplit son profil
                </h3>
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--con)", lineHeight: 1.6, marginBottom: 20 }}>
                  La méthode la plus précise. Ton proche répond en 5 minutes — Candice apprend vraiment qui il est.
                </p>
                <span style={{ fontSize: 16, fontWeight: 500, color: "var(--terra)" }}>
                  {linkLoading ? "Génération du lien…" : "Générer le lien à envoyer →"}
                </span>
              </button>

              {/* SECONDARY: Je remplis moi-même */}
              <button
                onClick={handleChooseIncognito}
                style={{
                  textAlign: "left", borderRadius: "var(--r-md)",
                  border: "0.5px solid var(--brd2)", padding: "32px",
                  background: "transparent", cursor: "pointer",
                  display: "flex", flexDirection: "column",
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 400, color: "var(--cond)", marginBottom: 10 }}>
                  Je remplis moi-même
                </h3>
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--conf)", lineHeight: 1.6, marginBottom: 20 }}>
                  Tu réponds à sa place, selon ce que tu sais de lui/elle. Idéal pour ceux peu à l&apos;aise avec le numérique.
                </p>
                <span style={{ fontSize: 16, fontWeight: 400, color: "var(--cond)" }}>
                  Continuer en mode incognito →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 (link): Link display ───────────────────────────────── */}
        {step === 2 && mode === "link" && linkContactId && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--terra)", marginBottom: 12 }}>
                Lien généré
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>
                Envoie ce lien à {name}.
              </h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--conf)", lineHeight: 1.5 }}>
                Il/elle peut remplir son profil en 5 minutes depuis son téléphone.
              </p>
            </div>

            <div style={{ border: "1px solid #E8C4A0", borderRadius: "var(--r-sm)", padding: "14px 16px", background: "#F8F4EE" }}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "#9E7B5A", marginBottom: 6 }}>
                Lien à partager
              </p>
              <p style={{ fontSize: 12, fontWeight: 300, color: "#7A5E44", wordBreak: "break-all", fontFamily: "monospace" }}>
                {profileUrl || `…/profil/${linkContactId}`}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={handleCopyLink} className="btn-ghost" style={{ width: "100%" }}>
                {copied ? "Copié ✓" : "Copier le lien"}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", textAlign: "center", textDecoration: "none",
                  background: "var(--terra)", color: "#fff",
                  padding: "10px 20px", borderRadius: "var(--r-sm)",
                  fontSize: 13, fontWeight: 400,
                }}
              >
                Envoyer par WhatsApp →
              </a>
              <p style={{ fontSize: 10, fontWeight: 300, color: "var(--conb)", textAlign: "center", lineHeight: 1.5 }}>
                Candice ne contacte jamais tes proches directement. Le lien vient de toi.
              </p>
            </div>

            <Link
              href={`/contacts/${linkContactId}`}
              style={{ fontSize: 12, fontWeight: 300, color: "var(--conf)", textAlign: "center", textDecoration: "none" }}
            >
              Voir la fiche de {name}
            </Link>
          </div>
        )}

        {/* ── STEP 2 (incognito): Psychological profile ─────────────────── */}
        {step === 2 && mode === "incognito" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 400, color: "var(--txt)", marginBottom: 4 }}>
                Profil de {name}
              </h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txtm)" }}>
                Réponds selon ce que tu sais — l&apos;approximation est normale.
              </p>
            </div>

            <div>
              <label style={FIELD_LABEL}>Comment {name} se sent-il/elle le plus aimé(e) ?</label>
              <MultiSelect values={loveLanguage} onChange={setLoveLanguage} options={[
                { value: "words", label: "Mots d'affirmation", description: "Compliments, encouragements, reconnaissance verbale" },
                { value: "acts", label: "Actes de service", description: "Aider avec les tâches, faire des choses pour lui/elle" },
                { value: "gifts", label: "Cadeaux", description: "Présents réfléchis, surprises" },
                { value: "time", label: "Temps de qualité", description: "Attention sans partage, expériences partagées" },
                { value: "touch", label: "Toucher physique", description: "Câlins, proximité physique, réconfort" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Style de communication de {name}</label>
              <MultiSelect values={communicationStyle} onChange={setCommunicationStyle} options={[
                { value: "direct", label: "Direct et concis", description: "Va droit au but, apprécie la clarté" },
                { value: "emotional", label: "Émotionnel et expressif", description: "Partage ses émotions, apprécie l'empathie" },
                { value: "analytical", label: "Analytique et détaillé", description: "Approfondi, aime réfléchir avant de parler" },
                { value: "casual", label: "Décontracté et humoristique", description: "Garde une atmosphère légère, utilise l'humour" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>En cas de stress, {name} a tendance à…</label>
              <MultiSelect values={stressResponse} onChange={setStressResponse} options={[
                { value: "withdraws", label: "Se retirer et avoir besoin d'espace", description: "Plus silencieux(se), recharge seul(e)" },
                { value: "seeks_support", label: "Chercher du soutien et en parler", description: "Veut exprimer et se sentir écouté(e)" },
                { value: "action_oriented", label: "Être dans l'action", description: "Canalise le stress en faisant des choses" },
                { value: "internalizes", label: "Intérioriser ses émotions", description: "Garde ses émotions pour lui/elle" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Énergie sociale de {name}</label>
              <MultiSelect values={socialEnergy} onChange={setSocialEnergy} options={[
                { value: "very_introverted", label: "Très introverti(e)", description: "Se ressource fortement dans la solitude" },
                { value: "introverted", label: "Plutôt introverti(e)", description: "Préfère les petits groupes" },
                { value: "ambivert", label: "Ambiverti(e)", description: "Dépend de l'humeur et du contexte" },
                { value: "extroverted", label: "Plutôt extraverti(e)", description: "Énergisé(e) par les autres" },
                { value: "very_extroverted", label: "Très extraverti(e)", description: "S'épanouit en société" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Ce qui touche vraiment {name}</label>
              <MultiSelect values={appreciationStyle} onChange={setAppreciationStyle} options={[
                { value: "verbal", label: "Reconnaissance verbale", description: "Un merci sincère, une félicitation exprimée à voix haute" },
                { value: "practical", label: "Aide pratique", description: "Quelqu'un qui voit ce dont il/elle a besoin et agit" },
                { value: "gifts", label: "Cadeaux réfléchis", description: "Un cadeau précis qui montre qu'on le/la connaît bien" },
                { value: "time", label: "Temps dédié", description: "Une conversation profonde, une activité partagée" },
                { value: "physical", label: "Gestes physiques", description: "Un câlin, une accolade, un geste affectueux" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Comment {name} gère-t-il/elle les désaccords ?</label>
              <MultiSelect values={conflictResolution} onChange={setConflictResolution} options={[
                { value: "direct", label: "Affronte directement", description: "Préfère crever l'abcès plutôt que laisser la tension s'installer" },
                { value: "processes_first", label: "A besoin de temps pour digérer", description: "Doit traiter ses émotions avant de pouvoir en parler" },
                { value: "avoids", label: "Évite les conflits", description: "Les tensions l'épuisent, préfère tourner la page" },
                { value: "humor", label: "Utilise l'humour pour désamorcer", description: "Désamorce avec une blague, relativise la situation" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Comment {name} prend-il/elle ses décisions ?</label>
              <MultiSelect values={decisionMaking} onChange={setDecisionMaking} options={[
                { value: "logic", label: "Logique et données", description: "Pèse les faits, les risques, les conséquences" },
                { value: "intuition", label: "Instinct", description: "Son ressenti guide ses choix plus que la raison" },
                { value: "consensus", label: "Avis des autres", description: "Les retours des proches l'aident à se positionner" },
                { value: "research", label: "Recherche approfondie", description: "A besoin d'informations complètes avant de décider" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Comment {name} exprime-t-il/elle ses émotions ?</label>
              <MultiSelect values={emotionalExpression} onChange={setEmotionalExpression} options={[
                { value: "openly", label: "Très ouvertement", description: "Partage facilement ses ressentis, ne se cache pas" },
                { value: "selectively", label: "Sélectivement", description: "S'ouvre uniquement aux personnes vraiment de confiance" },
                { value: "through_actions", label: "Par les actes", description: "Montre ce qu'il/elle ressent plutôt que de le dire" },
                { value: "rarely", label: "Rarement / en privé", description: "Intériorise beaucoup, gère ses émotions seul(e)" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Ce qui compte le plus pour {name} dans les relations</label>
              <MultiSelect values={coreValues} onChange={setCoreValues} options={[
                { value: "loyalty", label: "Loyauté et confiance", description: "Être là inconditionnellement, même dans les moments difficiles" },
                { value: "growth", label: "Croissance et apprentissage", description: "S'élever ensemble, s'interroger, évoluer" },
                { value: "fun", label: "Fun et expériences partagées", description: "Partager des bons moments, être complices" },
                { value: "stability", label: "Stabilité et fiabilité", description: "Compter sur l'autre, pas de surprises désagréables" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Quand {name} réussit quelque chose, il/elle préfère…</label>
              <MultiSelect values={recognitionPreference} onChange={setRecognitionPreference} options={[
                { value: "public", label: "Une reconnaissance publique", description: "Être mis(e) en avant, félicité(e) devant les autres" },
                { value: "private", label: "Une reconnaissance privée", description: "Un mot sincère, juste entre vous deux" },
                { value: "personal", label: "La satisfaction personnelle", description: "L'accomplissement lui-même est sa récompense" },
                { value: "celebrate", label: "Célébrer avec ses proches", description: "Partager le bonheur autour d'un repas ou d'une sortie" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Les limites les plus importantes pour {name}</label>
              <MultiSelect values={boundaries} onChange={setBoundaries} options={[
                { value: "space", label: "Espace personnel et solitude", description: "Ne pas être sollicité(e) en permanence, avoir ses moments" },
                { value: "emotional", label: "Limites émotionnelles", description: "Ne pas porter les émotions des autres sur ses épaules" },
                { value: "time", label: "Temps et planning", description: "Pouvoir organiser son agenda sans pression extérieure" },
                { value: "privacy", label: "Vie privée", description: "Garder certaines choses pour soi, sans devoir tout expliquer" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Comment {name} aborde-t-il/elle la croissance personnelle ?</label>
              <MultiSelect values={growthMindset} onChange={setGrowthMindset} options={[
                { value: "experiences", label: "Nouvelles expériences", description: "Voyages, nouvelles activités, sortir de sa zone de confort" },
                { value: "structured", label: "Apprentissage structuré", description: "Livres, formations, podcasts, cours en ligne" },
                { value: "reflective", label: "Réflexion intérieure", description: "Journal, méditation, introspection, thérapie" },
                { value: "community", label: "Apprentissage par les autres", description: "Discussions inspirantes, mentors, groupes de pratique" },
              ]} />
            </div>

          </div>
        )}

        {/* ── STEP 3 (incognito): Preferences ───────────────────────────── */}
        {step === 3 && mode === "incognito" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 400, color: "var(--txt)", marginBottom: 4 }}>
                Préférences de {name}
              </h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--txtm)" }}>
                Les détails concrets qui rendent les suggestions vraiment personnelles.
              </p>
            </div>

            <div>
              <label style={SHORT_LABEL}>Loisirs et intérêts</label>
              <textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} rows={2}
                placeholder="ex. randonnée, lecture de SF, cuisine italienne…" />
            </div>

            <div>
              <label style={SHORT_LABEL}>Plats et cuisines préférés</label>
              <textarea value={favoriteFoods} onChange={(e) => setFavoriteFoods(e.target.value)} rows={2}
                placeholder="ex. sushis, cuisine éthiopienne, déteste la coriandre…" />
            </div>

            <div>
              <label style={FIELD_LABEL}>Préférence pour les cadeaux</label>
              <MultiSelect values={giftPreference} onChange={setGiftPreference} options={[
                { value: "experiences", label: "Expériences", description: "Concerts, voyages, activités, dîners" },
                { value: "physical", label: "Cadeaux matériels", description: "Quelque chose de tangible à garder ou utiliser" },
                { value: "both", label: "Les deux également", description: "L'intention compte plus que la catégorie" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Quand quelqu&apos;un l&apos;invite ou lui offre quelque chose, à quoi il/elle s&apos;attend ?</label>
              <MultiSelect values={standing} onChange={setStanding} options={[
                { value: "any_sincere", label: "Touché(e) par n'importe quelle attention sincère", description: "Le geste compte plus que le prix ou le standing" },
                { value: "well_chosen", label: "Quelque chose de bien choisi, même simple", description: "Un cadeau réfléchi, même modeste, touche plus qu'un cadeau cher sans effort" },
                { value: "quality", label: "Attend un certain niveau de qualité", description: "Le cadre, le service ou la qualité du produit comptent" },
                { value: "high_standards", label: "Difficile(e) — remarque tout", description: "A des goûts précis et le remarque quand c'est raté" },
                { value: "no_preference", label: "Pas de préférence particulière", description: "Pas attaché(e) à ces détails" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Sa relation à la nourriture et aux restaurants</label>
              <MultiSelect values={gastronomy} onChange={setGastronomy} options={[
                { value: "anywhere", label: "Aime manger partout", description: "Un bon kebab autant qu'un restaurant gastronomique" },
                { value: "gourmet", label: "Gourmand(e) — bonne cuisine avant tout", description: "Aime bien manger, sans être snob sur le standing" },
                { value: "fine_dining", label: "Adore les belles tables", description: "Le cadre, le service et la présentation font partie du plaisir" },
                { value: "passion", label: "La gastronomie est une passion", description: "Suit les chefs, lit des guides, explore les adresses" },
                { value: "functional", label: "Mange pour vivre", description: "Ce n'est pas un plaisir central" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Si on lui offre un week-end, ce qui compte le plus</label>
              <MultiSelect values={accommodation} onChange={setAccommodation} options={[
                { value: "destination_only", label: "La destination avant tout", description: "L'hôtel c'est pour dormir, le reste n'a pas d'importance" },
                { value: "comfortable", label: "Un hôtel confortable et bien situé", description: "Propre, bien situé, bon petit-déjeuner — c'est suffisant" },
                { value: "charming", label: "Le charme et l'authenticité", description: "Adresses avec une âme, un style, une histoire" },
                { value: "luxury", label: "Le luxe et le service", description: "Palace, spa, room service — se sentir choyé(e)" },
                { value: "together", label: "L'important c'est d'être ensemble", description: "Peu importe où on dort, c'est le moment partagé qui compte" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Pour les cadeaux matériels, ce qui le/la touche le plus</label>
              <MultiSelect values={giftStyle} onChange={setGiftStyle} options={[
                { value: "useful", label: "Un objet utile et bien pensé", description: "Quelque chose qu'il/elle utilise vraiment au quotidien" },
                { value: "listened", label: "Quelque chose qui montre qu'on l'a écouté(e)", description: "Un cadeau précis qui prouve qu'on a retenu ce qu'il/elle a dit" },
                { value: "beautiful", label: "Un objet beau et de qualité", description: "Un objet esthétique, bien fait, dans de belles matières" },
                { value: "valuable", label: "Un objet de valeur symbolique", description: "Un bijou, une montre, un objet chargé de sens" },
                { value: "experiences", label: "Préfère les expériences aux objets", description: "Un dîner, un concert, un voyage touche plus qu'un objet" },
              ]} />
            </div>

            <div>
              <label style={SHORT_LABEL}>Sujets qu&apos;il/elle adore aborder</label>
              <textarea value={conversationTopics} onChange={(e) => setConversationTopics(e.target.value)} rows={2}
                placeholder="ex. philosophie, entrepreneuriat, son chien, ses voyages…" />
            </div>

            <div>
              <label style={SHORT_LABEL}>Choses à éviter</label>
              <textarea value={thingsToAvoid} onChange={(e) => setThingsToAvoid(e.target.value)} rows={2}
                placeholder="ex. fêtes surprises, plans de dernière minute…" />
            </div>

            <div>
              <label style={FIELD_LABEL}>Meilleure façon de le/la contacter</label>
              <MultiSelect values={bestContactMethod} onChange={setBestContactMethod} options={[
                { value: "text", label: "SMS", description: "Un message court suffit, répond à son rythme" },
                { value: "call", label: "Appel téléphonique", description: "Préfère entendre la voix, c'est plus direct" },
                { value: "email", label: "E-mail", description: "Pour les choses importantes ou les messages longs" },
                { value: "in_person", label: "En personne", description: "Rien ne vaut une vraie conversation face à face" },
              ]} />
            </div>

            <div>
              <label style={SHORT_LABEL}>Dates importantes</label>
              <textarea value={importantDates} onChange={(e) => setImportantDates(e.target.value)} rows={2}
                placeholder="ex. Anniversaire : 12 mars, Anniversaire pro : juin…" />
            </div>

            <div>
              <label style={SHORT_LABEL}>Notes libres</label>
              <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={3}
                placeholder="Allergies, situation actuelle, projets en cours…" />
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        {step !== 1 && !(step === 2 && mode === "link") && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 28, paddingTop: 20,
            borderTop: `0.5px solid ${isDark ? "var(--brd2)" : "var(--iv3)"}`,
          }}>
            {step > 0 ? (
              <button
                onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="btn-ghost"
              >
                ← Retour
              </button>
            ) : <div />}

            {step === 0 && (
              <button onClick={handleNext} className="btn-primary">
                Suivant →
              </button>
            )}

            {step === 2 && mode === "incognito" && (
              <button
                onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="btn-primary"
              >
                Suivant →
              </button>
            )}

            {step === 3 && mode === "incognito" && (
              <button onClick={handleSubmitIncognito} disabled={loading} className="btn-primary">
                {loading ? "Enregistrement…" : "Enregistrer ✓"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
