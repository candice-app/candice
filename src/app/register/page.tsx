"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Wordmark from "@/components/presence/Wordmark";
import { normalizeHandle, handleFormatError } from "@/lib/handle";

const BG = "var(--canvas)";
const WHITE = "var(--white)";
const PINE = "var(--pine)";
const INK = "var(--ink)";
const ERR = "#C44A4A";
const DM = "var(--font-sans)";
const SERIF = "var(--font-serif)";

const PHONE_RE = /^[+0-9\s().-]{6,}$/;

const LABEL_STYLE: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  fontSize: 12, fontWeight: 500, letterSpacing: 1,
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 8,
};

const ERR_STYLE: React.CSSProperties = {
  fontSize: 13, fontWeight: 400, color: ERR,
  margin: "6px 0 0", lineHeight: 1.4,
};

function isDuplicateError(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("already registered") || m.includes("user already") || m.includes("already been registered");
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token");
  // B.2 Phase 7 — lien de partage sortant : après inscription, retour sur
  // /rejoindre/[token] (le claim se fait là, côté serveur, une fois connecté)
  const shareToken = searchParams.get("share_token");
  const supabase = createClient();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [globalError, setGlobalError] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [handleError, setHandleError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [termsHighlight, setTermsHighlight] = useState(false);
  const [loading, setLoading] = useState(false);

  const termsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear all errors
    setEmailError(""); setPasswordError(""); setPhoneError(""); setHandleError("");
    setTermsError(""); setGlobalError(""); setIsDuplicate(false);

    let hasError = false;

    const normalizedHandle = normalizeHandle(handle);
    const handleFormatMsg = handleFormatError(normalizedHandle);
    if (handleFormatMsg) {
      setHandleError(handleFormatMsg); hasError = true;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Adresse email invalide."); hasError = true;
    }
    if (password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères."); hasError = true;
    }
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      setPhoneError("Format de téléphone invalide."); hasError = true;
    }
    if (!termsAccepted) {
      setTermsError("Vous devez accepter les conditions générales pour continuer.");
      setTermsHighlight(true);
      setTimeout(() => setTermsHighlight(false), 2000);
      termsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    // Disponibilité de l'identifiant AVANT la création du compte
    try {
      const checkRes = await fetch("/api/handle/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: normalizedHandle }),
      });
      const check = await checkRes.json() as { available: boolean; error?: string };
      if (!check.available) {
        setHandleError(check.error ?? "Cet identifiant est déjà pris.");
        setLoading(false);
        return;
      }
    } catch {
      // Vérification indisponible : on laisse la création continuer,
      // l'unicité reste garantie en base (index) au moment de l'écriture.
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    });

    if (signUpError) {
      if (isDuplicateError(signUpError.message)) {
        setIsDuplicate(true);
      } else {
        setGlobalError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setGlobalError("Compte créé ! Vérifiez votre boîte e-mail pour confirmer votre adresse avant de vous connecter.");
        setLoading(false);
        return;
      }
    }

    // Enregistrer l'identifiant (et le téléphone) sur my_profile.
    // L'identifiant passe par l'API (validation + unicité serveur) ; en cas
    // de course perdue, le compte reste valide et l'identifiant se choisit
    // dans Paramètres → Mon compte.
    await fetch("/api/handle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: normalizedHandle }),
    }).catch(() => {});

    // Save phone to my_profile — non-blocking
    if (phone.trim()) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        supabase.from("my_profile").upsert(
          { user_id: currentUser.id, phone: phone.trim(), updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        ).then(() => {});
      }
    }

    // Fire welcome email — non-blocking
    fetch("/api/emails/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: name.trim(), email }),
    }).catch(() => {});

    const destination = inviteToken
      ? `/moi/questionnaire?invite_token=${encodeURIComponent(inviteToken)}`
      : shareToken
        ? `/rejoindre/${encodeURIComponent(shareToken)}`
        : "/dashboard";
    router.push(destination);
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: BG, fontFamily: DM }}>
      <style>{`
        .reg-input {
          width: 100%; box-sizing: border-box;
          height: 52px; padding: 0 16px;
          font-size: 16px; font-weight: 300;
          background: var(--white); border: 0.5px solid var(--line);
          border-radius: 8px; color: var(--ink);
          font-family: var(--font-sans); outline: none;
          transition: border-color 0.15s;
        }
        .reg-input:focus { border-color: var(--pine); }
        .reg-input::placeholder { color: var(--ink-3); }
        .reg-terms-check {
          width: 24px; height: 24px; border-radius: 5px; flex-shrink: 0; margin-top: 1px;
          border: 1.5px solid var(--champ-line);
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .reg-terms-check.highlight {
          border-color: #C44A4A;
          box-shadow: 0 0 0 3px rgba(196,74,74,0.15);
        }
        .reg-btn:hover:not(:disabled) { opacity: 0.9; }
      `}</style>

      <header style={{ padding: "20px 24px", borderBottom: "0.5px solid var(--line)" }}>
        <Wordmark href="/" />
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(28px, 5vw, 36px)", color: INK, marginBottom: 8, lineHeight: 1.1, letterSpacing: "-.022em" }}>
              Créer un compte.
            </h1>
            <p style={{ fontSize: 16, fontWeight: 300, color: "var(--ink-2)", margin: 0 }}>
              Quelques secondes suffisent
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            style={{
              background: WHITE, borderRadius: 12,
              boxShadow: "0 4px 24px rgba(30,67,49,0.06)",
              padding: "clamp(24px, 5vw, 40px)",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Global errors */}
            {(globalError || isDuplicate) && (
              <div style={{ marginBottom: 24, padding: "12px 16px", background: "rgba(196,74,74,0.06)", borderRadius: 8, border: "1px solid rgba(196,74,74,0.18)" }}>
                <p style={{ fontSize: 13, color: ERR, margin: 0, lineHeight: 1.55 }}>
                  {isDuplicate ? (
                    <>
                      Un compte existe déjà avec cet e-mail.{" "}
                      <Link href="/login" style={{ color: ERR, fontWeight: 500, textDecoration: "underline" }}>
                        Se connecter
                      </Link>
                    </>
                  ) : globalError}
                </p>
              </div>
            )}

            {/* Prénom */}
            <div style={{ marginBottom: 20 }}>
              <div style={LABEL_STYLE}>
                <span>Prénom</span>
                <span style={{ color: PINE, fontWeight: 700, fontSize: 11 }}>*</span>
              </div>
              <input
                id="name"
                className="reg-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                autoComplete="given-name"
              />
            </div>

            {/* Identifiant */}
            <div style={{ marginBottom: 4 }}>
              <div style={LABEL_STYLE}>
                <span>Identifiant</span>
                <span style={{ color: PINE, fontWeight: 700, fontSize: 11 }}>*</span>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, fontWeight: 300, color: "var(--ink-3)", pointerEvents: "none",
                }}>@</span>
                <input
                  id="handle"
                  className="reg-input"
                  type="text"
                  value={handle}
                  onChange={(e) => { setHandle(e.target.value.toLowerCase()); if (handleError) setHandleError(""); }}
                  placeholder="alex.dupont"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  style={{ paddingLeft: 34 }}
                />
              </div>
              <div style={{ minHeight: 28 }}>
                {handleError
                  ? <p style={ERR_STYLE}>{handleError}</p>
                  : <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", margin: "6px 0 0", lineHeight: 1.4 }}>
                      Unique, comme sur Instagram — c&apos;est lui que tes proches saisiront pour te trouver.
                    </p>}
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 4 }}>
              <div style={LABEL_STYLE}>
                <span>E-mail</span>
                <span style={{ color: PINE, fontWeight: 700, fontSize: 11 }}>*</span>
              </div>
              <input
                id="email"
                className="reg-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
              <div style={{ minHeight: 28 }}>
                {emailError && <p style={ERR_STYLE}>{emailError}</p>}
              </div>
            </div>

            {/* Téléphone (optionnel) */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ ...LABEL_STYLE, gap: 6 }}>
                <span>Téléphone</span>
                <span style={{ fontSize: 11, fontWeight: 300, color: "rgba(44,26,14,0.4)", textTransform: "none", letterSpacing: 0 }}>
                  (optionnel)
                </span>
              </div>
              <input
                id="phone"
                className="reg-input"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                placeholder="+33 6 00 00 00 00"
                autoComplete="tel"
              />
              <div style={{ minHeight: 28 }}>
                {phoneError && <p style={ERR_STYLE}>{phoneError}</p>}
              </div>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 4 }}>
              <div style={LABEL_STYLE}>
                <span>Mot de passe</span>
                <span style={{ color: PINE, fontWeight: 700, fontSize: 11 }}>*</span>
              </div>
              <input
                id="password"
                className="reg-input"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                placeholder="Min. 8 caractères"
                autoComplete="new-password"
              />
              <div style={{ minHeight: 28 }}>
                {passwordError && <p style={ERR_STYLE}>{passwordError}</p>}
              </div>
            </div>

            {/* CGU */}
            <div ref={termsRef} style={{ marginBottom: 28 }}>
              <label
                htmlFor="terms"
                style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
              >
                {/* Hidden real checkbox */}
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); if (termsError) setTermsError(""); }}
                  style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                />
                {/* Visual checkbox */}
                <span
                  className={`reg-terms-check${termsHighlight ? " highlight" : ""}`}
                  style={{ background: termsAccepted ? PINE : "transparent" }}
                  aria-hidden="true"
                >
                  {termsAccepted && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#FDFDFB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span style={{ fontSize: 14, fontWeight: 300, color: INK, lineHeight: 1.55 }}>
                  J&apos;accepte les{" "}
                  <Link
                    href="/conditions-generales"
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: PINE, textDecoration: "underline" }}
                  >
                    conditions générales
                  </Link>{" "}
                  et la{" "}
                  <Link
                    href="/confidentialite"
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: PINE, textDecoration: "underline" }}
                  >
                    politique de confidentialité
                  </Link>
                </span>
              </label>
              <div style={{ minHeight: 24 }}>
                {termsError && <p style={{ ...ERR_STYLE, marginTop: 8 }}>{termsError}</p>}
              </div>
            </div>

            {/* Bouton — toujours actif, validation en JS */}
            <button
              type="submit"
              disabled={loading}
              className="reg-btn"
              style={{
                width: "100%", height: 52,
                background: loading ? "rgba(30,67,49,0.6)" : PINE,
                color: "var(--canvas)", border: "none", borderRadius: 8,
                fontSize: 16, fontWeight: 500,
                cursor: loading ? "default" : "pointer",
                fontFamily: DM, transition: "opacity 0.15s",
              }}
            >
              {loading ? "Création en cours…" : "Créer un compte"}
            </button>
          </form>

          {/* Lien connexion */}
          <p style={{ textAlign: "center", fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginTop: 24 }}>
            Déjà un compte ?{" "}
            <Link href="/login" style={{ color: PINE, fontWeight: 500, textDecoration: "underline" }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
