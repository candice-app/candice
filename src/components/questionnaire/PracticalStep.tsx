"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportantDate {
  type: string;
  label: string;
  date: string;
}

export interface PracticalInfo {
  // Alimentation
  allergies:          string[]; // ["aucune"] | ["gluten", "lactose", ...]
  regime:             string;
  alcool:             string;
  // Confort
  mobilite_sante:     string;
  // Tailles
  taille_vetements:   string;
  taille_chaussures:  string;
  taille_pantalon:    string;
  taille_bague:       string;
  // Goûts olfactifs
  parfums:            string[];
  odeurs_detestees:   string;
  // Esthétique
  couleurs_matieres:  string;
  // Pratique
  adresse_livraison:  string; // private — never displayed
  animaux:            string;
  // Agenda
  dates_importantes:  ImportantDate[];
  role_familial:      string;
  // Veto flags (derived from above)
  vetos: {
    no_alcohol:          boolean;
    halal:               boolean;
    casher:              boolean;
    mobility_constraints: boolean;
    allergies:           string[];
  };
}

interface Props {
  onDone: (info: PracticalInfo) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_INFO: PracticalInfo = {
  allergies: [],
  regime: "",
  alcool: "",
  mobilite_sante: "",
  taille_vetements: "",
  taille_chaussures: "",
  taille_pantalon: "",
  taille_bague: "",
  parfums: [],
  odeurs_detestees: "",
  couleurs_matieres: "",
  adresse_livraison: "",
  animaux: "",
  dates_importantes: [],
  role_familial: "",
  vetos: {
    no_alcohol: false,
    halal: false,
    casher: false,
    mobility_constraints: false,
    allergies: [],
  },
};

function deriveVetos(info: Omit<PracticalInfo, "vetos">): PracticalInfo["vetos"] {
  return {
    no_alcohol: info.alcool === "ne_bois_pas" || info.alcool === "eviter_lieux",
    halal: info.regime === "halal",
    casher: info.regime === "casher",
    mobility_constraints: info.mobilite_sante.trim().length > 3,
    allergies: info.allergies.filter(a => a !== "aucune"),
  };
}

// ─── Hero header ──────────────────────────────────────────────────────────────

function PracticalHero() {
  return (
    <div className="q-header">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        <span className="q-idx">07 — 07</span>
      </div>
      <div className="q-bar-track">
        <div className="q-bar-fill" style={{ width: "86%" }} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 10 }}>
        Informations pratiques
      </p>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: ".26em",
      textTransform: "uppercase",
      color: "var(--pine)",
      marginBottom: 16,
      marginTop: 8,
    }}>
      {children}
    </p>
  );
}

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ children, note }: { children: string; note?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{
        fontSize: 15,
        fontWeight: 400,
        color: "var(--ink)",
        lineHeight: 1.3,
      }}>
        {children}
      </p>
      {note && (
        <p style={{
          fontSize: 12,
          fontWeight: 300,
          color: "var(--ink-3)",
          fontStyle: "italic",
          marginTop: 3,
        }}>
          {note}
        </p>
      )}
    </div>
  );
}

// ─── Pill grid (multi or single select) ──────────────────────────────────────

function PillGrid({
  options, values, onChange, multi = false,
}: {
  options: { id: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
  multi?: boolean;
}) {
  function toggle(id: string) {
    if (multi) {
      if (values.includes(id)) onChange(values.filter(x => x !== id));
      else onChange([...values, id]);
    } else {
      onChange(values.includes(id) ? [] : [id]);
    }
  }

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    }}>
      {options.map(opt => {
        const selected = values.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 20,
              border: selected ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
              background: selected ? "rgba(23,62,49,.07)" : "var(--white)",
              color: selected ? "var(--pine)" : "var(--ink-2)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: selected ? 500 : 400,
              cursor: "pointer",
              transition: "all .18s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Text input ───────────────────────────────────────────────────────────────

function TextInput({
  placeholder, value, onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: focused ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
        background: "var(--white)",
        fontFamily: "var(--font-sans)",
        fontSize: 15,
        fontWeight: 300,
        color: "var(--ink)",
        outline: "none",
        boxSizing: "border-box",
        marginBottom: 24,
        transition: "border-color .18s",
      } as React.CSSProperties}
    />
  );
}

// ─── Textarea field ───────────────────────────────────────────────────────────

function ShortTextarea({
  placeholder, value, onChange, rows = 2,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: focused ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
        background: "var(--white)",
        fontFamily: "var(--font-sans)",
        fontSize: 15,
        fontWeight: 300,
        color: "var(--ink)",
        lineHeight: 1.55,
        resize: "none",
        outline: "none",
        boxSizing: "border-box",
        marginBottom: 24,
        transition: "border-color .18s",
      } as React.CSSProperties}
    />
  );
}

// ─── Dates importantes manager ────────────────────────────────────────────────

const DATE_TYPES = [
  { id: "anniversaire", label: "Anniversaire" },
  { id: "fete",         label: "Fête" },
  { id: "mariage",      label: "Mariage" },
  { id: "perso",        label: "Date personnelle" },
  { id: "symbolique",   label: "Date symbolique" },
];

function DatesManager({
  dates, onChange,
}: {
  dates: ImportantDate[];
  onChange: (d: ImportantDate[]) => void;
}) {
  function add() {
    onChange([...dates, { type: "anniversaire", label: "Anniversaire", date: "" }]);
  }
  function remove(i: number) {
    onChange(dates.filter((_, idx) => idx !== i));
  }
  function update(i: number, field: keyof ImportantDate, value: string) {
    const updated = dates.map((d, idx) => {
      if (idx !== i) return d;
      if (field === "type") {
        const found = DATE_TYPES.find(t => t.id === value);
        return { ...d, type: value, label: found?.label ?? d.label };
      }
      return { ...d, [field]: value };
    });
    onChange(updated);
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {dates.map((d, i) => (
        <div key={i} style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          marginBottom: 10,
        }}>
          <select
            value={d.type}
            onChange={e => update(i, "type", e.target.value)}
            style={{
              flex: "0 0 auto",
              padding: "10px 10px",
              borderRadius: 10,
              border: "0.5px solid var(--line)",
              background: "var(--white)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 300,
              color: "var(--ink-2)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {DATE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
            <option value="autre">Autre</option>
          </select>
          <input
            type="date"
            value={d.date}
            onChange={e => update(i, "date", e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "0.5px solid var(--line)",
              background: "var(--white)",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 300,
              color: "var(--ink)",
              outline: "none",
              boxSizing: "border-box",
            } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              marginTop: 4,
              borderRadius: 8,
              border: "0.5px solid var(--line)",
              background: "none",
              color: "var(--ink-3)",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          padding: "9px 16px",
          borderRadius: 20,
          border: "0.5px solid var(--pine)",
          background: "none",
          color: "var(--pine)",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 400,
          cursor: "pointer",
        }}
      >
        + Ajouter une date
      </button>
    </div>
  );
}

// ─── Size input (needs own state for focus) ───────────────────────────────────

function SizeField({
  label, placeholder, value, onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 6 }}>
        {label}
      </p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: focused ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
          background: "var(--white)",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 300,
          color: "var(--ink)",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color .18s",
        } as React.CSSProperties}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PracticalStep({ onDone }: Props) {
  const router = useRouter();
  const [info, setInfo] = useState<Omit<PracticalInfo, "vetos">>(EMPTY_INFO);

  function setField<K extends keyof Omit<PracticalInfo, "vetos">>(key: K) {
    return (v: Omit<PracticalInfo, "vetos">[K]) =>
      setInfo(prev => ({ ...prev, [key]: v }));
  }

  function handleDone() {
    const vetos = deriveVetos(info);
    onDone({ ...info, vetos });
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <PracticalHero />

      <div style={{ padding: "28px 20px 40px" }}>

        {/* RGPD intro — verbatim from bible */}
        <div style={{
          background: "rgba(23,62,49,.04)",
          border: "0.5px solid rgba(23,62,49,.12)",
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 36,
        }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontOpticalSizing: "auto",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.65,
          } as React.CSSProperties}>
            Ces informations restent strictement privées. Elles ne seront jamais affichées à tes proches.
            Elles servent uniquement à éviter les recommandations maladroites : mauvais restaurant,
            mauvaise taille, cadeau incompatible, lieu inaccessible.
          </p>
        </div>

        {/* ── Alimentation ── */}
        <SectionLabel>Alimentation</SectionLabel>

        <FieldLabel>Allergies alimentaires</FieldLabel>
        <PillGrid
          multi
          options={[
            { id: "aucune",          label: "Aucune" },
            { id: "gluten",          label: "Gluten" },
            { id: "lactose",         label: "Lactose" },
            { id: "fruits_a_coque",  label: "Fruits à coque" },
            { id: "fruits_de_mer",   label: "Fruits de mer" },
            { id: "autre",           label: "Autre" },
          ]}
          values={info.allergies}
          onChange={setField("allergies")}
        />

        <FieldLabel>Régime alimentaire</FieldLabel>
        <PillGrid
          options={[
            { id: "omnivore",        label: "Omnivore" },
            { id: "vegetarien",      label: "Végétarien" },
            { id: "vegan",           label: "Vegan" },
            { id: "halal",           label: "Halal" },
            { id: "casher",          label: "Casher" },
            { id: "sans_preference", label: "Sans préférence" },
            { id: "autre",           label: "Autre" },
          ]}
          values={info.regime ? [info.regime] : []}
          onChange={v => setField("regime")(v[0] ?? "")}
        />

        <FieldLabel>Rapport à l'alcool</FieldLabel>
        <PillGrid
          options={[
            { id: "je_bois",       label: "Je bois" },
            { id: "ne_bois_pas",   label: "Je n'en bois pas" },
            { id: "occasionnel",   label: "Occasionnel" },
            { id: "eviter_lieux",  label: "Éviter les lieux centrés alcool" },
          ]}
          values={info.alcool ? [info.alcool] : []}
          onChange={v => setField("alcool")(v[0] ?? "")}
        />

        {/* ── Confort & mobilité ── */}
        <SectionLabel>Confort</SectionLabel>

        <FieldLabel
          note="Mobilité, santé, confort physique — utile pour éviter les lieux inadaptés."
        >
          Mobilité / santé / confort
        </FieldLabel>
        <ShortTextarea
          placeholder="ex. genou fragile, dos sensible, je ne peux pas faire de longues marches…"
          value={info.mobilite_sante}
          onChange={setField("mobilite_sante")}
        />

        {/* ── Tailles ── */}
        <SectionLabel>Tailles</SectionLabel>

        <FieldLabel note="Pour éviter les erreurs de cadeau vestimentaire.">
          Quelles tailles te vont généralement le mieux ?
        </FieldLabel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <SizeField label="Vêtements" placeholder="ex. M, L, 40…"   value={info.taille_vetements}  onChange={setField("taille_vetements")} />
          <SizeField label="Chaussures" placeholder="ex. 42, EU 38…" value={info.taille_chaussures} onChange={setField("taille_chaussures")} />
          <SizeField label="Pantalon" placeholder="ex. 40, 32×32…"   value={info.taille_pantalon}   onChange={setField("taille_pantalon")} />
          <SizeField label="Bague" placeholder="ex. 52, taille 7…"   value={info.taille_bague}      onChange={setField("taille_bague")} />
        </div>

        {/* ── Goûts olfactifs ── */}
        <SectionLabel>Goûts</SectionLabel>

        <FieldLabel>Parfums et odeurs aimées</FieldLabel>
        <PillGrid
          multi
          options={[
            { id: "frais",       label: "Frais" },
            { id: "poudre",      label: "Poudré" },
            { id: "boise",       label: "Boisé" },
            { id: "floral",      label: "Floral" },
            { id: "gourmand",    label: "Gourmand" },
            { id: "ambre",       label: "Ambré" },
            { id: "discret",     label: "Discret" },
            { id: "sans_parfum", label: "Sans parfum" },
          ]}
          values={info.parfums}
          onChange={setField("parfums")}
        />

        <FieldLabel>Odeurs ou parfums que je déteste</FieldLabel>
        <ShortTextarea
          placeholder="ex. muscs forts, patchouli, parfums sucrés entêtants…"
          value={info.odeurs_detestees}
          onChange={setField("odeurs_detestees")}
        />

        <FieldLabel>Couleurs, matières, style</FieldLabel>
        <ShortTextarea
          placeholder="ex. tons neutres, lin et soie, minimaliste — ou couleurs vives, vintage, bohème…"
          value={info.couleurs_matieres}
          onChange={setField("couleurs_matieres")}
        />

        {/* ── Pratique ── */}
        <SectionLabel>Pratique</SectionLabel>

        <FieldLabel note="Pour les envois — jamais partagée avec tes proches.">
          Adresse de livraison
        </FieldLabel>
        <ShortTextarea
          placeholder="Adresse complète"
          value={info.adresse_livraison}
          onChange={setField("adresse_livraison")}
          rows={2}
        />

        <FieldLabel>Animaux de compagnie</FieldLabel>
        <TextInput
          placeholder="ex. un chien, deux chats, aucun…"
          value={info.animaux}
          onChange={setField("animaux")}
        />

        {/* ── Agenda ── */}
        <SectionLabel>Agenda</SectionLabel>

        <FieldLabel note="Anniversaire, fête, mariage, dates symboliques — pour ne jamais les rater.">
          Dates importantes
        </FieldLabel>
        <DatesManager
          dates={info.dates_importantes}
          onChange={setField("dates_importantes")}
        />

        <FieldLabel>Ton rôle et lien familial</FieldLabel>
        <PillGrid
          options={[
            { id: "conjoint",      label: "Conjoint·e" },
            { id: "ami",           label: "Ami·e" },
            { id: "pere",          label: "Père" },
            { id: "mere",          label: "Mère" },
            { id: "enfant",        label: "Enfant" },
            { id: "frere_soeur",   label: "Frère / Sœur" },
            { id: "beaux_parents", label: "Beaux-parents" },
            { id: "collegue",      label: "Collègue" },
            { id: "autre",         label: "Autre" },
          ]}
          values={info.role_familial ? [info.role_familial] : []}
          onChange={v => setField("role_familial")(v[0] ?? "")}
        />

        {/* CTA */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={handleDone}
            className="btn-primary"
            style={{ width: "100%", minHeight: 52 }}
          >
            Terminer →
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-3)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 0",
              textAlign: "left",
            }}
          >
            Reprendre plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
