import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const DEEP = "#2C1A0E";
const CREAM = "#FAF7F2";
const TERRA = "#C47A4A";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";

export default function MarketingFooter() {
  return (
    <>
      <style>{`
        .mkt-footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px 24px;
        }
        @media (min-width: 1024px) {
          .mkt-footer-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 0 48px;
          }
        }
        .mkt-footer-link {
          font-size: 16px;
          font-weight: 300;
          color: rgba(250,247,242,0.7);
          text-decoration: none;
          display: block;
          margin-bottom: 14px;
          transition: color 0.2s;
          font-family: 'DM Sans', 'Plus Jakarta Sans', sans-serif;
        }
        .mkt-footer-link:hover { color: rgba(250,247,242,1); }
        .mkt-footer-col-title {
          font-family: 'DM Sans', 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(232,196,160,0.6);
          margin-bottom: 18px;
          margin-top: 0;
        }
        .mkt-footer-copyright {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 640px) {
          .mkt-footer-copyright { flex-direction: column; align-items: flex-start; }
          .mkt-footer-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
      <footer style={{ background: DEEP, fontFamily: DM, borderTop: "1px solid rgba(250,247,242,0.1)", marginTop: 0 }}>
        <div style={{ padding: "80px 40px 0", maxWidth: 1200, margin: "0 auto" }}>
          {/* Identity */}
          <div style={{ marginBottom: 56 }}>
            <Logo size="md" href="/" />
            <p style={{ fontStyle: "italic", fontSize: 18, color: "rgba(250,247,242,0.7)", marginTop: 10, marginBottom: 0 }}>
              Un Relational Operating System pour vos proches.
            </p>
          </div>

          {/* 4 columns */}
          <div className="mkt-footer-grid">
            <div>
              <p className="mkt-footer-col-title">Produit</p>
              <Link href="/fonctionnement" className="mkt-footer-link">Fonctionnement</Link>
              <Link href="/offre" className="mkt-footer-link">Tarifs</Link>
              <Link href="/concept" className="mkt-footer-link">Le concept</Link>
              <Link href="/login" className="mkt-footer-link">Se connecter</Link>
            </div>

            <div>
              <p className="mkt-footer-col-title">Légal</p>
              <Link href="/mentions-legales" className="mkt-footer-link">Mentions légales</Link>
              <Link href="/conditions-generales" className="mkt-footer-link">Conditions générales</Link>
              <Link href="/confidentialite" className="mkt-footer-link">Confidentialité</Link>
              <Link href="/confidentialite#cookies" className="mkt-footer-link">Politique cookies</Link>
            </div>

            <div>
              <p className="mkt-footer-col-title">Support</p>
              <Link href="/aide" className="mkt-footer-link">Aide</Link>
              <Link href="/contact" className="mkt-footer-link">Contact</Link>
              <a href="mailto:candiceapp.hello@gmail.com" className="mkt-footer-link">candiceapp.hello@gmail.com</a>
            </div>

            <div>
              <p className="mkt-footer-col-title">Marque</p>
              <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(250,247,242,0.35)", lineHeight: 1.75, fontStyle: "italic" }}>
                Suivez Candice — bientôt sur Instagram, LinkedIn et TikTok.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div style={{ borderTop: "1px solid rgba(250,247,242,0.15)", margin: "48px 40px 0", padding: "20px 0 32px", maxWidth: 1200 }}>
          <div className="mkt-footer-copyright" style={{ maxWidth: 1200 }}>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(250,247,242,0.5)", margin: 0 }}>© 2026 Candice. Tous droits réservés.</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(250,247,242,0.5)", margin: 0 }}>Marque déposée INPI · candice.app</p>
          </div>
        </div>
      </footer>
    </>
  );
}
