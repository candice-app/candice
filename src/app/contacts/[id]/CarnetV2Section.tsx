"use client";

// Carnet d'envies V2 — reproduction fidèle du CONTENU de
// Candice_Maquette_Carnet_Envies_V2.html. CARNET = envies REPÉRÉES pour un
// proche (privé côté pilote). Backing : carnet_envies_items (fusion faite).
// Deux modes d'ajout : (1) photo → identification IA « à vérifier » ; (2) manuel.

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import s from "./carnetV2.module.css";
import {
  OCCASION_LABEL, CARNET_FORM_OCCASIONS, SOURCE_LABEL,
  type Occasion, type CarnetSource,
} from "@/lib/wishlist/labels";

export interface CarnetItemV2 {
  id: string;
  description: string;
  brand_name: string | null;
  source_link: string | null;
  heard_quote: string | null;
  price_indicative: string | null;
  occasion: Occasion | null;
  source: CarnetSource | null;
  photo_url: string | null;
  photoSignedUrl: string | null;
  statut: string | null;
  created_at: string;
}

function EditIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>; }
function DoneIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>; }
function CamIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>; }
function MicIcon() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>; }
function PhImg() { return <svg className={s.icon} viewBox="0 0 24 24"><path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>; }

const EMPTY = {
  description: "", brand_name: "", source_link: "", heard_quote: "", price_indicative: "",
  occasion: null as Occasion | null, viaPhoto: false,
  photo_path: null as string | null, photo_preview: null as string | null,
};
type Draft = typeof EMPTY;

export default function CarnetV2Section({
  contactId, contactFirstName, initialItems,
}: { contactId: string; contactFirstName: string; initialItems: CarnetItemV2[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<CarnetItemV2[]>(initialItems.filter(i => (i.statut ?? "actif") === "actif"));
  const [sheet, setSheet] = useState<"mode" | "ai" | "form" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ai, setAi] = useState<{ brand: string | null; product: string | null } | null>(null);
  const [identifying, setIdentifying] = useState(false);

  const close = () => { setSheet(null); setAi(null); };
  const openMode = () => { setEditId(null); setDraft(EMPTY); setAi(null); setSheet("mode"); };
  const openEdit = (it: CarnetItemV2) => {
    setEditId(it.id);
    setDraft({
      description: it.description, brand_name: it.brand_name ?? "", source_link: it.source_link ?? "",
      heard_quote: it.heard_quote ?? "", price_indicative: it.price_indicative ?? "",
      occasion: it.occasion, viaPhoto: it.source === "seen",
      photo_path: it.photo_url, photo_preview: it.photoSignedUrl,
    });
    setSheet("form");
  };

  const uploadPhoto = async (file: File): Promise<{ path: string; url: string | null } | null> => {
    const fd = new FormData();
    fd.append("file", file); fd.append("scope", "carnet"); fd.append("contactId", contactId);
    const r = await fetch("/api/wishlist/photo", { method: "POST", body: fd });
    const d = await r.json() as { path?: string; signedUrl?: string };
    return d.path ? { path: d.path, url: d.signedUrl ?? null } : null;
  };

  // Mode IA : upload + identification.
  const onAiPhoto = async (file: File) => {
    setUploading(true); setAi(null);
    try {
      const up = await uploadPhoto(file);
      if (!up) return;
      setDraft(d => ({ ...d, viaPhoto: true, photo_path: up.path, photo_preview: up.url }));
      setIdentifying(true);
      const r = await fetch("/api/carnet/identify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: up.path }),
      });
      const d = await r.json() as { brand: string | null; product: string | null };
      setAi(d);
      setIdentifying(false);
    } finally { setUploading(false); }
  };

  const continueFromAi = () => {
    setDraft(d => ({
      ...d,
      description: ai?.product ?? d.description,
      brand_name: ai?.brand ?? d.brand_name,
    }));
    setSheet("form");
  };

  // Mode manuel : upload photo directe (optionnel).
  const onFormPhoto = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadPhoto(file);
      if (up) setDraft(d => ({ ...d, photo_path: up.path, photo_preview: up.url }));
    } finally { setUploading(false); }
  };

  const computedSource = (d: Draft): CarnetSource | null =>
    d.viaPhoto || d.photo_path ? "seen" : d.heard_quote.trim() ? "heard" : d.source_link.trim() ? "link" : null;

  const save = async () => {
    const description = draft.description.trim();
    if (!description || busy) return;
    setBusy(true);
    const patch = {
      description,
      brand_name: draft.brand_name.trim() || null,
      source_link: draft.source_link.trim() || null,
      heard_quote: draft.heard_quote.trim() || null,
      price_indicative: draft.price_indicative.trim() || null,
      occasion: draft.occasion,
      source: computedSource(draft),
      photo_url: draft.photo_path,
      source_trace: "spotted" as const,
    };
    if (editId) {
      const { error } = await supabase.from("carnet_envies_items").update(patch).eq("id", editId);
      if (!error) setItems(prev => prev.map(it => it.id === editId
        ? { ...it, ...patch, photoSignedUrl: draft.photo_preview ?? it.photoSignedUrl } : it));
    } else {
      const { data, error } = await supabase.from("carnet_envies_items")
        .insert({ ...patch, contact_id: contactId, pilot_id: (await supabase.auth.getUser()).data.user?.id, statut: "actif" })
        .select("id, created_at").single();
      if (!error && data) setItems(prev => [{
        ...patch, id: data.id as string, statut: "actif", created_at: data.created_at as string,
        photoSignedUrl: draft.photo_preview ?? null,
      }, ...prev]);
    }
    setBusy(false);
    close();
  };

  const markOffered = async (it: CarnetItemV2) => {
    if (busy) return;
    setBusy(true);
    await supabase.from("carnet_envies_items").update({ statut: "offert" }).eq("id", it.id);
    setItems(prev => prev.filter(x => x.id !== it.id));
    setBusy(false);
  };

  return (
    <div className={s.carnet}>
      <div className={s.intro}>
        <h2>Carnet d&apos;envies de {contactFirstName}</h2>
        <p>Photo, lien, phrase entendue, boutique : note ici tout ce que tu repères pour {contactFirstName}. Candice le garde pour le bon moment.</p>
      </div>

      <div className={s.addWrap}>
        <button className={s.addBtn} onClick={openMode}>
          <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Ajouter une envie
        </button>
      </div>

      {items.length === 0 ? (
        <div className={s.empty}>
          <div className={s.ic}><PhImg /></div>
          <h3>Rien noté pour l&apos;instant</h3>
          <p>Tu n&apos;as encore rien noté pour {contactFirstName}. Ajoute une envie repérée, même floue : Candice pourra la retrouver, la sourcer ou s&apos;en inspirer plus tard.</p>
        </div>
      ) : (
        <>
          <div className={s.sectTitle}><span className={s.pt} />{items.length} envie{items.length > 1 ? "s" : ""} repérée{items.length > 1 ? "s" : ""}</div>
          {items.map(it => (
            <div key={it.id} className={s.item}>
              <div className={s.photo} style={!it.photoSignedUrl && it.source === "seen" ? { background: "#D8CFC0" } : undefined}>
                {it.source === "seen" && <span className={`${s.srcTag} ${s.seen}`}><CamIcon />{SOURCE_LABEL.seen}</span>}
                {it.source === "heard" && <span className={`${s.srcTag} ${s.heard}`}><MicIcon />{SOURCE_LABEL.heard}</span>}
                {/* source null (ex. ligne W2) : état neutre, pas de badge */}
                {it.photoSignedUrl ? <img src={it.photoSignedUrl} alt="" /> : <div className={s.ph}><PhImg /></div>}
              </div>
              <div className={s.body}>
                {it.brand_name && <div className={s.brandLine}>{it.brand_name}</div>}
                <div className={s.title}>{it.description}</div>
                {it.heard_quote && <div className={s.quote}>« {it.heard_quote} »</div>}
                <div className={s.meta}>
                  {it.price_indicative && <span className={`${s.m} ${s.price}`}>{it.price_indicative}</span>}
                  {it.occasion && <span className={`${s.m} ${s.occ}`}>{OCCASION_LABEL[it.occasion]}</span>}
                </div>
                <div className={s.actions}>
                  <button onClick={() => openEdit(it)}><EditIcon />Modifier</button>
                  <button className={s.done} onClick={() => markOffered(it)}><DoneIcon />Offert</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* SHEETS */}
      <div className={`${s.backdrop} ${sheet ? s.on : ""}`} onClick={close} />

      {/* MODE */}
      <div className={`${s.sheet} ${sheet === "mode" ? s.on : ""}`}>
        <div className={s.grab} />
        <div className={s.shHead}><h3>Repérer une envie</h3><button onClick={close}>Fermer</button></div>
        <div className={s.shBody}>
          <label className={`${s.modeCard} ${s.ai}`}>
            <div className={s.mic}><CamIcon /></div>
            <div className={s.mt}><b>Prendre en photo</b><p>Tu es devant l&apos;objet, en vitrine ou en boutique. Candice tente de retrouver la marque et le produit.</p><span className={s.tip}>Idéal sur le vif — un cadeau vu au passage.</span></div>
            <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { setSheet("ai"); onAiPhoto(f); } }} />
          </label>
          <button className={`${s.modeCard} ${s.self}`} onClick={() => { setDraft(EMPTY); setSheet("form"); }}>
            <div className={s.mic}><EditIcon /></div>
            <div className={s.mt}><b>Renseigner moi-même</b><p>Une phrase entendue, un lien, une boutique, une idée — tu notes ce que tu sais.</p></div>
          </button>
        </div>
      </div>

      {/* AI */}
      <div className={`${s.sheet} ${sheet === "ai" ? s.on : ""}`}>
        <div className={s.grab} />
        <div className={s.shHead}><h3>Photo de l&apos;objet</h3><button onClick={close}>Fermer</button></div>
        <div className={s.shBody}>
          {draft.photo_preview && (
            <div className={s.photoPreview}><img src={draft.photo_preview} alt="" /></div>
          )}
          {!draft.photo_preview && (
            <label className={s.photoUp}>
              <CamIcon /><p>{uploading ? "Envoi…" : "Prendre ou choisir une photo"}</p>
              <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onAiPhoto(f); }} />
            </label>
          )}
          {(identifying || ai) && (
            <div className={s.aiResult}>
              {draft.photo_preview ? <img className={s.th} src={draft.photo_preview} alt="" /> : <div className={s.th} />}
              <div className={s.txt}>
                <b>{identifying ? "Candice regarde…" : (ai?.brand || ai?.product ? [ai?.brand, ai?.product].filter(Boolean).join(" ") : "Produit non reconnu")}</b>
                <p>Candice pense avoir reconnu ce produit — vérifie avant d&apos;enregistrer.</p>
              </div>
            </div>
          )}
          <button className={s.saveBtn} disabled={uploading} onClick={continueFromAi}>Continuer avec ce produit →</button>
          <button className={s.ghost} onClick={() => setSheet("form")}>Ce n&apos;est pas ça — je renseigne moi-même</button>
        </div>
      </div>

      {/* FORM */}
      <div className={`${s.sheet} ${sheet === "form" ? s.on : ""}`}>
        <div className={s.grab} />
        <div className={s.shHead}><h3>{editId ? "Modifier l'envie" : `Envie pour ${contactFirstName}`}</h3><button onClick={close}>Fermer</button></div>
        <div className={s.shBody}>
          {draft.photo_preview && <div className={s.photoPreview}><img src={draft.photo_preview} alt="" /></div>}
          {!draft.photo_preview && (
            <div className={s.fld}>
              <label>Photo <span className={s.opt}>— optionnel</span></label>
              <label className={s.photoUp}>
                <CamIcon /><p>{uploading ? "Envoi…" : "Ajouter une photo"}</p>
                <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onFormPhoto(f); }} />
              </label>
            </div>
          )}
          <div className={s.fld}><label>Ce que c&apos;est</label><input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="ex. Montre BR 03" /></div>
          <div className={s.fld}><label>Marque <span className={s.opt}>— optionnel</span></label><input value={draft.brand_name} onChange={e => setDraft(d => ({ ...d, brand_name: e.target.value }))} placeholder="ex. Bell & Ross" /></div>
          <div className={s.fld}><label>Où / le lien <span className={s.opt}>— optionnel</span></label><input value={draft.source_link} onChange={e => setDraft(d => ({ ...d, source_link: e.target.value }))} placeholder="Boutique, ou https://..." /></div>
          <div className={s.fld}><label>Ce que tu as repéré <span className={s.opt}>— une phrase, un contexte</span></label><textarea value={draft.heard_quote} onChange={e => setDraft(d => ({ ...d, heard_quote: e.target.value }))} placeholder="Il s'est arrêté devant la vitrine…" /></div>
          <div className={s.fld}><label>Prix indicatif <span className={s.opt}>— optionnel</span></label><input value={draft.price_indicative} onChange={e => setDraft(d => ({ ...d, price_indicative: e.target.value }))} placeholder="ex. 3 900 €" /></div>
          <div className={s.fld}>
            <label>Pour quelle occasion ?</label>
            <div className={s.pillRow}>
              {CARNET_FORM_OCCASIONS.map(o => (
                <button key={o} className={`${s.pill} ${draft.occasion === o ? s.on : ""}`} onClick={() => setDraft(d => ({ ...d, occasion: d.occasion === o ? null : o }))}>{OCCASION_LABEL[o]}</button>
              ))}
            </div>
          </div>
          <button className={s.saveBtn} disabled={!draft.description.trim() || busy || uploading} onClick={save}>
            {editId ? "Enregistrer" : `Ajouter au carnet de ${contactFirstName}`}
          </button>
        </div>
      </div>
    </div>
  );
}
