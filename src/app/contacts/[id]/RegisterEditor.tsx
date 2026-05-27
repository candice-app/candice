"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RelationshipRegister } from "@/types";

const REGISTER_OPTIONS: { value: RelationshipRegister; label: string; subtext: string }[] = [
  { value: "très_proche_fluide",     label: "Très proche et fluide",                   subtext: "Vous pouvez vous parler naturellement, sans trop réfléchir." },
  { value: "proche_quotidien",       label: "Proche, mais prise dans le quotidien",     subtext: "Le lien est là, mais il manque parfois de temps ou d'attention." },
  { value: "importante_distante",    label: "Importante, mais un peu distante",         subtext: "Vous tenez l'un à l'autre, mais le lien n'est pas toujours nourri." },
  { value: "compliquée_fragile",     label: "Compliquée ou fragile",                    subtext: "Il faut éviter les attentions trop intimes ou trop émotionnelles." },
  { value: "formelle_occasionnelle", label: "Plutôt formelle ou occasionnelle",         subtext: "Les attentions doivent rester simples, sobres et adaptées." },
  { value: "je_ne_sais_pas",         label: "Je ne sais pas trop",                      subtext: "Candice commencera doucement, sans supposer trop d'intimité." },
];

const REGISTER_LABEL: Record<RelationshipRegister, string> = {
  'très_proche_fluide':     'Très proche et fluide',
  'proche_quotidien':       'Proche, mais prise dans le quotidien',
  'importante_distante':    'Importante, mais un peu distante',
  'compliquée_fragile':     'Compliquée ou fragile',
  'formelle_occasionnelle': 'Plutôt formelle ou occasionnelle',
  'je_ne_sais_pas':         'Je ne sais pas trop',
};

interface Props {
  contactId: string;
  initialRegister: RelationshipRegister | null;
}

export default function RegisterEditor({ contactId, initialRegister }: Props) {
  const [register, setRegister] = useState<RelationshipRegister | null>(initialRegister);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(value: RelationshipRegister) {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("contacts")
      .update({ relationship_register: value })
      .eq("id", contactId);
    setRegister(value);
    setEditing(false);
    setSaving(false);
  }

  if (editing) {
    return (
      <div style={{ marginTop: 16, padding: "14px 0" }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>
          Registre de relation
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {REGISTER_OPTIONS.map((opt) => {
            const selected = register === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={saving}
                onClick={() => save(opt.value)}
                style={{
                  textAlign: "left", padding: "11px 13px",
                  borderRadius: 8,
                  border: selected ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
                  background: selected ? "rgba(23,62,49,.05)" : "transparent",
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: selected ? 500 : 400, color: selected ? "var(--pine)" : "var(--ink)", marginBottom: 2 }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.45 }}>
                  {opt.subtext}
                </p>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setEditing(false)}
          style={{ marginTop: 10, fontSize: 11, fontWeight: 300, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "10px 0", borderTop: "0.5px solid var(--line)" }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 3 }}>
          Registre de relation
        </p>
        <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)" }}>
          {register ? REGISTER_LABEL[register] : "Non défini"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{ fontSize: 11, fontWeight: 300, color: "var(--pine)", background: "none", border: "0.5px solid rgba(23,62,49,.25)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}
      >
        Modifier
      </button>
    </div>
  );
}
