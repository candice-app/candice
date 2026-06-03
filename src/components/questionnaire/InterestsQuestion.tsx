"use client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface InterestDetails {
  genre?: string[];
  quel_sport?: string;
  style?: string;
  concerts?: boolean;
  type?: string[];
  marques?: string;
}

export interface InterestItem {
  id: string;
  rank: number;
  details?: InterestDetails;
}

export interface InterestsValue {
  items: InterestItem[];
  freeText?: string;
}

export const EMPTY_INTERESTS: InterestsValue = { items: [], freeText: "" };

// ─── Category metadata ─────────────────────────────────────────────────────────

type DetailType = "lecture_genre" | "sport_text" | "musique" | "voyage_type" | "mode_text";

interface CategoryDef {
  id: string;
  label: string;
  detailType?: DetailType;
}

export const INTEREST_CATEGORIES: CategoryDef[] = [
  { id: "lecture",  label: "Lecture",              detailType: "lecture_genre" },
  { id: "cuisine",  label: "Cuisine & gastronomie" },
  { id: "sport",    label: "Sport",                detailType: "sport_text" },
  { id: "musique",  label: "Musique",              detailType: "musique" },
  { id: "cinema",   label: "Ciné & séries" },
  { id: "art",      label: "Art & culture" },
  { id: "voyage",   label: "Voyage",               detailType: "voyage_type" },
  { id: "mode",     label: "Mode & beauté",         detailType: "mode_text" },
  { id: "tech",     label: "Tech & jeux" },
  { id: "nature",   label: "Nature & jardinage" },
  { id: "bienetre", label: "Bien-être" },
  { id: "deco",     label: "Déco & maison" },
  { id: "vin",      label: "Vin & spiritueux" },
];

export const INTEREST_LABELS: Record<string, string> = Object.fromEntries(
  INTEREST_CATEGORIES.map(c => [c.id, c.label])
);

const LECTURE_GENRES = [
  "Romans", "BD & mangas", "Dév perso", "Essais",
  "Polars", "Beaux livres", "Poésie", "Jeunesse", "Autre",
];

const VOYAGE_TYPES = [
  "City-trips", "Nature", "Dépaysement total",
  "Gastronomie", "Culture", "Bien-être", "Aventure", "Autre",
];

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value: InterestsValue;
  onChange: (v: InterestsValue) => void;
  label?: string;
}

export default function InterestsQuestion({ value, onChange, label = "Centres d'intérêt" }: Props) {
  function toggleCategory(id: string) {
    const existing = value.items.find(i => i.id === id);
    if (existing) {
      const remaining = value.items
        .filter(i => i.id !== id)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));
      onChange({ ...value, items: remaining });
    } else {
      onChange({ ...value, items: [...value.items, { id, rank: value.items.length + 1 }] });
    }
  }

  function updateDetails(id: string, details: InterestDetails) {
    onChange({
      ...value,
      items: value.items.map(item => item.id === id ? { ...item, details } : item),
    });
  }

  function toggleSubChip(id: string, field: "genre" | "type", chipVal: string) {
    const item = value.items.find(i => i.id === id);
    if (!item) return;
    const current: string[] = (item.details?.[field] ?? []) as string[];
    const updated = current.includes(chipVal)
      ? current.filter(v => v !== chipVal)
      : [...current, chipVal];
    updateDetails(id, { ...item.details, [field]: updated });
  }

  const detailItems = [...value.items]
    .sort((a, b) => a.rank - b.rank)
    .filter(item => INTEREST_CATEGORIES.find(c => c.id === item.id)?.detailType);

  const subInputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px",
    border: "0.5px solid var(--line)", borderRadius: 8,
    background: "transparent", color: "var(--ink)",
    fontSize: 13, fontWeight: 300, outline: "none",
    fontFamily: "var(--font-sans)", boxSizing: "border-box",
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <label style={{
        fontFamily: "var(--font-serif)",
        fontSize: "clamp(20px, 4.5vw, 24px)",
        fontWeight: 300,
        color: "var(--ink)",
        letterSpacing: "-.015em",
        lineHeight: 1.2,
        display: "block",
        marginBottom: 8,
      } as React.CSSProperties}>
        {label}
      </label>
      <p style={{
        fontSize: 12, fontWeight: 300, color: "var(--ink-3)",
        fontStyle: "italic", lineHeight: 1.5, marginBottom: 14,
      }}>
        Sélectionne dans l&apos;ordre — le premier compte le plus pour Candice.
      </p>

      {/* Category chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {INTEREST_CATEGORIES.map(cat => {
          const item = value.items.find(i => i.id === cat.id);
          const sel = !!item;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 20,
                fontSize: 13, fontWeight: sel ? 400 : 300, cursor: "pointer",
                userSelect: "none",
                background: sel ? "rgba(23,62,49,.08)" : "none",
                border: `0.5px solid ${sel ? "rgba(23,62,49,.3)" : "var(--line)"}`,
                color: sel ? "var(--pine)" : "var(--ink-2)",
                transition: "background .12s, border-color .12s",
              } as React.CSSProperties}
            >
              {sel && (
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: "var(--pine)", color: "#fff",
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  {item.rank}
                </span>
              )}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sub-detail panels for selected categories */}
      {detailItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {detailItems.map(item => {
            const cat = INTEREST_CATEGORIES.find(c => c.id === item.id)!;
            return (
              <div key={item.id} style={{
                padding: "14px 16px",
                background: "rgba(23,62,49,.03)",
                border: "0.5px solid rgba(23,62,49,.1)",
                borderRadius: 10,
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 500, letterSpacing: ".1em",
                  textTransform: "uppercase", color: "var(--pine)",
                  marginBottom: 12, opacity: .75,
                }}>
                  {cat.label}
                </p>

                {cat.detailType === "lecture_genre" && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 8 }}>Genre préféré</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {LECTURE_GENRES.map(g => {
                        const sel = (item.details?.genre ?? []).includes(g);
                        return (
                          <button key={g} type="button" onClick={() => toggleSubChip(item.id, "genre", g)} style={{
                            padding: "4px 10px", borderRadius: 14, fontSize: 12, fontWeight: 300, cursor: "pointer",
                            background: sel ? "rgba(23,62,49,.1)" : "none",
                            border: `0.5px solid ${sel ? "rgba(23,62,49,.3)" : "var(--line)"}`,
                            color: sel ? "var(--pine)" : "var(--ink-3)",
                          }}>
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {cat.detailType === "sport_text" && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 6 }}>Lequel ?</p>
                    <input
                      type="text"
                      value={item.details?.quel_sport ?? ""}
                      onChange={e => updateDetails(item.id, { ...item.details, quel_sport: e.target.value })}
                      placeholder="Ex : tennis, yoga, escalade…"
                      style={subInputStyle}
                    />
                  </div>
                )}

                {cat.detailType === "musique" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 6 }}>Quel style ?</p>
                      <input
                        type="text"
                        value={item.details?.style ?? ""}
                        onChange={e => updateDetails(item.id, { ...item.details, style: e.target.value })}
                        placeholder="Ex : jazz, rock, rap, classique…"
                        style={subInputStyle}
                      />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={item.details?.concerts ?? false}
                        onChange={e => updateDetails(item.id, { ...item.details, concerts: e.target.checked })}
                        style={{ accentColor: "var(--pine)", width: 14, height: 14 }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-2)" }}>Concerts / live</span>
                    </label>
                  </div>
                )}

                {cat.detailType === "voyage_type" && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 8 }}>Type de voyage</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {VOYAGE_TYPES.map(t => {
                        const sel = (item.details?.type ?? []).includes(t);
                        return (
                          <button key={t} type="button" onClick={() => toggleSubChip(item.id, "type", t)} style={{
                            padding: "4px 10px", borderRadius: 14, fontSize: 12, fontWeight: 300, cursor: "pointer",
                            background: sel ? "rgba(23,62,49,.1)" : "none",
                            border: `0.5px solid ${sel ? "rgba(23,62,49,.3)" : "var(--line)"}`,
                            color: sel ? "var(--pine)" : "var(--ink-3)",
                          }}>
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {cat.detailType === "mode_text" && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 6 }}>Des marques aimées ?</p>
                    <input
                      type="text"
                      value={item.details?.marques ?? ""}
                      onChange={e => updateDetails(item.id, { ...item.details, marques: e.target.value })}
                      placeholder="Ex : Isabel Marant, Zara, Aesop…"
                      style={subInputStyle}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Free text */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>
          Autre chose ? <span style={{ opacity: .6 }}>(facultatif)</span>
        </label>
        <textarea
          value={value.freeText ?? ""}
          onChange={e => onChange({ ...value, freeText: e.target.value })}
          placeholder="Passions moins connues, collections, hobbies…"
          rows={2}
          style={{
            width: "100%", padding: "10px 12px",
            border: "0.5px solid var(--line)", borderRadius: 8,
            background: "transparent", color: "var(--ink)",
            fontSize: 13, fontWeight: 300, lineHeight: 1.55,
            resize: "vertical", outline: "none",
            fontFamily: "var(--font-sans)", boxSizing: "border-box",
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
