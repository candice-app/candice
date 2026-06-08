"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const SEXE_OPTIONS = [
  { id: "femme",              label: "Femme" },
  { id: "homme",              label: "Homme" },
  { id: "non_binaire",        label: "Non-binaire" },
  { id: "ne_se_prononce_pas", label: "Préfère ne pas préciser" },
];

const ROLE_OPTIONS = [
  { id: "pere",          label: "Père" },
  { id: "mere",          label: "Mère" },
  { id: "enfant",        label: "Enfant" },
  { id: "frere_soeur",   label: "Frère / Sœur" },
  { id: "beaux_parents", label: "Beaux-parents" },
  { id: "collegue",      label: "Collègue" },
  { id: "autre",         label: "Autre" },
];

interface Props {
  initialSexe: string;
  initialAge: string;
  initialProfession: string;
  initialRoleFamilial: string[];
}

export default function CompteActions({ initialSexe, initialAge, initialProfession, initialRoleFamilial }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // ── Mot de passe ──────────────────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    setPwdError(null);
    setPwdMessage(null);
    if (newPassword.length < 8) { setPwdError("Au moins 8 caractères."); return; }
    if (newPassword !== confirmPassword) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwdLoading(false);
    if (error) {
      setPwdError(error.message);
    } else {
      setPwdMessage("Mot de passe mis à jour.");
      setShowPasswordForm(false);
      setNewPassword(""); setConfirmPassword("");
    }
  };

  // ── Informations personnelles ─────────────────────────────────────────────────
  const [sexe, setSexe] = useState(initialSexe);
  const [age, setAge] = useState(initialAge);
  const [profession, setProfession] = useState(initialProfession);
  const [roleFamilial, setRoleFamilial] = useState<string[]>(initialRoleFamilial);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  const toggleRole = (id: string) => {
    setRoleFamilial(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleInfoSave = async () => {
    setInfoLoading(true);
    setInfoMessage(null);
    setInfoError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setInfoError("Session expirée."); setInfoLoading(false); return; }

    // Merge — don't overwrite other practical_info fields
    const { data: current } = await supabase
      .from("my_profile")
      .select("practical_info")
      .eq("user_id", user.id)
      .maybeSingle();

    const merged = {
      ...(current?.practical_info as Record<string, unknown> ?? {}),
      sexe,
      age,
      profession,
      role_familial: roleFamilial,
    };

    const { error } = await supabase
      .from("my_profile")
      .update({ practical_info: merged, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    setInfoLoading(false);
    if (error) {
      setInfoError("Erreur lors de la mise à jour.");
    } else {
      setInfoMessage("Informations mises à jour.");
      router.refresh();
    }
  };

  // ── Déconnexion ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // ── Styles partagés ──────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", fontSize: 14, fontWeight: 300,
    border: "0.5px solid rgba(23,62,49,.2)", borderRadius: 10,
    background: "var(--white)", color: "var(--ink)", outline: "none",
    fontFamily: "var(--font-sans)", width: "100%", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 6, display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Informations personnelles ── */}
      <div style={{ borderBottom: "0.5px solid var(--line)", padding: "20px 0" }}>
        <p style={{ fontSize: 14, fontWeight: 400, color: "var(--ink)", marginBottom: 18 }}>
          Informations personnelles
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Sexe */}
          <div>
            <span style={labelStyle}>Genre</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SEXE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSexe(sexe === opt.id ? "" : opt.id)}
                  style={{
                    padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 300,
                    border: sexe === opt.id ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
                    background: sexe === opt.id ? "rgba(23,62,49,.07)" : "var(--white)",
                    color: sexe === opt.id ? "var(--pine)" : "var(--ink-2)",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Âge */}
          <div>
            <label style={labelStyle}>Âge</label>
            <input
              type="text"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="ex. 32"
              style={inputStyle}
            />
          </div>

          {/* Profession */}
          <div>
            <label style={labelStyle}>Profession</label>
            <input
              type="text"
              value={profession}
              onChange={e => setProfession(e.target.value)}
              placeholder="ex. infirmière, développeur, enseignant…"
              style={inputStyle}
            />
          </div>

          {/* Rôle familial */}
          <div>
            <span style={labelStyle}>Rôle familial</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ROLE_OPTIONS.map(opt => {
                const active = roleFamilial.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleRole(opt.id)}
                    style={{
                      padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 300,
                      border: active ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
                      background: active ? "rgba(23,62,49,.07)" : "var(--white)",
                      color: active ? "var(--pine)" : "var(--ink-2)",
                      cursor: "pointer", fontFamily: "var(--font-sans)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {infoError && <p style={{ fontSize: 12, color: "#E05252", margin: 0 }}>{infoError}</p>}
          {infoMessage && <p style={{ fontSize: 12, color: "#4A7C59", margin: 0 }}>{infoMessage}</p>}

          <button
            onClick={handleInfoSave}
            disabled={infoLoading}
            style={{
              alignSelf: "flex-start",
              padding: "9px 20px", fontSize: 13, fontWeight: 400,
              color: "var(--canvas)", background: "var(--pine)",
              border: "none", borderRadius: 20, cursor: infoLoading ? "not-allowed" : "pointer",
              opacity: infoLoading ? 0.6 : 1, fontFamily: "var(--font-sans)",
            }}
          >
            {infoLoading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* ── Mot de passe ── */}
      <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            style={{
              fontSize: 14, fontWeight: 300, color: "var(--ink-2)",
              background: "none", border: "none", cursor: "pointer",
              padding: 0, fontFamily: "var(--font-sans)", textAlign: "left",
            }}
          >
            Changer le mot de passe
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--ink)", marginBottom: 2 }}>
              Nouveau mot de passe
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="8 caractères minimum"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              style={inputStyle}
            />
            {pwdError && <p style={{ fontSize: 12, color: "#E05252", margin: 0 }}>{pwdError}</p>}
            {pwdMessage && <p style={{ fontSize: 12, color: "#4A7C59", margin: 0 }}>{pwdMessage}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowPasswordForm(false); setPwdError(null); setNewPassword(""); setConfirmPassword(""); }}
                style={{
                  fontSize: 13, fontWeight: 300, color: "var(--ink-3)",
                  background: "none", border: "0.5px solid var(--line)",
                  borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={pwdLoading || !newPassword || !confirmPassword}
                style={{
                  flex: 1, fontSize: 13, fontWeight: 400,
                  color: "var(--canvas)", background: "var(--pine)",
                  border: "none", borderRadius: 8, padding: "8px 16px",
                  cursor: (pwdLoading || !newPassword || !confirmPassword) ? "not-allowed" : "pointer",
                  opacity: (pwdLoading || !newPassword || !confirmPassword) ? 0.5 : 1,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {pwdLoading ? "Mise à jour…" : "Mettre à jour"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Déconnexion ── */}
      <button
        onClick={handleLogout}
        style={{
          fontSize: 14, fontWeight: 300, color: "var(--ink-2)",
          background: "none", border: "none", cursor: "pointer",
          padding: "16px 0", textAlign: "left",
          fontFamily: "var(--font-sans)",
          borderBottom: "0.5px solid var(--line)",
        }}
      >
        Se déconnecter
      </button>
    </div>
  );
}
