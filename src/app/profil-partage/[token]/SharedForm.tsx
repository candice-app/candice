"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { InsightsPanel } from "@/components/questionnaire/InsightCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MultiSelectProps {
  options: { value: string; label: string; description?: string }[];
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}

interface ImportantDate {
  label: string;
  date: string;
  isCustom?: boolean;
}

interface Props {
  token: string;
  senderName: string;
  onDone: (wasAuthenticated: boolean) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MultiSelect({ options, values, onChange, max = 3 }: MultiSelectProps) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else if (values.length < max) onChange([...values, v]);
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 300, color: "#A08060", fontStyle: "italic" }}>
          Jusqu&apos;à {max} réponses, de la plus importante à la moins importante
        </p>
        {values.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 500, color: "#C47A4A", marginLeft: 12, flexShrink: 0, background: "rgba(196,122,74,0.12)", padding: "2px 8px", borderRadius: 10, border: "0.5px solid rgba(196,122,74,0.3)" }}>
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
                position: "relative",
                background: selected ? "#C47A4A" : "#fff",
                border: `1px solid ${selected ? "#C47A4A" : "rgba(30,18,8,0.15)"}`,
                borderRadius: 8,
                padding: "10px 14px",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.4 : 1,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 140,
                flex: "1 1 140px",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {selected && (
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {rank + 1}
                  </span>
                )}
                <span style={{ fontSize: 13, fontWeight: selected ? 500 : 400, color: selected ? "#fff" : "#1E1208" }}>
                  {opt.label}
                </span>
              </div>
              {opt.description && (
                <span style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.35, color: selected ? "rgba(255,255,255,0.8)" : "rgba(30,18,8,0.55)", paddingLeft: selected ? 24 : 0, overflowWrap: "break-word", wordBreak: "break-word" }}>
                  {opt.description}
                </span>
              )}
              {selected && (
                <span style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 700, lineHeight: 1 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 400,
  fontFamily: "'Playfair Display', Georgia, serif",
  fontStyle: "italic",
  color: "#C47A4A",
  display: "block",
  textTransform: "none",
  letterSpacing: "normal",
  paddingBottom: 8,
  borderBottom: "2px solid #C47A4A",
  marginBottom: 16,
};

const SECTION_CARD: React.CSSProperties = {
  background: "#fff",
  border: "0.5px solid rgba(196,122,74,0.2)",
  borderRadius: 12,
  padding: "24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 28,
  marginBottom: 24,
};

const INPUT: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  background: "#FAF7F2",
  border: "1px solid rgba(30,18,8,0.12)",
  borderRadius: 6,
  color: "#1E1208",
  fontSize: 14,
  fontWeight: 300,
  padding: "10px 14px",
  width: "100%",
  outline: "none",
  resize: "vertical" as const,
};

const DEFAULT_DATES: ImportantDate[] = [
  { label: "Anniversaire", date: "", isCustom: false },
  { label: "Anniversaire de mariage", date: "", isCustom: false },
  { label: "Fête (prénom)", date: "", isCustom: false },
];

function parseImportantDates(raw: string | null): ImportantDate[] {
  if (!raw) return DEFAULT_DATES.map((d) => ({ ...d }));
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* legacy */ }
  return DEFAULT_DATES.map((d) => ({ ...d }));
}

const TOTAL_QUESTIONS = 36;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SharedForm({ token, senderName, onDone }: Props) {
  const supabase = createClient();
  const DRAFT_KEY = `candice_shared_draft_${token}`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [stickyToast, setStickyToast] = useState(false);

  const skipAutoSave = useRef(true);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Progressive insights
  const [insights, setInsights] = useState<string[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const lastInsightThreshold = useRef(0);

  // ── State ─────────────────────────────────────────────────────────────────

  // Psychological (12)
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
  // Preferences (10 multi + 4 text)
  const [hobbies, setHobbies] = useState("");
  const [dislikedActivities, setDislikedActivities] = useState("");
  const [favoriteFoods, setFavoriteFoods] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [giftPreference, setGiftPreference] = useState<string[]>([]);
  const [standing, setStanding] = useState<string[]>([]);
  const [gastronomy, setGastronomy] = useState<string[]>([]);
  const [accommodation, setAccommodation] = useState<string[]>([]);
  const [giftStyle, setGiftStyle] = useState<string[]>([]);
  const [tactility, setTactility] = useState<string[]>([]);
  const [conversationTopics, setConversationTopics] = useState("");
  const [thingsToAvoid, setThingsToAvoid] = useState("");
  const [bestContactMethod, setBestContactMethod] = useState<string[]>([]);
  const [importantDatesList, setImportantDatesList] = useState<ImportantDate[]>(
    () => DEFAULT_DATES.map((d) => ({ ...d }))
  );
  // Guided personal (5)
  const [healthComfort, setHealthComfort] = useState("");
  const [familyLife, setFamilyLife] = useState("");
  const [characterEmotions, setCharacterEmotions] = useState("");
  const [cannotStand, setCannotStand] = useState("");
  const [fewKnow, setFewKnow] = useState("");
  // Practical
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);
  const [religion, setReligion] = useState("");
  const [disability, setDisability] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  // Physical measurements
  const [clothingSize, setClothingSize] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [ringSize, setRingSize] = useState("");
  const [pantsSize, setPantsSize] = useState("");
  const [pets, setPets] = useState("");

  // ── Draft restore ──────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      const arr = (v: unknown): string[] => (Array.isArray(v) ? v : []);
      const str = (v: unknown): string => (typeof v === "string" ? v : "");
      setLoveLanguage(arr(d.loveLanguage));
      setCommunicationStyle(arr(d.communicationStyle));
      setStressResponse(arr(d.stressResponse));
      setSocialEnergy(arr(d.socialEnergy));
      setAppreciationStyle(arr(d.appreciationStyle));
      setConflictResolution(arr(d.conflictResolution));
      setDecisionMaking(arr(d.decisionMaking));
      setEmotionalExpression(arr(d.emotionalExpression));
      setCoreValues(arr(d.coreValues));
      setRecognitionPreference(arr(d.recognitionPreference));
      setBoundaries(arr(d.boundaries));
      setGrowthMindset(arr(d.growthMindset));
      setHobbies(str(d.hobbies));
      setDislikedActivities(str(d.dislikedActivities));
      setFavoriteFoods(str(d.favoriteFoods));
      setDislikedFoods(str(d.dislikedFoods));
      setGiftPreference(arr(d.giftPreference));
      setStanding(arr(d.standing));
      setGastronomy(arr(d.gastronomy));
      setAccommodation(arr(d.accommodation));
      setGiftStyle(arr(d.giftStyle));
      setTactility(arr(d.tactility));
      setConversationTopics(str(d.conversationTopics));
      setThingsToAvoid(str(d.thingsToAvoid));
      setBestContactMethod(arr(d.bestContactMethod));
      if (Array.isArray(d.importantDatesList)) setImportantDatesList(d.importantDatesList);
      setHealthComfort(str(d.healthComfort));
      setFamilyLife(str(d.familyLife));
      setCharacterEmotions(str(d.characterEmotions));
      setCannotStand(str(d.cannotStand));
      setFewKnow(str(d.fewKnow));
      setFoodAllergies(arr(d.foodAllergies));
      setDiet(arr(d.diet));
      setReligion(str(d.religion));
      setDisability(str(d.disability));
      setPostalAddress(str(d.postalAddress));
      setClothingSize(str(d.clothingSize));
      setShoeSize(str(d.shoeSize));
      setRingSize(str(d.ringSize));
      setPantsSize(str(d.pantsSize));
      setPets(str(d.pets));
      if (d.savedAt) setDraftSavedAt(new Date(d.savedAt));
    } catch { /* ignore corrupt draft */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (skipAutoSave.current) { skipAutoSave.current = false; return; }
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        const savedAt = new Date().toISOString();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          loveLanguage, communicationStyle, stressResponse, socialEnergy,
          appreciationStyle, conflictResolution, decisionMaking, emotionalExpression,
          coreValues, recognitionPreference, boundaries, growthMindset,
          hobbies, dislikedActivities, favoriteFoods, dislikedFoods,
          giftPreference, standing, gastronomy, accommodation, giftStyle,
          tactility, conversationTopics, thingsToAvoid, bestContactMethod,
          importantDatesList, healthComfort, familyLife, characterEmotions,
          cannotStand, fewKnow, foodAllergies, diet, religion, disability,
          postalAddress, clothingSize, shoeSize, ringSize, pantsSize, pets, savedAt,
        }));
        setDraftSavedAt(new Date(savedAt));
      } catch { /* storage unavailable */ }
    }, 600);
    return () => clearTimeout(draftTimerRef.current);
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    loveLanguage, communicationStyle, stressResponse, socialEnergy,
    appreciationStyle, conflictResolution, decisionMaking, emotionalExpression,
    coreValues, recognitionPreference, boundaries, growthMindset,
    hobbies, dislikedActivities, favoriteFoods, dislikedFoods,
    giftPreference, standing, gastronomy, accommodation, giftStyle,
    tactility, conversationTopics, thingsToAvoid, bestContactMethod,
    importantDatesList, healthComfort, familyLife, characterEmotions,
    cannotStand, fewKnow, foodAllergies, diet, religion, disability, postalAddress,
    clothingSize, shoeSize, ringSize, pantsSize, pets,
  ]);

  // ── Progress ───────────────────────────────────────────────────────────────

  const answeredCount =
    [loveLanguage, communicationStyle, stressResponse, socialEnergy,
      appreciationStyle, conflictResolution, decisionMaking, emotionalExpression,
      coreValues, recognitionPreference, boundaries, growthMindset,
      giftPreference, standing, gastronomy, accommodation, giftStyle,
      tactility, bestContactMethod, diet, foodAllergies,
    ].filter((a) => a.length > 0).length +
    [hobbies, dislikedActivities, favoriteFoods, dislikedFoods,
      conversationTopics, thingsToAvoid, healthComfort, familyLife,
      characterEmotions, cannotStand, fewKnow, religion, disability, postalAddress,
      clothingSize, shoeSize, ringSize, pantsSize, pets,
    ].filter((s) => s.trim().length > 0).length +
    (importantDatesList.some((d) => d.date) ? 1 : 0);

  const pct = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  // Trigger insight every 8 answered questions
  useEffect(() => {
    if (answeredCount === 0) return;
    const threshold = Math.floor(answeredCount / 8) * 8;
    if (threshold <= 0 || threshold <= lastInsightThreshold.current) return;
    lastInsightThreshold.current = threshold;
    const answers: Record<string, string> = {};
    if (loveLanguage.length) answers.love_language = loveLanguage.join(",");
    if (communicationStyle.length) answers.communication_style = communicationStyle.join(",");
    if (stressResponse.length) answers.stress_response = stressResponse.join(",");
    if (socialEnergy.length) answers.social_energy = socialEnergy.join(",");
    if (appreciationStyle.length) answers.appreciation_style = appreciationStyle.join(",");
    if (conflictResolution.length) answers.conflict_resolution = conflictResolution.join(",");
    if (decisionMaking.length) answers.decision_making = decisionMaking.join(",");
    if (emotionalExpression.length) answers.emotional_expression = emotionalExpression.join(",");
    if (coreValues.length) answers.core_values = coreValues.join(",");
    if (recognitionPreference.length) answers.recognition_preference = recognitionPreference.join(",");
    if (boundaries.length) answers.boundaries = boundaries.join(",");
    if (growthMindset.length) answers.growth_mindset = growthMindset.join(",");
    if (giftPreference.length) answers.gift_preference = giftPreference.join(",");
    setInsightLoading(true);
    fetch("/api/questionnaire-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, persona: "self" }),
    })
      .then(r => r.json())
      .then(d => { if (d.insight) setInsights(prev => [...prev, d.insight]); })
      .catch(() => {})
      .finally(() => setInsightLoading(false));
  }, [answeredCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const motivationalMsg =
    pct === 0  ? "C'est parti ! Plus ta fiche est complète, plus les attentions seront personnalisées." :
    pct < 25   ? "Bien ! Continue — chaque réponse affine ton profil." :
    pct < 50   ? "À mi-chemin ! Plus que quelques questions avant de découvrir ton profil." :
    pct < 75   ? "Tu y es presque — les meilleures suggestions arrivent avec une fiche complète." :
    `Dernière ligne droite ! 🎁 ${senderName} aura tout ce qu'il/elle faut pour te faire plaisir.`;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const join = (arr: string[]) => arr.join(",") || null;

  const buildPayload = () => ({
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
    disliked_activities: dislikedActivities || null,
    favorite_foods: favoriteFoods || null,
    disliked_foods: dislikedFoods || null,
    gift_preference: join(giftPreference),
    standing: join(standing),
    gastronomy: join(gastronomy),
    accommodation: join(accommodation),
    gift_style: join(giftStyle),
    tactility: join(tactility),
    conversation_topics: conversationTopics || null,
    things_to_avoid: thingsToAvoid || null,
    best_contact_method: join(bestContactMethod),
    important_dates: importantDatesList.some((d) => d.date) ? JSON.stringify(importantDatesList) : null,
    health_comfort: healthComfort || null,
    family_life: familyLife || null,
    character_emotions: characterEmotions || null,
    cannot_stand: cannotStand || null,
    few_know: fewKnow || null,
    food_allergies: join(foodAllergies),
    diet: join(diet),
    religion: religion || null,
    disability: disability || null,
    postal_address: postalAddress || null,
    clothing_size: clothingSize || null,
    shoe_size: shoeSize || null,
    ring_size: ringSize || null,
    pants_size: pantsSize || null,
    pets: pets || null,
  });

  const handleSaveLater = () => {
    clearTimeout(draftTimerRef.current);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...buildPayload(), savedAt: new Date().toISOString() }));
    } catch { /* ignore */ }
    setStickyToast(true);
    // no redirect for SharedForm (it's a public form)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = buildPayload();

      if (user) {
        const { error: err } = await supabase.from("shared_profile_responses").upsert(
          { token, user_id: user.id, response_data: payload, updated_at: new Date().toISOString() },
          { onConflict: "token,user_id" }
        );
        if (err) {
          setError("Impossible d'enregistrer. Tes réponses sont conservées — réessaie dans un instant.");
          return;
        }
        await fetch("/api/shared-profile/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }

      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      onDone(!!user);
    } catch {
      setError("Une erreur inattendue. Tes réponses sont conservées — réessaie.");
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const PAGE: React.CSSProperties = {
    minHeight: "100vh",
    background: "#FAF7F2",
    color: "#1E1208",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  const INNER: React.CSSProperties = {
    maxWidth: 580,
    margin: "0 auto",
    padding: "0 20px 100px",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={PAGE}>
      {/* Header */}
      <header style={{ padding: "16px 24px", borderBottom: "0.5px solid rgba(30,18,8,0.1)", display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: "#C47A4A" }}>
          candice
        </span>
      </header>

      <div style={INNER}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {error && (
            <p style={{ fontSize: 13, color: "#E05252", background: "rgba(224,82,82,0.08)", border: "0.5px solid rgba(224,82,82,0.25)", borderRadius: 6, padding: "10px 14px", margin: "20px 0" }}>
              {error}
            </p>
          )}

          {/* ── Banner ── */}
          <div style={{ borderRadius: 12, overflow: "hidden", marginTop: 28, marginBottom: 24 }}>
            <div style={{ background: "#2C1A0E", padding: "24px 24px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
                <h2 style={{ fontSize: 20, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", color: "#FAF7F2", lineHeight: 1.25, margin: 0 }}>
                  Tes réponses restent 100% confidentielles
                </h2>
              </div>
              <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.8)", lineHeight: 1.7 }}>
                {senderName} ne lira jamais tes réponses directement. Candice les analyse en silence pour comprendre qui tu es vraiment et personnaliser les attentions — jamais tes mots exacts ne seront partagés.
              </p>
            </div>
            <div style={{ background: "#F0E8DC", padding: "14px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 300, color: "#7A5E44", lineHeight: 1.6 }}>
                ⏱ Environ 10 minutes · Tes réponses sont sauvegardées automatiquement à chaque modification.
              </p>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 400, color: "#7A5E44" }}>
                {answeredCount} / {TOTAL_QUESTIONS} questions complétées
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#C47A4A" }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(196,122,74,0.15)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#C47A4A", borderRadius: 2, width: `${pct}%`, transition: "width 0.3s ease" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", color: "#C47A4A", marginTop: 10, lineHeight: 1.4 }}>
              {motivationalMsg}
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 1 — Qui es-tu ?
          ══════════════════════════════════════════════════════════════ */}
          <div style={SECTION_CARD}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", color: "#C47A4A", marginBottom: 4 }}>Qui es-tu ?</h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(196,122,74,0.7)", fontStyle: "italic" }}>Réponds instinctivement — il n&apos;y a pas de mauvaise réponse.</p>
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

          {/* Progressive insights after psychological section */}
          <InsightsPanel insights={insights} loadingInsight={insightLoading} />

          {/* ══════════════════════════════════════════════════════════════
              SECTION 2 — Tes préférences
          ══════════════════════════════════════════════════════════════ */}
          <div style={SECTION_CARD}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", color: "#C47A4A", marginBottom: 4 }}>Tes préférences.</h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(196,122,74,0.7)", fontStyle: "italic" }}>Les détails qui changent tout.</p>
            </div>

            <div>
              <label style={FIELD_LABEL}>Ce que j&apos;adore faire</label>
              <textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} rows={2} style={INPUT} placeholder="ex. escalade, séries coréennes, cuisiner pour les autres…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Ce que j&apos;évite ou déteste</label>
              <textarea value={dislikedActivities} onChange={(e) => setDislikedActivities(e.target.value)} rows={2} style={INPUT} placeholder="ex. les sports collectifs, les jeux de société…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Ce que j&apos;adore manger</label>
              <textarea value={favoriteFoods} onChange={(e) => setFavoriteFoods(e.target.value)} rows={2} style={INPUT} placeholder="ex. cuisine japonaise, pizzas napolitaines…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Ce que je déteste manger</label>
              <textarea value={dislikedFoods} onChange={(e) => setDislikedFoods(e.target.value)} rows={2} style={INPUT} placeholder="ex. foie gras, anchois, plats trop épicés…" />
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
              <label style={FIELD_LABEL}>Quand quelqu&apos;un m&apos;invite ou m&apos;offre quelque chose…</label>
              <MultiSelect values={standing} onChange={setStanding} options={[
                { value: "any_sincere", label: "N'importe quelle attention sincère me touche", description: "Le geste compte plus que le prix ou le standing" },
                { value: "well_chosen", label: "Quelque chose de bien choisi, même simple", description: "Un cadeau réfléchi, même modeste, me touche plus qu'un cadeau cher sans effort" },
                { value: "quality", label: "Un certain niveau de qualité", description: "Le cadre, le service ou la qualité du produit comptent pour moi" },
                { value: "high_standards", label: "Je suis difficile(e), je remarque tout", description: "J'ai des goûts précis et je le remarque quand c'est raté" },
                { value: "no_preference", label: "Pas de préférence", description: "Je ne suis pas attaché(e) à ces détails" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Ma relation à la nourriture et aux restaurants</label>
              <MultiSelect values={gastronomy} onChange={setGastronomy} options={[
                { value: "anywhere", label: "J'aime manger partout", description: "Un bon kebab me fait autant plaisir qu'un restaurant gastronomique" },
                { value: "gourmet", label: "Je suis gourmand(e)", description: "J'aime bien manger, sans être snob sur le standing" },
                { value: "fine_dining", label: "J'adore les belles tables", description: "Le cadre, le service et la présentation font partie du plaisir" },
                { value: "passion", label: "La gastronomie est une passion", description: "Je suis les chefs, je lis des guides, j'explore les adresses" },
                { value: "functional", label: "Je mange pour vivre", description: "Ce n'est pas un plaisir central pour moi" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Si on m&apos;offre un week-end, ce qui compte le plus…</label>
              <MultiSelect values={accommodation} onChange={setAccommodation} options={[
                { value: "destination_only", label: "La destination avant tout", description: "L'hôtel c'est pour dormir, le reste n'a pas d'importance" },
                { value: "comfortable", label: "Un hôtel confortable et bien situé", description: "Propre, bien situé, bon petit-déjeuner — c'est suffisant" },
                { value: "charming", label: "Le charme, l'authenticité", description: "J'aime les adresses avec une âme, un style, une histoire" },
                { value: "luxury", label: "Le luxe et le service", description: "Palace, spa, room service — je veux me sentir choyé(e)" },
                { value: "together", label: "L'important c'est d'être ensemble", description: "Peu importe où on dort, c'est le moment partagé qui compte" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Pour les cadeaux matériels, ce qui me touche le plus</label>
              <MultiSelect values={giftStyle} onChange={setGiftStyle} options={[
                { value: "useful", label: "Un objet utile et bien pensé", description: "Quelque chose que j'utilise vraiment au quotidien" },
                { value: "listened", label: "Quelque chose qui montre qu'on m'a écouté(e)", description: "Un cadeau précis qui montre qu'on a retenu ce que j'ai dit" },
                { value: "beautiful", label: "Un objet beau et de qualité", description: "Un objet esthétique, bien fait, dans de belles matières" },
                { value: "valuable", label: "Un objet de valeur symbolique", description: "Un bijou, une montre, un objet chargé de sens" },
                { value: "experiences", label: "Je préfère les expériences aux objets", description: "Un dîner, un concert, un voyage me touche plus qu'un objet" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Je suis tactile…</label>
              <MultiSelect values={tactility} onChange={setTactility} max={1} options={[
                { value: "everyone", label: "Avec tout le monde", description: "J'embrasse facilement, je touche l'épaule, je suis naturellement proche" },
                { value: "partner_only", label: "Avec mon/ma partenaire uniquement", description: "Le contact physique reste réservé à l'intimité amoureuse" },
                { value: "children_only", label: "Avec mes enfants uniquement", description: "Les câlins oui, mais uniquement avec mes enfants" },
                { value: "close_ones", label: "Avec mes proches (famille/amis)", description: "À l'aise avec les gens que je connais bien" },
                { value: "not_at_all", label: "Pas du tout", description: "Je préfère garder mes distances physiques avec tout le monde" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Les sujets qui me stimulent vraiment</label>
              <textarea value={conversationTopics} onChange={(e) => setConversationTopics(e.target.value)} rows={2} style={INPUT} placeholder="ex. startups, psychologie, voyages, foot…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Ce qu&apos;il vaut mieux éviter avec moi</label>
              <textarea value={thingsToAvoid} onChange={(e) => setThingsToAvoid(e.target.value)} rows={2} style={INPUT} placeholder="ex. les surprises, annuler à la dernière minute…" />
            </div>

            <div>
              <label style={FIELD_LABEL}>La meilleure façon de me contacter</label>
              <MultiSelect values={bestContactMethod} onChange={setBestContactMethod} options={[
                { value: "text", label: "Message (WhatsApp, SMS…)", description: "Un message court suffit, je réponds à mon rythme" },
                { value: "call", label: "Appel", description: "Je préfère entendre la voix, c'est plus direct" },
                { value: "email", label: "E-mail", description: "Pour les choses importantes ou les messages longs" },
                { value: "in_person", label: "En vrai, de préférence", description: "Rien ne vaut une vraie conversation face à face" },
              ]} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Mes dates importantes</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {importantDatesList.map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {row.isCustom ? (
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => {
                          const updated = [...importantDatesList];
                          updated[i] = { ...row, label: e.target.value };
                          setImportantDatesList(updated);
                        }}
                        placeholder="Nom de la date…"
                        style={{ ...INPUT, flex: 1, padding: "10px 12px" }}
                      />
                    ) : (
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 400, color: "#1E1208", padding: "10px 14px", background: "rgba(196,122,74,0.06)", borderRadius: 6, border: "1px solid rgba(196,122,74,0.15)", display: "block" }}>
                        {row.label}
                      </span>
                    )}
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => {
                        const updated = [...importantDatesList];
                        updated[i] = { ...row, date: e.target.value };
                        setImportantDatesList(updated);
                      }}
                      style={{ ...INPUT, width: 160, flexShrink: 0 }}
                    />
                    {row.isCustom && (
                      <button type="button" onClick={() => setImportantDatesList(importantDatesList.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "#A08060", fontSize: 18, cursor: "pointer", padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setImportantDatesList([...importantDatesList, { label: "", date: "", isCustom: true }])}
                  style={{ background: "transparent", border: "1px dashed rgba(196,122,74,0.4)", color: "#C47A4A", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", alignSelf: "flex-start", marginTop: 4 }}>
                  + Ajouter une date
                </button>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 3 — Pour aller plus loin
          ══════════════════════════════════════════════════════════════ */}
          <div style={SECTION_CARD}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", color: "#C47A4A", marginBottom: 4 }}>Pour aller plus loin.</h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(196,122,74,0.7)", fontStyle: "italic" }}>Ces réponses restent strictement privées. Sois aussi honnête(e) que tu le souhaites.</p>
            </div>
            <div>
              <label style={FIELD_LABEL}>Ma santé & confort</label>
              <textarea value={healthComfort} onChange={(e) => setHealthComfort(e.target.value)} rows={2} style={INPUT} placeholder="ex. problèmes de dos, mobilité réduite, migraines fréquentes…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Ma famille & vie perso</label>
              <textarea value={familyLife} onChange={(e) => setFamilyLife(e.target.value)} rows={2} style={INPUT} placeholder="ex. parent de deux enfants, en couple depuis 3 ans…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Mon caractère & émotions</label>
              <textarea value={characterEmotions} onChange={(e) => setCharacterEmotions(e.target.value)} rows={2} style={INPUT} placeholder="ex. je gère mal la critique, j'ai besoin de temps seul après une longue journée…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Ce que je ne supporte pas</label>
              <textarea value={cannotStand} onChange={(e) => setCannotStand(e.target.value)} rows={2} style={INPUT} placeholder="ex. les moqueries, les surprises, le bruit, qu'on soit en retard…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Ce que peu de gens savent sur moi</label>
              <textarea value={fewKnow} onChange={(e) => setFewKnow(e.target.value)} rows={3} style={INPUT} placeholder="ex. j'adore les mangas, j'ai peur de l'avion, j'ai vécu 3 ans en Asie…" />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 4 — Infos pratiques
          ══════════════════════════════════════════════════════════════ */}
          <div style={SECTION_CARD}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", color: "#C47A4A", marginBottom: 4 }}>Infos pratiques.</h2>
              <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(196,122,74,0.7)", fontStyle: "italic" }}>Pour que les attentions soient parfaitement adaptées à toi.</p>
            </div>
            <div>
              <label style={FIELD_LABEL}>Taille vêtements</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["XS", "S", "M", "L", "XL", "XXL"].map(size => (
                  <label key={size} style={{ padding: "8px 18px", borderRadius: 8, border: clothingSize === size ? "1px solid #C47A4A" : "1px solid rgba(30,18,8,0.12)", background: clothingSize === size ? "#C47A4A" : "#fff", color: clothingSize === size ? "#fff" : "#1E1208", cursor: "pointer", fontSize: 14, fontWeight: clothingSize === size ? 500 : 300, userSelect: "none" as const }}>
                    <input type="radio" name="clothingSize" value={size} checked={clothingSize === size} onChange={() => setClothingSize(size)} style={{ display: "none" }} />
                    {size}
                  </label>
                ))}
                {clothingSize && <button type="button" onClick={() => setClothingSize("")} style={{ fontSize: 12, color: "#A08060", background: "none", border: "none", cursor: "pointer" }}>Effacer</button>}
              </div>
            </div>
            <div>
              <label style={FIELD_LABEL}>Pointure chaussures</label>
              <input type="number" value={shoeSize} onChange={e => setShoeSize(e.target.value)} placeholder="ex. 42" min={28} max={50} style={{ ...INPUT, width: 120 }} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Taille bague (optionnel)</label>
              <input type="text" value={ringSize} onChange={e => setRingSize(e.target.value)} placeholder="ex. 54, 56…" style={{ ...INPUT, width: 160 }} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Taille pantalon (optionnel)</label>
              <input type="text" value={pantsSize} onChange={e => setPantsSize(e.target.value)} placeholder="ex. 36/32, Slim 34…" style={{ ...INPUT, width: 200 }} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Allergies alimentaires</label>
              <MultiSelect values={foodAllergies} onChange={setFoodAllergies} max={6} options={[
                { value: "aucune", label: "Aucune allergie" },
                { value: "gluten", label: "Gluten" },
                { value: "lactose", label: "Lactose" },
                { value: "noix", label: "Noix & fruits à coque" },
                { value: "fruits_mer", label: "Fruits de mer" },
                { value: "autre", label: "Autre" },
              ]} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Régime alimentaire</label>
              <MultiSelect values={diet} onChange={setDiet} max={4} options={[
                { value: "omnivore", label: "Omnivore", description: "Je mange de tout sans contrainte" },
                { value: "vegetarian", label: "Végétarien(ne)", description: "Pas de viande ni poisson" },
                { value: "vegan", label: "Vegan", description: "Aucun produit d'origine animale" },
                { value: "halal", label: "Halal", description: "Alimentation conforme aux règles halal" },
                { value: "kosher", label: "Casher", description: "Alimentation conforme aux règles casher" },
                { value: "no_preference", label: "Sans préférence", description: "Pas de contrainte particulière" },
              ]} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Animaux de compagnie (optionnel)</label>
              <input type="text" value={pets} onChange={e => setPets(e.target.value)} placeholder="ex. un chat roux, deux chiens, des poissons tropicaux…" style={INPUT} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Religion & convictions (optionnel)</label>
              <textarea value={religion} onChange={(e) => setReligion(e.target.value)} rows={2} style={INPUT} placeholder="ex. catholique pratiquant, bouddhiste, agnostique…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Situation de handicap (optionnel)</label>
              <textarea value={disability} onChange={(e) => setDisability(e.target.value)} rows={2} style={INPUT} placeholder="ex. malvoyant(e), fauteuil roulant, douleurs chroniques…" />
            </div>
            <div>
              <label style={FIELD_LABEL}>Adresse postale (pour les livraisons)</label>
              <textarea value={postalAddress} onChange={(e) => setPostalAddress(e.target.value)} rows={2} style={INPUT} placeholder="ex. 12 rue de la Paix, 75001 Paris" />
            </div>
          </div>

          {/* ── Submit ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{ background: "#C47A4A", color: "#fff", border: "none", borderRadius: 6, padding: "16px 24px", fontSize: 15, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, width: "100%" }}
            >
              {loading ? "Enregistrement…" : "Enregistrer ma fiche →"}
            </button>
            {draftSavedAt && (
              <p style={{ textAlign: "center", fontSize: 11, fontWeight: 300, color: "#A08060" }}>
                Brouillon sauvegardé
              </p>
            )}
          </div>

          {/* ── Sticky save button ── */}
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {stickyToast && (
              <div style={{ background: "#22543D", color: "#fff", fontSize: 13, fontWeight: 400, borderRadius: 8, padding: "8px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
                Brouillon sauvegardé ✓
              </div>
            )}
            <button
              type="button"
              onClick={handleSaveLater}
              style={{ background: "#fff", border: "1.5px solid #C47A4A", color: "#C47A4A", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
            >
              💾 Sauvegarder et revenir plus tard
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
