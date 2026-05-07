"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ActionType = "archive" | "delete";

interface Props {
  type: ActionType;
  contactId: string;
  contactName: string;
  onClose: () => void;
}

const CONFIG = {
  archive: {
    title: "Archiver ce contact",
    warning: "Ce contact n'apparaîtra plus dans ton tableau de bord. Tu pourras le retrouver et le désarchiver depuis la section Archivés.",
    confirmLabel: "Archiver",
    endpoint: "/api/contacts/archive",
  },
  delete: {
    title: "Supprimer ce contact",
    warning: "Cette action est définitive et irréversible. Toutes les données de ce contact seront perdues — profil, historique, suggestions.",
    confirmLabel: "Supprimer définitivement",
    endpoint: "/api/contacts/delete",
  },
};

export default function ContactActionModal({ type, contactId, contactName, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const cfg = CONFIG[type];
  const supabase = createClient();

  const handleExecute = async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError("Impossible de récupérer ton compte."); setLoading(false); return; }

    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (authError) { setError("Mot de passe incorrect."); setLoading(false); return; }

    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });

    setLoading(false);
    if (!res.ok) { setError("Une erreur est survenue."); return; }

    router.push("/dashboard");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--cond)", marginBottom: 20 }}>
          Étape {step} / 2
        </p>

        {/* Step 1 — Confirmation visuelle */}
        {step === 1 && (
          <>
            <h2 className="modal-title">{cfg.title}</h2>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 4 }}>{contactName}</p>
            <p className="modal-body" style={{ color: type === "delete" ? "#E05252" : "var(--cond)" }}>
              {cfg.warning}
            </p>
            <div className="modal-actions">
              <button onClick={onClose} className="btn-ghost">Annuler</button>
              <button onClick={() => setStep(2)} className={type === "delete" ? "btn-danger" : "btn-primary"}>
                Continuer →
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Reauth */}
        {step === 2 && (
          <>
            <h2 className="modal-title">Confirme ton identité</h2>
            <p className="modal-body">
              Saisis ton mot de passe pour {type === "delete" ? "supprimer" : "archiver"} ce contact.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && password && !loading && handleExecute()}
              placeholder="••••••••"
              autoFocus
              style={{ marginBottom: 12 }}
            />
            {error && (
              <p style={{ fontSize: 11, color: "#E05252", marginBottom: 12 }}>{error}</p>
            )}
            <div className="modal-actions">
              <button onClick={() => { setStep(1); setPassword(""); setError(""); }} className="btn-ghost">
                Retour
              </button>
              <button
                onClick={handleExecute}
                disabled={!password || loading}
                className={type === "delete" ? "btn-danger" : "btn-primary"}
              >
                {loading ? "En cours…" : cfg.confirmLabel}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
