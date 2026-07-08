"use client";

// F1 + F4 STOP final — inscription durcie :
// labels flottants DANS les champs (zone entière cliquable), validations
// FRANÇAISES côté client (email au blur, mot de passe ≥ 8 appliqué,
// téléphone FR, @identifiant vérifié EN TEMPS RÉEL — couvre aussi le flux
// /rejoindre puisque c'est le même formulaire), erreurs auth toujours en
// français, flux jamais figé : succès → écran DA systématique ; échec
// d'envoi d'email → message + « Renvoyer l'email ».

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Wordmark from "@/components/presence/Wordmark";
import FloatField from "@/components/auth/FloatField";
import { normalizeHandle, handleFormatError } from "@/lib/handle";

const BG = "var(--canvas)";
const WHITE = "var(--white)";
const PINE = "var(--pine)";
const INK = "var(--ink)";
const ERR = "#C44A4A";
const DM = "var(--font-sans)";
const SERIF = "var(--font-serif)";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Téléphone FR : 0X ou +33, 9 chiffres, séparateurs tolérés
const PHONE_FR_RE = /^(?:\+33\s?|0)[1-9](?:[\s.\-]?\d{2}){4}$/;

function isDuplicateError(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("already registered") || m.includes("user already") || m.includes("already been registered");
}

/** F1.1 — plus JAMAIS d'anglais brut : mapping français des erreurs auth. */
function frenchAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Réessaie dans un instant.";
  if (m.includes("invalid email") || m.includes("valid email")) return "Adresse email invalide.";
  if (m.includes("password")) return "Le mot de passe doit contenir au moins 8 caractères.";
  return "Une erreur est survenue. Réessaie dans un instant.";
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token");
  const shareToken = searchParams.get("share_token");
  const sharerFirstName = searchParams.get("de");
  const supabase = createClient();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [globalError, setGlobalError] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [nameError, setNameError] = useState("");
  const [handleError, setHandleError] = useState("");
  const [handleOk, setHandleOk] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [termsHighlight, setTermsHighlight] = useState(false);
  const [loading, setLoading] = useState(false);

  // F1.2 — flux jamais figé : écran de confirmation OU écran d'échec d'envoi
  const [created, setCreated] = useState(false);
  const [emailSendFailed, setEmailSendFailed] = useState(false);
  const [resending, setResending] = useState(false);

  const termsRef = useRef<HTMLDivElement>(null);
  const handleSeq = useRef(0);

  // F4.4 — disponibilité de l'@identifiant EN TEMPS RÉEL (debounce 450 ms)
  const onHandleChange = (v: string) => {
    const lower = v.toLowerCase();
    setHandle(lower);
    setHandleOk(false);
    setHandleError("");
    const normalized = normalizeHandle(lower);
    if (normalized.length < 3) return;
    const fmt = handleFormatError(normalized);
    if (fmt) { setHandleError(fmt); return; }
    const seq = ++handleSeq.current;
    setTimeout(async () => {
      if (seq !== handleSeq.current) return;
      const res = await fetch("/api/handle/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: normalized }),
      }).catch(() => null);
      if (!res?.ok || seq !== handleSeq.current) return;
      const data = await res.json() as { available: boolean; error?: string };
      if (seq !== handleSeq.current) return;
      if (!data.available) setHandleError(data.error ?? "Cet identifiant est déjà pris.");
      else setHandleOk(true);
    }, 450);
  };

  // F4.2 / F4.5 — validations live au blur
  const validateEmail = () => {
    if (email && !EMAIL_RE.test(email)) setEmailError("Adresse email invalide.");
  };
  const validatePhone = () => {
    if (phone.trim() && !PHONE_FR_RE.test(phone.trim()))
      setPhoneError("Numéro français invalide (ex. 06 12 34 56 78).");
  };
  const validatePassword = () => {
    if (password && password.length < 8)
      setPasswordError("8 caractères minimum.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(""); setEmailError(""); setPasswordError(""); setPhoneError("");
    setHandleError(""); setTermsError(""); setGlobalError(""); setIsDuplicate(false);

    let hasError = false;
    if (!name.trim()) { setNameError("Ton prénom est nécessaire."); hasError = true; }
    const normalizedHandle = normalizeHandle(handle);
    const handleFormatMsg = handleFormatError(normalizedHandle);
    if (handleFormatMsg) { setHandleError(handleFormatMsg); hasError = true; }
    if (!email || !EMAIL_RE.test(email)) { setEmailError("Adresse email invalide."); hasError = true; }
    if (password.length < 8) { setPasswordError("8 caractères minimum."); hasError = true; }
    if (phone.trim() && !PHONE_FR_RE.test(phone.trim())) {
      setPhoneError("Numéro français invalide (ex. 06 12 34 56 78)."); hasError = true;
    }
    if (!termsAccepted) {
      setTermsError("Tu dois accepter les conditions générales pour continuer.");
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
      // Vérification indisponible : l'unicité reste garantie en base.
    }

    // P0.1 — le lien de confirmation revient TOUJOURS sur la prod, vers la
    // bonne destination (lien de partage → /rejoindre/[token]).
    const appOrigin = process.env.NODE_ENV === "production"
      ? "https://candice.app"
      : window.location.origin;
    const destination = inviteToken
      ? `/moi/questionnaire?invite_token=${encodeURIComponent(inviteToken)}`
      : shareToken
        ? `/rejoindre/${encodeURIComponent(shareToken)}`
        : "/dashboard";

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, handle: normalizedHandle },
        emailRedirectTo: `${appOrigin}/api/auth/callback?next=${encodeURIComponent(destination)}`,
      },
    });

    if (signUpError) {
      if (isDuplicateError(signUpError.message)) {
        setIsDuplicate(true);
      } else if (/confirmation email|sending email|smtp|email.*send/i.test(signUpError.message)) {
        // F1.1/1.2 — l'envoi a échoué : écran dédié + renvoi, jamais un
        // bandeau anglais ni un formulaire figé.
        setCreated(true);
        setEmailSendFailed(true);
      } else {
        setGlobalError(frenchAuthError(signUpError.message));
      }
      setLoading(false);
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setCreated(true); // écran de confirmation DA systématique
        setLoading(false);
        return;
      }
    }

    await fetch("/api/handle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: normalizedHandle }),
    }).catch(() => {});

    if (phone.trim()) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        supabase.from("my_profile").upsert(
          { user_id: currentUser.id, phone: phone.trim(), updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        ).then(() => {});
      }
    }

    fetch("/api/emails/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: name.trim(), email }),
    }).catch(() => {});

    router.push(destination);
    router.refresh();
  };

  // F1.1 — « Renvoyer l'email »
  const resendEmail = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (!error) setEmailSendFailed(false); // → écran de confirmation standard
  };

  // ── Écrans post-soumission (DA) — jamais de formulaire figé ──────────────
  if (created) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: BG, fontFamily: DM }}>
        <header style={{ padding: "20px 24px", borderBottom: "0.5px solid var(--line)" }}>
          <Wordmark href="/" />
        </header>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <span style={{
              width: 52, height: 52, borderRadius: 16, background: emailSendFailed ? "rgba(196,74,74,.08)" : "#EAF1EC",
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
            }}>
              <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: "none", stroke: emailSendFailed ? ERR : "var(--pine)", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" />
              </svg>
            </span>
            {emailSendFailed ? (
              <>
                <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 27, color: INK, letterSpacing: "-.018em", lineHeight: 1.3, marginBottom: 14 } as React.CSSProperties}>
                  L&apos;email n&apos;a pas pu partir.
                </h1>
                <p style={{ fontSize: 15.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 22 }}>
                  Réessaie dans un instant.
                </p>
                <button
                  onClick={resendEmail}
                  disabled={resending}
                  style={{
                    minHeight: 50, padding: "0 26px", background: PINE, color: "var(--canvas)",
                    border: "none", borderRadius: 8, fontSize: 15, fontWeight: 500,
                    cursor: resending ? "default" : "pointer", opacity: resending ? 0.6 : 1, fontFamily: DM,
                  }}
                >
                  {resending ? "Envoi…" : "Renvoyer l'email"}
                </button>
              </>
            ) : (
              <>
                <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 27, color: INK, letterSpacing: "-.018em", lineHeight: 1.3, marginBottom: 14 } as React.CSSProperties}>
                  Ton compte est créé.
                </h1>
                <p style={{ fontSize: 15.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
                  Va voir ta boîte mail pour confirmer ton adresse
                  {sharerFirstName
                    ? <> — puis tu découvriras ce que {sharerFirstName} a partagé avec toi.</>
                    : "."}
                </p>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, marginTop: 18 }}>
                  Rien reçu ? Regarde tes indésirables — l&apos;email vient de candice.app.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: BG, fontFamily: DM }}>
      <style>{`
        .reg-terms-check {
          width: 24px; height: 24px; border-radius: 5px; flex-shrink: 0; margin-top: 1px;
          border: 1.5px solid var(--champ-line);
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .reg-terms-check.highlight { border-color: #C44A4A; box-shadow: 0 0 0 3px rgba(196,74,74,0.15); }
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

            <FloatField
              label="Prénom" required value={name}
              onChange={v => { setName(v); if (nameError) setNameError(""); }}
              autoComplete="given-name" error={nameError}
            />
            <FloatField
              label="Identifiant" required prefix="@" value={handle}
              onChange={onHandleChange}
              autoComplete="off" error={handleError}
              hint={handleOk ? "Disponible." : "Unique, comme sur Instagram — c'est lui que tes proches saisiront pour te trouver."}
            />
            <FloatField
              label="E-mail" required type="email" value={email}
              onChange={v => { setEmail(v); if (emailError) setEmailError(""); }}
              onBlur={validateEmail}
              autoComplete="email" inputMode="email" error={emailError}
            />
            <FloatField
              label="Téléphone (optionnel)" type="tel" value={phone}
              onChange={v => { setPhone(v); if (phoneError) setPhoneError(""); }}
              onBlur={validatePhone}
              autoComplete="tel" inputMode="tel" error={phoneError}
            />
            <FloatField
              label="Mot de passe" required type="password" value={password}
              onChange={v => { setPassword(v); if (passwordError) setPasswordError(""); }}
              onBlur={validatePassword}
              autoComplete="new-password" error={passwordError}
              hint="8 caractères minimum."
            />

            {/* CGU */}
            <div ref={termsRef} style={{ margin: "8px 0 28px" }}>
              <label htmlFor="terms" style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                <input
                  id="terms" type="checkbox" checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); if (termsError) setTermsError(""); }}
                  style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                />
                <span className={`reg-terms-check${termsHighlight ? " highlight" : ""}`}
                  style={{ background: termsAccepted ? PINE : "transparent" }} aria-hidden="true">
                  {termsAccepted && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#FDFDFB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span style={{ fontSize: 14, fontWeight: 300, color: INK, lineHeight: 1.55 }}>
                  J&apos;accepte les{" "}
                  <Link href="/conditions-generales" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: PINE, textDecoration: "underline" }}>
                    conditions générales
                  </Link>{" "}
                  et la{" "}
                  <Link href="/confidentialite" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: PINE, textDecoration: "underline" }}>
                    politique de confidentialité
                  </Link>
                </span>
              </label>
              <div style={{ minHeight: 24 }}>
                {termsError && <p style={{ fontSize: 13, color: ERR, margin: "8px 0 0", lineHeight: 1.4 }}>{termsError}</p>}
              </div>
            </div>

            <button
              type="submit" disabled={loading} className="reg-btn"
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
