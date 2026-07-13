"use client";

// Wishlist V2 — reproduction fidèle de Candice_Maquette_Wishlist_V2.html.
// WISHLIST = envies du pilote POUR LUI-MÊME, strictement privée (RLS owner-only).
// Ajout DIRECT (pas d'IA). Aperçu de lien via OpenGraph. Ciblage destinataire.
// « On me l'a offert » → trace d'attention (attention_log) + retrait de la liste.

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import s from "./wishlistV2.module.css";
import {
  OCCASION_LABEL, WISHLIST_FORM_OCCASIONS, WISHLIST_FILTER_OCCASIONS,
  ENVY_LABEL, type Occasion, type EnvyLevel,
} from "@/lib/wishlist/labels";

export interface WishlistItemV2 {
  id: string;
  title: string;
  brand: string | null;
  web_link: string | null;
  size_ref: string | null;
  price_indicative: string | null;
  occasion: Occasion | null;
  note_text: string | null;
  envy_level: EnvyLevel | null;
  target_recipients: string[];
  photo_url: string | null;
  photoSignedUrl: string | null;
  created_at: string;
}
export interface ContactLite { id: string; name: string }

const ICON = {
  chevron: "M9 6l6 6-6 6",
  lock: null, // dessiné inline
  plus: "M12 5v14M5 12h14",
  edit: null,
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7",
  user: null,
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
};

function Svg({ d, cls }: { d: string; cls?: string }) {
  return <svg className={`${s.icon} ${cls ?? ""}`} viewBox="0 0 24 24"><path d={d} /></svg>;
}
function EditIcon() {
  return <svg className={s.icon} viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>;
}
function GiftIcon() {
  return <svg className={s.icon} viewBox="0 0 24 24"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>;
}
function initial(name: string) { return (name.trim()[0] ?? "?").toUpperCase(); }

const EMPTY_DRAFT = {
  title: "", brand: "", web_link: "", size_ref: "", price_indicative: "",
  envy_level: "dream" as EnvyLevel, occasion: null as Occasion | null,
  targets: [] as string[], photo_path: null as string | null, photo_preview: null as string | null,
};
type Draft = typeof EMPTY_DRAFT;

export default function WishlistV2Client({
  initialItems, contacts,
}: { userId: string; initialItems: WishlistItemV2[]; contacts: ContactLite[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<WishlistItemV2[]>(initialItems);
  const [filter, setFilter] = useState<Occasion | "all">("all");
  const [sheet, setSheet] = useState<"form" | "offered" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [offeredItem, setOfferedItem] = useState<WishlistItemV2 | null>(null);
  const [offeredContact, setOfferedContact] = useState<string | null>(null);

  const shown = items.filter(it =>
    filter === "all" ? true : (it.occasion ?? "none") === filter,
  );

  const openNew = () => { setEditId(null); setDraft(EMPTY_DRAFT); setSheet("form"); };
  const openEdit = (it: WishlistItemV2) => {
    setEditId(it.id);
    setDraft({
      title: it.title, brand: it.brand ?? "", web_link: it.web_link ?? "",
      size_ref: it.size_ref ?? "", price_indicative: it.price_indicative ?? "",
      envy_level: it.envy_level ?? "dream", occasion: it.occasion,
      targets: it.target_recipients ?? [],
      photo_path: it.photo_url, photo_preview: it.photoSignedUrl,
    });
    setSheet("form");
  };
  const close = () => { setSheet(null); setOfferedItem(null); setOfferedContact(null); };

  const onPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("scope", "wishlist");
      const r = await fetch("/api/wishlist/photo", { method: "POST", body: fd });
      const d = await r.json() as { path?: string; signedUrl?: string };
      if (d.path) setDraft(dr => ({ ...dr, photo_path: d.path!, photo_preview: d.signedUrl ?? null }));
    } finally { setUploading(false); }
  };

  const save = async () => {
    const title = draft.title.trim();
    if (!title || busy) return;
    setBusy(true);
    // Aperçu de lien : pas de photo mais un lien → tenter l'image OpenGraph.
    let photo = draft.photo_path;
    if (!photo && draft.web_link.trim()) {
      try {
        const r = await fetch("/api/wishlist/og", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: draft.web_link.trim() }),
        });
        const d = await r.json() as { image?: string | null };
        if (d.image) photo = d.image;
      } catch { /* best-effort */ }
    }
    const patch = {
      title,
      brand: draft.brand.trim() || null,
      web_link: draft.web_link.trim() || null,
      size_ref: draft.size_ref.trim() || null,
      price_indicative: draft.price_indicative.trim() || null,
      occasion: draft.occasion,
      envy_level: draft.envy_level,
      target_recipients: draft.targets,
      photo_url: photo,
      source_trace: "declared" as const,
    };
    if (editId) {
      const { error } = await supabase.from("my_wishlist_items").update(patch).eq("id", editId);
      if (!error) setItems(prev => prev.map(it => it.id === editId
        ? { ...it, ...patch, photoSignedUrl: draft.photo_preview ?? (photo?.startsWith("http") ? photo : it.photoSignedUrl) }
        : it));
    } else {
      const { data, error } = await supabase.from("my_wishlist_items")
        .insert(patch).select("id, created_at").single();
      if (!error && data) {
        setItems(prev => [{
          ...patch, id: data.id as string, note_text: null, created_at: data.created_at as string,
          photoSignedUrl: draft.photo_preview ?? (photo?.startsWith("http") ? photo : null),
        }, ...prev]);
      }
    }
    setBusy(false);
    close();
  };

  const openOffered = (it: WishlistItemV2) => {
    setOfferedItem(it);
    setOfferedContact(contacts[0]?.id ?? null);
    setSheet("offered");
  };
  const confirmOffered = async () => {
    if (!offeredItem || busy) return;
    setBusy(true);
    // Trace d'attention accomplie (attention_log) si un proche est identifié.
    if (offeredContact) {
      await fetch("/api/wishlist/offered", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: offeredContact, title: offeredItem.title }),
      }).catch(() => {});
    }
    // L'objet reçu quitte la wishlist.
    await supabase.from("my_wishlist_items").delete().eq("id", offeredItem.id);
    setItems(prev => prev.filter(it => it.id !== offeredItem.id));
    setBusy(false);
    close();
  };

  const destLabel = (it: WishlistItemV2) => {
    if (!it.target_recipients?.length) return "n'importe qui";
    const names = it.target_recipients
      .map(id => contacts.find(c => c.id === id)?.name).filter(Boolean) as string[];
    return names.length ? names.join(", ") : "n'importe qui";
  };

  const toggleTarget = (id: string) =>
    setDraft(d => ({ ...d, targets: d.targets.includes(id) ? d.targets.filter(x => x !== id) : [...d.targets, id] }));

  return (
    <div className={s.screen}>
      {/* HEADER */}
      <div className={s.gh}>
        <div className={s.ghBrand}>
          <div className={s.brand}><span className={s.o} />Candice</div>
          <Link href="/moi" className={s.ghBack}>Profil <Svg d={ICON.chevron} /></Link>
        </div>
        <div className={s.ghIn}>
          <h1>Ma wishlist</h1>
          <p>Ce que <b style={{ color: "#F3E9CE", fontWeight: 600 }}>toi</b> tu aimerais recevoir. Candice s&apos;en inspire pour guider tes proches — sans jamais leur dire que tu l&apos;as demandé.</p>
          <span className={s.privateBadge}>
            <svg className={s.icon} viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
            Privé — traduit en suggestions, jamais montré tel quel
          </span>
        </div>
      </div>

      {/* ADD */}
      <div className={s.addWrap}>
        <button className={s.addBtn} onClick={openNew}><Svg d={ICON.plus} />Ajouter une envie</button>
      </div>

      {/* FILTRES */}
      <div className={s.filters}>
        <button className={`${s.chip} ${filter === "all" ? s.on : ""}`} onClick={() => setFilter("all")}>Toutes</button>
        {WISHLIST_FILTER_OCCASIONS.map(o => (
          <button key={o} className={`${s.chip} ${filter === o ? s.on : ""}`} onClick={() => setFilter(o)}>{OCCASION_LABEL[o]}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className={s.empty}>
          <div className={s.ic}><svg className={s.icon} viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></svg></div>
          <h3>Ta wishlist est vide</h3>
          <p>Dépose ici tes envies — tes proches pourront viser juste, sans jamais te demander.</p>
        </div>
      ) : (
        <>
          <div className={s.sectTitle}><span className={s.pt} />{shown.length} envie{shown.length > 1 ? "s" : ""}</div>
          {shown.map(it => (
            <div key={it.id} className={s.item}>
              <div className={s.photo} style={!it.photoSignedUrl ? { background: "#E8E2D4" } : undefined}>
                {it.envy_level && (
                  <span className={`${s.envieTag} ${it.envy_level === "dream" ? s.reve : s.plaisir}`}>
                    {ENVY_LABEL[it.envy_level]}
                  </span>
                )}
                {it.photoSignedUrl
                  ? <img src={it.photoSignedUrl} alt="" />
                  : <div className={s.ph}><Svg d={ICON.book} /></div>}
              </div>
              <div className={s.body}>
                {it.brand && <div className={s.brandLine}>{it.brand}</div>}
                <div className={s.title}>{it.title}</div>
                <div className={s.meta}>
                  {it.size_ref && <span className={s.m}>{it.size_ref}</span>}
                  {it.price_indicative && <span className={`${s.m} ${s.price}`}>{it.price_indicative}</span>}
                  <span className={`${s.m} ${s.dest}`}>Pour : {destLabel(it)}</span>
                </div>
                <div className={s.actions}>
                  <button onClick={() => openEdit(it)}><EditIcon />Modifier</button>
                  <button className={s.offered} onClick={() => openOffered(it)}><GiftIcon />On me l&apos;a offert</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* BACKDROP + SHEETS */}
      <div className={`${s.backdrop} ${sheet ? s.on : ""}`} onClick={close} />

      {/* FORM */}
      <div className={`${s.sheet} ${sheet === "form" ? s.on : ""}`}>
        <div className={s.grab} />
        <div className={s.shHead}><h3>{editId ? "Modifier l'envie" : "Nouvelle envie"}</h3><button onClick={close}>Fermer</button></div>
        <div className={s.shBody}>
          <div className={s.hintPudeur}><p><b>Rassure-toi :</b> personne ne verra cette liste. Candice s&apos;en sert seulement pour souffler la bonne idée au bon proche, au bon moment.</p></div>

          <div className={s.fld}>
            <label>Photo <span className={s.opt}>— optionnel</span></label>
            {draft.photo_preview ? (
              <div className={s.photoPreview}>
                <img src={draft.photo_preview} alt="" />
                <button className={s.rm} onClick={() => setDraft(d => ({ ...d, photo_path: null, photo_preview: null }))}>Retirer</button>
              </div>
            ) : (
              <label className={s.photoUp}>
                <svg className={s.icon} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                <p>{uploading ? "Envoi…" : "Ajouter une photo"}</p>
                <p style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>Sinon, Candice utilisera l&apos;image du lien web ci-dessous.</p>
                <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f); }} />
              </label>
            )}
          </div>

          <div className={s.fld}><label>Ce que c&apos;est</label><input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="ex. Bague Love or rose" /></div>
          <div className={s.fld}><label>Marque <span className={s.opt}>— optionnel</span></label><input value={draft.brand} onChange={e => setDraft(d => ({ ...d, brand: e.target.value }))} placeholder="ex. Cartier" /></div>
          <div className={s.fld}><label>Lien web <span className={s.opt}>— optionnel, pour retrouver l&apos;objet exact</span></label><input type="url" value={draft.web_link} onChange={e => setDraft(d => ({ ...d, web_link: e.target.value }))} placeholder="https://..." /></div>
          <div className={s.fld}><label>Taille ou référence <span className={s.opt}>— optionnel</span></label><input value={draft.size_ref} onChange={e => setDraft(d => ({ ...d, size_ref: e.target.value }))} placeholder="ex. taille 52, ou l'ISBN d'un livre" /></div>
          <div className={s.fld}><label>Prix indicatif <span className={s.opt}>— optionnel</span></label><input value={draft.price_indicative} onChange={e => setDraft(d => ({ ...d, price_indicative: e.target.value }))} placeholder="ex. 1 900 €" /></div>

          <div className={s.fld}>
            <label>Niveau d&apos;envie</label>
            <div className={s.pillRow}>
              {(["dream", "pleasure"] as EnvyLevel[]).map(l => (
                <button key={l} className={`${s.pill} ${draft.envy_level === l ? s.on : ""}`} onClick={() => setDraft(d => ({ ...d, envy_level: l }))}>{ENVY_LABEL[l]}</button>
              ))}
            </div>
          </div>

          <div className={s.fld}>
            <label>Pour quelle occasion ?</label>
            <div className={s.pillRow}>
              {WISHLIST_FORM_OCCASIONS.map(o => (
                <button key={o} className={`${s.pill} ${draft.occasion === o ? s.on : ""}`} onClick={() => setDraft(d => ({ ...d, occasion: d.occasion === o ? null : o }))}>{OCCASION_LABEL[o]}</button>
              ))}
            </div>
          </div>

          <div className={s.fld}>
            <label>De qui aimerais-tu la recevoir ?</label>
            <div className={s.pillRow}>
              {contacts.map(c => (
                <button key={c.id} className={`${s.pill} ${draft.targets.includes(c.id) ? s.on : ""}`} onClick={() => toggleTarget(c.id)}>{c.name}</button>
              ))}
              <button className={`${s.pill} ${draft.targets.length === 0 ? s.on : ""}`} onClick={() => setDraft(d => ({ ...d, targets: [] }))}>N&apos;importe qui</button>
            </div>
            <p className={s.hintDest}>Cette envie n&apos;apparaîtra que chez les proches choisis. Une bague ne sera jamais suggérée à ta grand-mère si tu la réserves à ton mari.</p>
          </div>

          <button className={s.saveBtn} disabled={!draft.title.trim() || busy || uploading} onClick={save}>
            {editId ? "Enregistrer" : "Ajouter à ma wishlist"}
          </button>
        </div>
      </div>

      {/* ON ME L'A OFFERT */}
      <div className={`${s.sheet} ${sheet === "offered" ? s.on : ""}`}>
        <div className={s.grab} />
        <div className={s.shHead}><h3>On te l&apos;a offert ?</h3><button onClick={close}>Fermer</button></div>
        <div className={`${s.shBody} ${s.offBody}`}>
          <p>Génial. <b>Qui te l&apos;a offert ?</b> Candice pourra retenir cette belle attention.</p>
          <div className={s.prox}>
            {contacts.map(c => (
              <button key={c.id} className={`${s.proxC} ${offeredContact === c.id ? s.on : ""}`} onClick={() => setOfferedContact(c.id)}>
                <div className={s.av}>{initial(c.name)}</div><span>{c.name}</span>
              </button>
            ))}
            <button className={`${s.proxC} ${offeredContact === null ? s.on : ""}`} onClick={() => setOfferedContact(null)}>
              <div className={s.av} style={{ fontSize: 15 }}>+</div><span>Autre</span>
            </button>
          </div>
          {offeredContact && (
            <p style={{ fontSize: 12.5, color: "var(--ink3)" }}>
              En le notant, Candice retiendra que <b>{contacts.find(c => c.id === offeredContact)?.name}</b> a visé juste — et pourra te demander si ça t&apos;a plu, pour l&apos;aider à mieux te connaître encore.
            </p>
          )}
          <button className={s.saveBtn} disabled={busy} onClick={confirmOffered}>
            {offeredContact ? `C'est ${contacts.find(c => c.id === offeredContact)?.name} →` : "Noter comme offert →"}
          </button>
        </div>
      </div>
    </div>
  );
}
