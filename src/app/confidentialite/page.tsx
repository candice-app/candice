import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/layout/MarketingNav";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Candice",
  description: "Comment Candice collecte, utilise et protège vos données personnelles.",
};

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: PLAYFAIR, fontSize: 20, fontWeight: 400, color: CON, marginBottom: 16, letterSpacing: -0.3 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>;
}

function Tag({ label, always }: { label: string; always?: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 10, fontWeight: 500, letterSpacing: 1,
      textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 4,
      background: always ? "rgba(74,124,89,0.10)" : "rgba(196,122,74,0.10)",
      color: always ? "#4A7C59" : TERRA,
      border: `0.5px solid ${always ? "rgba(74,124,89,0.25)" : "rgba(196,122,74,0.28)"}`,
      marginLeft: 8, verticalAlign: "middle",
    }}>
      {label}
    </span>
  );
}

export default function ConfidentialitePage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <MarketingNav />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 16 }}>
            Légal
          </p>
          <h1 style={{ fontFamily: PLAYFAIR, fontSize: 40, fontWeight: 400, color: CON, lineHeight: 1.15, letterSpacing: -1, marginBottom: 16 }}>
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: COND }}>
            Dernière mise à jour : mai 2026 · Responsable du traitement : Candice — candiceapp.hello@gmail.com
          </p>
        </div>

        {/* Intro */}
        <Section title="Notre engagement">
          <P>
            Candice est un copilote relationnel. Nous traitons des données personnelles sensibles — vos préférences, celles de vos proches — et nous prenons cela au sérieux.
          </P>
          <P>
            Vos données ne sont jamais vendues à des tiers. Elles ne servent qu&rsquo;à faire fonctionner Candice et à améliorer votre expérience.
          </P>
        </Section>

        {/* Data collected */}
        <Section title="Données collectées">
          <P>Nous collectons uniquement ce dont Candice a besoin pour fonctionner :</P>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Compte</strong> — prénom, adresse e-mail, mot de passe (haché)</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Profil personnel</strong> — goûts, préférences, dates importantes (remplis volontairement)</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Profils de proches</strong> — informations saisies par vous ou par le proche via lien partagé</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Notes et historique</strong> — textes libres que vous saisissez dans l&rsquo;application</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Données d&rsquo;usage</strong> — pages visitées, actions (uniquement si vous acceptez les analytics)</li>
          </ul>
        </Section>

        {/* Cookies */}
        <Section title="Cookies et traceurs">
          <P>Candice utilise trois catégories de cookies :</P>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {/* Necessary */}
            <div style={{ background: WHITE, border: `1px solid #E8C4A0`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: CON }}>Cookies nécessaires</span>
                <Tag label="Toujours actifs" always />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 8px 6px 0" }}>Nom</th>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 8px" }}>Fournisseur</th>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 0" }}>Durée</th>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 0" }}>Finalité</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["sb-*", "Supabase", "30 jours", "Session d'authentification"],
                    ["sb-auth-token", "Supabase", "30 jours", "Token de connexion sécurisé"],
                  ].map(([name, provider, duration, purpose]) => (
                    <tr key={name} style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                      <td style={{ padding: "8px 8px 8px 0", fontFamily: "monospace", color: TERRA }}>{name}</td>
                      <td style={{ padding: "8px", color: COND }}>{provider}</td>
                      <td style={{ padding: "8px 0", color: COND }}>{duration}</td>
                      <td style={{ padding: "8px 0", color: COND }}>{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Analytics */}
            <div style={{ background: WHITE, border: `1px solid #E8C4A0`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: CON }}>Cookies analytiques</span>
                <Tag label="Si acceptés" />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 8px 6px 0" }}>Nom</th>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 8px" }}>Fournisseur</th>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 0" }}>Durée</th>
                    <th style={{ textAlign: "left", fontWeight: 500, color: CON, padding: "6px 0" }}>Finalité</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["_va", "Vercel Analytics", "Session", "Mesure d'audience anonyme (pas de données personnelles)"],
                  ].map(([name, provider, duration, purpose]) => (
                    <tr key={name} style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                      <td style={{ padding: "8px 8px 8px 0", fontFamily: "monospace", color: TERRA }}>{name}</td>
                      <td style={{ padding: "8px", color: COND }}>{provider}</td>
                      <td style={{ padding: "8px 0", color: COND }}>{duration}</td>
                      <td style={{ padding: "8px 0", color: COND }}>{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 11, color: COND, marginTop: 10, fontStyle: "italic" }}>
                Vercel Analytics ne collecte pas d&rsquo;adresse IP complète ni de données permettant d&rsquo;identifier un individu.
              </p>
            </div>

            {/* Marketing */}
            <div style={{ background: WHITE, border: `1px solid #E8C4A0`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: CON }}>Cookies marketing</span>
                <Tag label="Si acceptés" />
              </div>
              <p style={{ fontSize: 12, color: COND }}>
                Réservés à des usages futurs (ex. Brevo). Aucun cookie marketing actif à ce jour.
              </p>
            </div>
          </div>

          <p style={{ fontSize: 12, color: COND, marginTop: 16 }}>
            Vous pouvez modifier votre choix à tout moment en vidant le localStorage de votre navigateur ou en nous contactant à{" "}
            <a href="mailto:candiceapp.hello@gmail.com" style={{ color: TERRA }}>candiceapp.hello@gmail.com</a>.
          </p>
        </Section>

        {/* Services tiers */}
        <Section title="Services tiers utilisés">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: CON, fontWeight: 400 }}>Supabase</strong> — base de données et authentification.
              Hébergé dans l&rsquo;Union Européenne (Irlande, eu-west-1). Vos données restent en Europe.{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: TERRA }}>Politique Supabase</a>
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: CON, fontWeight: 400 }}>Resend</strong> — envoi d&rsquo;e-mails transactionnels uniquement (bienvenue, invitations, notifications).
              Aucun tracking dans les e-mails envoyés.{" "}
              <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: TERRA }}>Politique Resend</a>
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: CON, fontWeight: 400 }}>Vercel</strong> — hébergement et Edge Network mondial.
              Vercel Analytics est activé uniquement si vous acceptez les cookies analytiques.{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: TERRA }}>Politique Vercel</a>
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: CON, fontWeight: 400 }}>Anthropic Claude API</strong> — génération de suggestions et d&rsquo;analyses.
              Vos données sont transmises de façon chiffrée et ne sont pas utilisées pour entraîner les modèles.
            </li>
          </ul>
        </Section>

        {/* Retention */}
        <Section title="Durée de conservation">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Profil utilisateur et données de proches : conservés jusqu&rsquo;à la suppression du compte</li>
            <li style={{ marginBottom: 8 }}>Logs d&rsquo;e-mails transactionnels (Resend) : 30 jours</li>
            <li style={{ marginBottom: 8 }}>Données d&rsquo;usage anonymes (Vercel Analytics) : 90 jours</li>
            <li style={{ marginBottom: 8 }}>Sessions d&rsquo;authentification (Supabase) : 30 jours</li>
          </ul>
        </Section>

        {/* Rights */}
        <Section title="Vos droits (RGPD)">
          <P>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </P>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Droit d&rsquo;accès</strong> — obtenir une copie de vos données</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Droit de rectification</strong> — corriger des données inexactes</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Droit à l&rsquo;effacement</strong> — supprimer votre compte et toutes vos données</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CON, fontWeight: 400 }}>Droit d&rsquo;opposition</strong> — vous opposer à certains traitements</li>
          </ul>
          <div style={{ background: WHITE, border: `1px solid #E8C4A0`, borderRadius: 10, padding: "18px 20px" }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: CON, marginBottom: 6 }}>Pour exercer vos droits :</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: COND }}>
              Envoyez un e-mail à{" "}
              <a href="mailto:candiceapp.hello@gmail.com" style={{ color: TERRA, fontWeight: 500 }}>
                candiceapp.hello@gmail.com
              </a>{" "}
              en précisant votre demande. Nous répondrons dans un délai de 30 jours.
            </p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 300, color: COND, marginTop: 12 }}>
            Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: TERRA }}>cnil.fr</a>).
          </p>
        </Section>

        {/* No sale */}
        <Section title="Vente de données — zéro">
          <P>
            Candice ne vend jamais vos données à des tiers, ne les loue pas, ne les cède pas à des partenaires commerciaux.
            Vos données vous appartiennent. Elles servent uniquement à faire fonctionner Candice pour vous.
          </P>
        </Section>

        {/* Hosting */}
        <Section title="Hébergement et localisation">
          <P>
            Toutes vos données sont hébergées dans l&rsquo;Union Européenne :
          </P>
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Base de données Supabase : <strong style={{ color: CON, fontWeight: 400 }}>Irlande (eu-west-1)</strong></li>
            <li style={{ marginBottom: 8 }}>Infrastructure Vercel : Edge Network mondial, données au repos en Europe</li>
          </ul>
          <P>
            Aucun transfert de données hors de l&rsquo;UE sans garanties appropriées (clauses contractuelles types).
          </P>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <P>
            Pour toute question relative à cette politique ou à vos données personnelles :<br />
            <a href="mailto:candiceapp.hello@gmail.com" style={{ color: TERRA, fontWeight: 500 }}>
              candiceapp.hello@gmail.com
            </a>
          </P>
        </Section>

        {/* Back link */}
        <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 32 }}>
          <Link href="/" style={{ fontSize: 12, fontWeight: 300, color: COND, textDecoration: "none" }}>
            ← Retour à l&rsquo;accueil
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: BG, padding: "20px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `0.5px solid ${BORDER}`, flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: "rgba(30,18,8,0.2)" }}>Candice ·</span>
        <nav aria-label="Liens légaux" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/confidentialite" style={{ fontSize: 11, fontWeight: 400, color: TERRA, textDecoration: "none" }}>Confidentialité</Link>
          <Link href="/conditions-generales" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Conditions générales</Link>
          <a href="mailto:candiceapp.hello@gmail.com" style={{ fontSize: 11, fontWeight: 300, color: "rgba(30,18,8,0.3)", textDecoration: "none" }}>Contact</a>
        </nav>
      </footer>
    </main>
  );
}
