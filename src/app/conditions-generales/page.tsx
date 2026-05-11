import type { Metadata } from "next";
import MarketingNav from "@/components/layout/MarketingNav";
import MarketingFooter from "@/components/layout/MarketingFooter";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales — Candice",
  description: "Conditions générales d'utilisation de Candice.",
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
      <h2 style={{ fontFamily: PLAYFAIR, fontSize: 22, fontWeight: 400, color: CON, marginBottom: 16 }}>{title}</h2>
      <div style={{ fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function ConditionsGeneralesPage() {
  return (
    <main style={{ background: BG, fontFamily: DM, color: CON, minHeight: "100vh" }}>
      <MarketingNav />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: TERRA, marginBottom: 20 }}>
          Conditions générales
        </p>
        <h1 style={{ fontFamily: PLAYFAIR, fontSize: 40, fontWeight: 400, color: CON, lineHeight: 1.15, marginBottom: 12 }}>
          Conditions générales d&apos;utilisation
        </h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: COND, marginBottom: 56 }}>
          Dernière mise à jour : 9 mai 2026 · Société Candice SAS
        </p>

        <Section title="1. Objet">
          <p>
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation du service
            Candice, accessible à l&apos;adresse <strong>candice.app</strong> et via ses applications associées (ci-après « le
            Service »).
          </p>
          <p style={{ marginTop: 12 }}>
            En créant un compte ou en utilisant le Service, vous acceptez sans réserve les présentes CGU. Si vous n&apos;acceptez
            pas ces conditions, vous devez cesser toute utilisation du Service.
          </p>
        </Section>

        <Section title="2. Description du service">
          <p>
            Candice est un assistant relationnel personnel qui aide les utilisateurs à mieux connaître leurs proches, à anticiper
            leurs besoins et à entretenir leurs relations. Le Service comprend notamment :
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>La création et gestion de fiches contacts personnalisées</li>
            <li>Des suggestions personnalisées générées par intelligence artificielle</li>
            <li>Un système de partage de fiches par lien sécurisé</li>
            <li>Un programme de points (« Candice Points »)</li>
            <li>Des rappels et notifications personnalisés</li>
          </ul>
        </Section>

        <Section title="3. Accès et inscription">
          <p>
            L&apos;utilisation du Service requiert la création d&apos;un compte avec une adresse e-mail valide et un mot de passe.
            Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.
          </p>
          <p style={{ marginTop: 12 }}>
            Candice propose deux formules :
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <li><strong>Gratuit</strong> — accès limité à 2 proches, fonctionnalités de base</li>
            <li><strong>Premium</strong> — proches illimités, fonctionnalités avancées, à 9 € / mois après 14 jours d&apos;essai gratuit</li>
          </ul>
        </Section>

        <Section title="4. Abonnement Premium et facturation">
          <p>
            L&apos;abonnement Premium est facturé mensuellement. Le premier prélèvement intervient à l&apos;issue de la période
            d&apos;essai gratuite de 14 jours. Vous pouvez résilier à tout moment depuis votre espace compte — la résiliation
            prend effet à la fin de la période en cours, sans remboursement au prorata.
          </p>
          <p style={{ marginTop: 12 }}>
            Les prix s&apos;entendent TTC. Candice se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.
          </p>
        </Section>

        <Section title="5. Programme de points">
          <p>
            Les « Candice Points » sont des récompenses virtuelles attribuées pour certaines actions (complétion de profil,
            ajout de proches, etc.). Ils sont convertibles en avantages partenaires selon les conditions en vigueur sur
            l&apos;application. Les points n&apos;ont pas de valeur monétaire, ne sont pas remboursables et ne peuvent être
            cédés à des tiers.
          </p>
          <p style={{ marginTop: 12 }}>
            Candice se réserve le droit de modifier, suspendre ou supprimer le programme de points à tout moment.
          </p>
        </Section>

        <Section title="6. Données personnelles et IA">
          <p>
            Candice traite des données personnelles vous concernant ainsi que vos proches dans le cadre du Service. Ces
            traitements sont détaillés dans notre{" "}
            <Link href="/confidentialite" style={{ color: TERRA, textDecoration: "underline" }}>
              Politique de confidentialité
            </Link>.
          </p>
          <p style={{ marginTop: 12 }}>
            Les suggestions générées par intelligence artificielle ont un caractère indicatif. Candice ne garantit pas leur
            pertinence et décline toute responsabilité quant aux décisions prises sur leur base.
          </p>
          <p style={{ marginTop: 12 }}>
            Vous êtes responsable des informations saisies concernant vos proches et garantissez disposer de leur consentement
            pour partager ces données avec Candice.
          </p>
        </Section>

        <Section title="7. Liens de partage">
          <p>
            Candice vous permet de générer des liens sécurisés à partager avec vos proches afin qu&apos;ils complètent leur
            profil. Ces liens ont une durée de validité limitée. Vous êtes responsable de l&apos;utilisation et de la
            diffusion de ces liens.
          </p>
        </Section>

        <Section title="8. Propriété intellectuelle">
          <p>
            Le Service, son interface, ses algorithmes, son design et l&apos;ensemble de ses contenus sont la propriété
            exclusive de Candice SAS et sont protégés par le droit de la propriété intellectuelle. Toute reproduction,
            extraction ou réutilisation, même partielle, sans autorisation écrite préalable est interdite.
          </p>
          <p style={{ marginTop: 12 }}>
            Les données saisies par l&apos;utilisateur restent sa propriété. Vous accordez à Candice une licence limitée,
            non exclusive et révocable pour traiter ces données dans le seul but de fournir le Service.
          </p>
        </Section>

        <Section title="9. Comportements interdits">
          <p>Il est interdit d&apos;utiliser le Service pour :</p>
          <ul style={{ paddingLeft: 20, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>Enregistrer des informations concernant des personnes sans leur consentement</li>
            <li>Collecter ou extraire des données d&apos;autres utilisateurs</li>
            <li>Contourner les mesures de sécurité ou tenter d&apos;accéder à des comptes tiers</li>
            <li>Diffuser des contenus illicites, haineux ou portant atteinte à des tiers</li>
            <li>Usurper l&apos;identité d&apos;une autre personne</li>
          </ul>
        </Section>

        <Section title="10. Suspension et résiliation">
          <p>
            Candice se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, sans
            préavis ni remboursement. Vous pouvez supprimer votre compte à tout moment depuis les paramètres de
            l&apos;application. La suppression entraîne l&apos;effacement de vos données dans les délais prévus par la
            Politique de confidentialité.
          </p>
        </Section>

        <Section title="11. Limitation de responsabilité">
          <p>
            Le Service est fourni « en l&apos;état ». Candice ne saurait être tenu responsable de dommages indirects,
            d&apos;une perte de données ou d&apos;une interruption de service. La responsabilité de Candice est en tout
            état de cause limitée au montant des sommes versées au cours des 12 derniers mois.
          </p>
        </Section>

        <Section title="12. Modifications des CGU">
          <p>
            Candice se réserve le droit de modifier les présentes CGU. En cas de modification substantielle, vous serez
            informé par e-mail au moins 30 jours avant l&apos;entrée en vigueur des nouvelles conditions. La poursuite de
            l&apos;utilisation du Service après ce délai vaut acceptation.
          </p>
        </Section>

        <Section title="13. Droit applicable et litiges">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en
            priorité. À défaut, les tribunaux compétents de Paris seront seuls compétents.
          </p>
          <p style={{ marginTop: 12 }}>
            Conformément au Code de la consommation, vous pouvez recourir à la médiation via la plateforme européenne de
            résolution des litiges en ligne :{" "}
            <span style={{ color: TERRA }}>ec.europa.eu/consumers/odr</span>.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Pour toute question relative aux présentes CGU :{" "}
            <a href="mailto:candiceapp.hello@gmail.com" style={{ color: TERRA, textDecoration: "underline" }}>
              candiceapp.hello@gmail.com
            </a>
          </p>
        </Section>
      </div>

      <MarketingFooter />
    </main>
  );
}
