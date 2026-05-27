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
  const [contextText, setContextText] = useState("");
  const [contextSaving, setContextSaving] = useState(false);
  // true = we're in the "compliquée" detail phase after register was saved
  const [showContext, setShowContext] = useState(false);

  async function saveRegister(value: RelationshipRegister) {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("contacts")
      .update({ relationship_register: value })
      .eq("id", contactId);
    setRegister(value);
    setSaving(false);

    if (value === "compliquée_fragile") {
      // Load existing context text before showing the block
      const { data } = await supabase
        .from("context_journal")
        .select("answer")
        .eq("contact_id", contactId)
        .eq("type", "register_complicated_context")
        .maybeSingle();
      if (data?.answer) setContextText(data.answer as string);
      setShowContext(true);
    } else {
      setEditing(false);
      setShowContext(false);
    }
  }

  async function saveContext() {
    setContextSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("context_journal")
        .delete()
        .eq("contact_id", contactId)
        .eq("user_id", user.id)
        .eq("type", "register_complicated_context");

      if (contextText.trim()) {
        await supabase.from("context_journal").insert({
          user_id: user.id,
          contact_id: contactId,
          type: "register_complicated_context",
          question: "Comment tu aimes entretenir le lien, malgré ce qui est compliqué",
          answer: contextText.trim(),
        });
      }
    }
    setContextSaving(false);
    setEditing(false);
    setShowContext(false);
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
                onClick={() => saveRegister(opt.value)}
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

        {/* Expanding "compliquée" context block */}
        {showContext && (
          <div style={{
            marginTop: 18,
            padding: "16px 14px",
            background: "rgba(23,62,49,.03)",
            borderRadius: 8,
            border: "0.5px solid rgba(23,62,49,.12)",
            opacity: 1,
            transition: "opacity .4s ease",
          }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--ink)", marginBottom: 4 }}>
              Tu veux nous en dire un peu plus ? <span style={{ fontWeight: 300, color: "var(--ink-3)" }}>(facultatif)</span>
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 12 }}>
              Cela nous aidera à proposer juste, sans tomber à côté.
            </p>
            <label style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-2)", display: "block", marginBottom: 6, letterSpacing: ".04em" }}>
              Comment tu aimes entretenir le lien, malgré ce qui est compliqué
            </label>
            <textarea
              value={contextText}
              onChange={e => setContextText(e.target.value)}
              rows={4}
              placeholder="Par ex. : pour sa fête, je veux quand même un cadeau, mais sobre — qui montre que je connais ses goûts, sans démonstration affective. Plutôt un mot court qu'un long message. Pas d'appels surprise."
              style={{
                width: "100%", padding: "10px 12px", fontSize: 12, fontWeight: 300,
                lineHeight: 1.6, border: "0.5px solid var(--line)", borderRadius: 6,
                background: "var(--bg)", color: "var(--ink)", resize: "vertical",
                outline: "none", boxSizing: "border-box", fontFamily: "var(--font-sans)",
              }}
            />
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.55, marginTop: 10, fontStyle: "italic" }}>
              Sur ce registre, Candice propose avec retenue. Tes retours après chaque attention nous aideront à viser juste — n&apos;hésite pas à nous dire ce qui a bien atterri ou pas.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={saveContext}
                disabled={contextSaving}
                style={{ fontSize: 12, fontWeight: 400, color: "var(--pine)", background: "none", border: "0.5px solid rgba(23,62,49,.25)", borderRadius: 6, padding: "6px 14px", cursor: "pointer", opacity: contextSaving ? 0.6 : 1 }}
              >
                {contextSaving ? "Sauvegarde…" : "Valider"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setShowContext(false); }}
                style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {!showContext && (
          <button
            type="button"
            onClick={() => { setEditing(false); setShowContext(false); }}
            style={{ marginTop: 10, fontSize: 11, fontWeight: 300, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Annuler
          </button>
        )}
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
