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

interface RecoItem {
  id: string; reco_type: string; title: string; brand: string | null;
  price_indicative: string | null; source_trace: string; certainty_pct: number | null;
  why_json: unknown; need_tag: string | null;
}
interface CarnetItem {
  id: string; description: string; brand_name: string | null;
  heard_quote: string | null; price_indicative: string | null;
}

// Dimensions comparées (onglet Nous) — libellés EXACTS de la maquette / du pilote.
const DUAL_DIMS: { key: string; label: string }[] = [
  { key: "MOT", label: "Mots justes" },
  { key: "CAD_C", label: "Cadeaux choisis" },
  { key: "EXP", label: "Moments partagés" },
  { key: "GES", label: "Esthétique · qualité" },
  { key: "SER", label: "Actes de service" },
  { key: "SUR", label: "Surprise" },
];

export default function EspaceProcheShell({
  contactId, pilotId, procheFirstName, piloteFirstName, procheGender, mode, birthdayWeeks,
  procheData, hasAnalysis, piloteDims, procheDims, recos, carnet, refusedCount,
}: {
  contactId: string; pilotId: string; procheFirstName: string; piloteFirstName: string;
  procheGender: "feminine" | "masculine" | "neutral";
  mode: Mode; birthdayWeeks: number | null; procheData: ProfileV2Data; hasAnalysis: boolean;
  piloteDims: Record<string, number> | null; procheDims: Record<string, number> | null;
  recos: RecoItem[]; carnet: CarnetItem[]; refusedCount: number;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("thibaud");
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsText, setNewsText] = useState("");
  const [newsState, setNewsState] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [srcFilter, setSrcFilter] = useState<"all" | "candice" | "mine">("all");

  const hasComparative = !!(piloteDims && procheDims);
  const recoSource = (r: RecoItem) => (r.source_trace === "spotted" ? "mine" : "candice");
  const shownRecos = recos.filter(r => srcFilter === "all" || recoSource(r) === srcFilter);
  const showCarnet = srcFilter === "all" || srcFilter === "mine";
  const fpEmpty = recos.length === 0 && carnet.length === 0;

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

      {/* ── Onglet Nous (Phase 4) ── */}
      <div className={`${s.view} ${tab === "nous" ? s.on : ""}`}>
        <div className={s.screen}>
          <div className={s.gh}>
            <div className={s.ghBrand}><Accueil /><div className={s.ghActs}><button aria-label="Réglages"><GearIcon /></button></div></div>
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

          {hasComparative ? (
            <>
              <div className={s.divtxt}><span className={s.pt} />Vos langages, comparés</div>
              <div className={s.legend}>
                <span><span className={`${s.dot} ${s.her}`} />Toi</span>
                <span><span className={`${s.dot} ${s.him}`} />{procheFirstName}</span>
              </div>
              <div className={s.dualCard}>
                {DUAL_DIMS.map(d => (
                  <div key={d.key} className={s.dual}>
                    <div className={s.dl}><b>{d.label}</b></div>
                    <div className={s.track}>
                      <div className={s.barH} style={{ width: `${Math.min(100, piloteDims![d.key] ?? 0)}%` }} />
                      <div className={s.barT} style={{ width: `${Math.min(100, procheDims![d.key] ?? 0)}%` }} />
                    </div>
                    <div className={s.lvls}><span>À doser</span><span>Présent</span><span>Dominant</span></div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={s.enrich}>
              <h3>Candice a besoin d&apos;en savoir plus sur {procheFirstName}</h3>
              <p>Dès que {procheFirstName} aura son propre profil (ou que tu l&apos;auras enrichi), Candice comparera vos langages d&apos;attention côte à côte, sur les mêmes dimensions.</p>
              <button className={s.cta}>Enrichir son profil <ChevIcon /></button>
            </div>
          )}
        </div>
      </div>

      {/* ── Onglet Faire plaisir (Phase 5) ── */}
      <div className={`${s.view} ${tab === "faireplaisir" ? s.on : ""}`}>
        <div className={s.screen}>
          <div className={s.gh}>
            <div className={s.ghBrand}><Accueil /><div className={s.ghActs}><button aria-label="Réglages"><GearIcon /></button></div></div>
            <div className={s.fpHead}>
              <h1>Faire plaisir à {procheFirstName}</h1>
              <p>Candice croise tout ce qu&apos;elle sait de lui pour te proposer juste — surtout au quotidien.</p>
            </div>
          </div>

          <div className={s.srcSelect}>
            <label>Afficher</label>
            <div className={s.selWrap}>
              <select value={srcFilter} onChange={e => setSrcFilter(e.target.value as typeof srcFilter)}>
                <option value="all">Toutes les idées</option>
                <option value="candice">Les idées de Candice</option>
                <option value="mine">Ce que j&apos;ai repéré</option>
              </select>
              <svg className={s.icon} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>

          {fpEmpty ? (
            <div className={s.emptyFp}>
              <h3>Candice prépare ses idées pour {procheFirstName}</h3>
              <p>Dès que Candice en saura assez sur lui, elle te proposera ici des attentions justes — surtout de petits gestes du quotidien. Tu peux aussi noter une envie repérée dans son carnet.</p>
            </div>
          ) : (
            <>
              {shownRecos.map(r => (
                <div key={r.id} className={s.reco}>
                  <button className={s.rTop}>
                    <div className={s.rPhoto}><div className={s.ph}><svg className={s.icon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div></div>
                    <div className={s.rBody}>
                      <span className={`${s.srcTag} ${recoSource(r) === "mine" ? s.mine : s.candice}`}>
                        {recoSource(r) === "mine" ? "Repéré par toi" : "Idée de Candice"}
                      </span>
                      {r.brand && <div className={s.brand}>{r.brand}</div>}
                      <div className={s.title}>{r.title}</div>
                      <div className={s.rMeta}>
                        {r.price_indicative && <span className={`${s.m} ${s.price}`}>{r.price_indicative}</span>}
                        {r.certainty_pct != null && <span className={s.cert}>Sûr à {r.certainty_pct}%</span>}
                      </div>
                    </div>
                  </button>
                  <div className={s.rAct}>
                    <button className={s.prim}>Je veux l&apos;offrir</button>
                    <button>Pas ça</button>
                  </div>
                </div>
              ))}

              {showCarnet && carnet.map(it => (
                <div key={it.id} className={s.reco}>
                  <button className={s.rTop}>
                    <div className={s.rPhoto}><div className={s.ph}><svg className={s.icon} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg></div></div>
                    <div className={s.rBody}>
                      <span className={`${s.srcTag} ${s.mine}`}>Repéré par toi</span>
                      {it.brand_name && <div className={s.brand}>{it.brand_name}</div>}
                      <div className={s.title}>{it.description}</div>
                      {it.heard_quote && <div className={s.why}>« {it.heard_quote} »</div>}
                      <div className={s.rMeta}>
                        {it.price_indicative && <span className={`${s.m} ${s.price}`}>{it.price_indicative}</span>}
                        <span className={s.cert}>Sûr — tu l&apos;avais repéré</span>
                      </div>
                    </div>
                  </button>
                  <div className={s.rAct}>
                    <button className={s.prim}>Je veux l&apos;offrir</button>
                    <button>Pas ça</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {refusedCount > 0 && (
            <button className={s.refLink}>
              <svg className={s.icon} viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
              Attentions écartées<span className={s.n}>{refusedCount}</span>
            </button>
          )}
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
