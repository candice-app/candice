"use client";

// Espace Proche V2 — coquille navigable (Phase 2). 3 onglets ([Prénom]/Nous/
// Faire plaisir) + bottom nav + bouton Accueil (sortie vers l'app). Chrome fidèle
// à Candice_Espace_Proche_COMPLET.html ; contenus = placeholders (phases 3-5).

import { useState } from "react";
import Link from "next/link";
import s from "./espaceProche.module.css";

type Tab = "thibaud" | "nous" | "faireplaisir";

function initial(name: string) { return (name.trim()[0] ?? "?").toUpperCase(); }

function HomeIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5" /></svg>; }
function EditIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>; }
function GearIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>; }
function CamIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>; }
function ChevIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>; }

function Accueil() {
  return (
    <Link href="/dashboard" className={s.ghBack}><HomeIcon />Accueil</Link>
  );
}

export default function EspaceProcheShell({
  procheFirstName, piloteFirstName,
}: { contactId: string; procheFirstName: string; piloteFirstName: string }) {
  const [tab, setTab] = useState<Tab>("thibaud");

  const go = (t: Tab) => { setTab(t); if (typeof window !== "undefined") window.scrollTo(0, 0); };

  return (
    <div className={s.wrap} data-page-ready="proche">
      {/* ── Onglet [Prénom] ── */}
      <div className={`${s.view} ${tab === "thibaud" ? s.on : ""}`}>
        <div className={s.screen}>
          <div className={s.gh}>
            <div className={s.ghBrand}>
              <Accueil />
              <div className={s.ghActs}>
                <button aria-label="Modifier"><EditIcon /></button>
                <button aria-label="Réglages"><GearIcon /></button>
              </div>
            </div>
            <div className={s.ghIn}>
              <div className={s.ghTop}>
                <div className={s.avWrap}>
                  <button className={s.av} aria-label="Changer la photo">{initial(procheFirstName)}</button>
                  <div className={s.avCam}><CamIcon /></div>
                </div>
                <div>
                  <h1>{procheFirstName}</h1>
                  <div className={s.knows}><span className={s.kring} /><p>Candice le connaît <b>bien</b></p></div>
                  <button className={s.knowMore}>Améliorer encore sa connaissance de {procheFirstName} <ChevIcon /></button>
                </div>
              </div>
            </div>
          </div>
          <p className={s.shareLine}>Tu vois ici ce que {procheFirstName} a choisi de partager avec toi.</p>
          <div className={s.ph}>
            <h2>Profil de {procheFirstName}</h2>
            <p>Contenu de l&apos;onglet à venir (épingle, comment il va, langage d&apos;attention, son monde, infos pratiques…).</p>
          </div>
        </div>
      </div>

      {/* ── Onglet Nous ── */}
      <div className={`${s.view} ${tab === "nous" ? s.on : ""}`}>
        <div className={s.screen}>
          <div className={s.gh}>
            <div className={s.ghBrand}>
              <Accueil />
              <div className={s.ghActs}><button aria-label="Réglages"><GearIcon /></button></div>
            </div>
            <div className={s.centerHead}>
              <div className={s.duo}>
                <div className={`${s.duoP} ${s.her}`}><div className={s.a}>{piloteFirstName}</div><span>Toi</span></div>
                <div className={s.duoDot} />
                <div className={`${s.duoP} ${s.him}`}><div className={s.a}>{procheFirstName}</div><span>Lui</span></div>
              </div>
              <h1>Vous deux</h1>
              <p className={s.sub}>Ce que Candice comprend de votre lien — pour t&apos;aider à prendre soin de lui comme il le ressent.</p>
            </div>
          </div>
          <div className={s.ph}>
            <h2>Nous</h2>
            <p>Analyse comparative à venir (jauges superposées, mode d&apos;emploi du duo, ce qui vous lie, angle mort).</p>
          </div>
        </div>
      </div>

      {/* ── Onglet Faire plaisir ── */}
      <div className={`${s.view} ${tab === "faireplaisir" ? s.on : ""}`}>
        <div className={s.screen}>
          <div className={s.gh}>
            <div className={s.ghBrand}>
              <Accueil />
              <div className={s.ghActs}><button aria-label="Réglages"><GearIcon /></button></div>
            </div>
            <div className={s.fpHead}><h1>Faire plaisir à {procheFirstName}</h1></div>
          </div>
          <div className={s.ph}>
            <h2>Faire plaisir</h2>
            <p>Recommandations à venir (filtre par source, recos multi-types + certitude, carnet intégré, attentions écartées).</p>
          </div>
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div className={s.pnav}>
        <button className={tab === "thibaud" ? s.on : ""} onClick={() => go("thibaud")}>
          <span className={s.ib}><svg className={s.icon} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>{procheFirstName}
        </button>
        <button className={tab === "nous" ? s.on : ""} onClick={() => go("nous")}>
          <span className={s.ib}><svg className={s.icon} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M16 3.13a4 4 0 010 7.75M23 21v-2a4 4 0 00-3-3.87" /><circle cx="9" cy="7" r="4" /></svg></span>Nous
        </button>
        <button className={tab === "faireplaisir" ? s.on : ""} onClick={() => go("faireplaisir")}>
          <span className={s.ib}><svg className={s.icon} viewBox="0 0 24 24"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg></span>Faire plaisir
        </button>
      </div>
    </div>
  );
}
