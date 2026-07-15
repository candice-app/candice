"use client";

// Espace Proche V2 — coquille + onglet [Prénom] (Phase 3). Nous/Faire plaisir =
// placeholders (phases 4-5). Sections profil = ProfileV2 embedded (identique pilote).

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import ProfileV2 from "@/components/profile/v2/ProfileV2";
import type { ProfileV2Data } from "@/lib/profile/v2-data";
import s from "./espaceProche.module.css";

type Tab = "thibaud" | "nous" | "faireplaisir";
type Mode = "shared" | "own_knowledge";

function initial(name: string) { return (name.trim()[0] ?? "?").toUpperCase(); }

function HomeIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5" /></svg>; }
function EditIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>; }
function GearIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>; }
function CamIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>; }
function ChevIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>; }
function CalIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>; }
function HeartIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 000-7.8z" /></svg>; }
function MicIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 17v4" /></svg>; }

const ETATS = [
  { v: "fatigue", l: "Fatigué·e" }, { v: "stress", l: "Période de stress" },
  { v: "deuil", l: "Deuil" }, { v: "separation", l: "Séparation" },
  { v: "maladie", l: "Maladie" }, { v: "perte_emploi", l: "Perte d'emploi" },
  { v: "demenagement", l: "Déménagement" }, { v: "belle_nouvelle", l: "Belle nouvelle" },
  { v: "evenement", l: "Événement à venir" }, { v: "conflit", l: "Conflit récent" },
];

function Accueil() { return <Link href="/dashboard" className={s.ghBack}><HomeIcon />Accueil</Link>; }

export default function EspaceProcheShell({
  contactId, pilotId, procheFirstName, procheGender, mode, birthdayWeeks, procheData, hasAnalysis,
}: {
  contactId: string; pilotId: string; procheFirstName: string; piloteFirstName: string;
  procheGender: "feminine" | "masculine" | "neutral";
  mode: Mode; birthdayWeeks: number | null; procheData: ProfileV2Data; hasAnalysis: boolean;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("thibaud");
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsText, setNewsText] = useState("");
  const [newsState, setNewsState] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const go = (t: Tab) => { setTab(t); if (typeof window !== "undefined") window.scrollTo(0, 0); };

  const saveNews = async () => {
    if ((!newsState && !newsText.trim()) || saving) return;
    setSaving(true);
    await supabase.from("person_states").insert({
      subject_kind: "contact", contact_id: contactId, declared_by: pilotId,
      state: newsState ?? "evenement", note_free: newsText.trim() || null,
    });
    setSaving(false);
    setNewsOpen(false); setNewsText(""); setNewsState(null);
  };

  const hasBday = birthdayWeeks != null && birthdayWeeks >= 0 && birthdayWeeks <= 10;

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
                  <div className={s.knows}><span className={s.kring} /><p>Candice commence à {procheGender === "feminine" ? "la" : "le"} connaître</p></div>
                  <button className={s.knowMore}>Améliorer encore sa connaissance de {procheFirstName} <ChevIcon /></button>
                </div>
              </div>
            </div>
          </div>

          {mode === "shared" && (
            <p className={s.shareLine}>Tu vois ici ce que {procheFirstName} a choisi de partager avec toi.</p>
          )}

          {/* Épingle dynamique */}
          <button className={s.pinMix} onClick={() => go("faireplaisir")}>
            <div className={s.l}>
              {hasBday && (
                <span className={s.occ}><CalIcon />Son anniversaire · dans {birthdayWeeks} semaine{birthdayWeeks! > 1 ? "s" : ""}</span>
              )}
              <b>Faire plaisir à {procheFirstName}</b>
              <p>{hasBday ? "C'est le moment de préparer une belle attention." : "Une petite attention lui ferait du bien."}</p>
            </div>
            <span className={s.go}><ChevIcon /></span>
          </button>

          {/* Comment va [Prénom] — compact */}
          <button className={s.newsRow} onClick={() => setNewsOpen(true)}>
            <span className={s.ic}><HeartIcon /></span>
            <span className={s.t}><b>Comment va {procheFirstName} ?</b><small>Une nouvelle, une période, un événement… dis-le à Candice.</small></span>
            <span className={s.chev}><ChevIcon /></span>
          </button>

          {/* Sections de profil — identiques au pilote (ProfileV2 embedded) */}
          <div style={{ marginTop: 8 }}>
            <ProfileV2 data={procheData} view="proche_espace" embedded />
          </div>

          {/* Enrichissement (contact non-utilisateur, §9) */}
          {!hasAnalysis && (
            <div className={s.enrich}>
              <h3>Candice commence à connaître {procheFirstName}</h3>
              <p>Souhaites-tu développer ce que Candice sait de {procheFirstName} ? Plus tu lui en dis, plus ses attentions viseront juste.</p>
              <button className={s.cta}>Enrichir son profil <ChevIcon /></button>
            </div>
          )}
        </div>
      </div>

      {/* ── Onglet Nous (placeholder — Phase 4) ── */}
      <div className={`${s.view} ${tab === "nous" ? s.on : ""}`}>
        <div className={s.screen}>
          <div className={s.gh}>
            <div className={s.ghBrand}><Accueil /><div className={s.ghActs}><button aria-label="Réglages"><GearIcon /></button></div></div>
            <div className={s.centerHead}><h1>Vous deux</h1><p className={s.sub}>Analyse comparative — à venir (Phase 4).</p></div>
          </div>
          <div className={s.ph}><h2>Nous</h2><p>Jauges superposées, mode d&apos;emploi du duo, ce qui vous lie, angle mort.</p></div>
        </div>
      </div>

      {/* ── Onglet Faire plaisir (placeholder — Phase 5) ── */}
      <div className={`${s.view} ${tab === "faireplaisir" ? s.on : ""}`}>
        <div className={s.screen}>
          <div className={s.gh}>
            <div className={s.ghBrand}><Accueil /><div className={s.ghActs}><button aria-label="Réglages"><GearIcon /></button></div></div>
            <div className={s.fpHead}><h1>Faire plaisir à {procheFirstName}</h1></div>
          </div>
          <div className={s.ph}><h2>Faire plaisir</h2><p>Recommandations à venir (Phase 5).</p></div>
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

      {/* ── Sheet « Comment va [Prénom] » ── */}
      <div className={`${s.backdrop} ${newsOpen ? s.on : ""}`} onClick={() => setNewsOpen(false)} />
      <div className={`${s.sheet} ${newsOpen ? s.on : ""}`}>
        <div className={s.grab} />
        <div className={s.shHead}><h3>Des nouvelles de {procheFirstName}</h3><button onClick={() => setNewsOpen(false)}>Fermer</button></div>
        <div className={s.shBody}>
          <div className={s.newsInput}>
            <input value={newsText} onChange={e => setNewsText(e.target.value)} placeholder="Comment se sent-il en ce moment ?" />
            <span className={s.mic}><MicIcon /></span>
          </div>
          <div className={s.evPills}>
            {ETATS.map(e => (
              <button key={e.v} className={`${s.evPill} ${newsState === e.v ? s.on : ""}`} onClick={() => setNewsState(newsState === e.v ? null : e.v)}>{e.l}</button>
            ))}
          </div>
        </div>
        <div className={s.shFoot}>
          <button className={s.saveBtn} disabled={(!newsState && !newsText.trim()) || saving} onClick={saveNews}>
            {saving ? "…" : "Noter pour Candice"}
          </button>
        </div>
      </div>
    </div>
  );
}
