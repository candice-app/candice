"use client";

// Refonte Profil V2 — HEADER APLAT PLEINE LARGEUR (maquette gelée, module 1).
// Brand Candice italique + orb CHAMPAGNE dans le vert · avatar 76px photo
// éditable, UN SEUL badge (caméra) · anneau de complétion champagne SANS
// chiffre · phrase à 4 états · CTA texte champagne « Améliorer encore sa
// connaissance → » · « Partager mon profil » (blanc) + « Ma wishlist » (stub).

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { T2, Icon } from "./ui";
import { KNOW_PHRASES, type KnowState } from "@/lib/profile/v2-data";

export default function HeaderV2({
  firstName,
  avatarUrl,
  knowState,
  knowRatio,
}: {
  firstName: string;
  avatarUrl: string | null;
  knowState: KnowState;
  knowRatio: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const photo = localUrl ?? avatarUrl;
  const phrase = KNOW_PHRASES[knowState];
  const ringDeg = Math.round(360 * Math.min(1, Math.max(0.04, knowRatio)));

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Recadrage carré simple côté client (centre, 512px)
    const cropped = await cropSquare(file).catch(() => file);
    const fd = new FormData();
    fd.append("file", cropped);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd }).catch(() => null);
    setUploading(false);
    if (res?.ok) {
      const data = await res.json() as { signedUrl: string };
      setLocalUrl(data.signedUrl);
      router.refresh();
    }
  };

  return (
    <div style={{
      background: T2.aplat, color: "#fff", position: "relative", overflow: "hidden",
      borderRadius: "0 0 30px 30px", boxShadow: "0 18px 40px rgba(23,62,49,.24)",
    }}>
      {/* Halos radiaux maquette */}
      <div style={{ position: "absolute", left: -60, bottom: -90, width: 230, height: 230, borderRadius: "50%", background: "radial-gradient(circle,rgba(62,115,97,.35),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: -30, top: -56, width: 230, height: 230, borderRadius: "50%", background: "radial-gradient(circle,rgba(205,185,135,.38),transparent 70%)", pointerEvents: "none" }} />

      {/* Brand + actions */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(16px + env(safe-area-inset-top)) 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 19, letterSpacing: 0.2 }}>
          <span style={{ width: 17, height: 17, borderRadius: "50%", background: "radial-gradient(circle at 42% 34%,#F4E7C4,#CDB987 58%,#9A7D2E)", boxShadow: "0 0 12px rgba(205,185,135,.75)" }} />
          Candice
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/moi/questionnaire" aria-label="Modifier" style={btnRound}><Icon name="pencil" size={17} /></Link>
          <Link href="/parametres" aria-label="Réglages" style={btnRound}><Icon name="gear" size={17} /></Link>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, padding: "26px 22px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
          {/* Avatar 76px — photo éditable, badge caméra UNIQUE */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Changer ma photo"
              style={{
                width: 76, height: 76, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", overflow: "hidden",
                fontFamily: "var(--font-serif)", fontSize: 32, color: T2.pine,
                background: photo ? "#fff" : "radial-gradient(circle at 35% 30%,#fff,#FBF8F0)",
                border: "1px solid rgba(205,185,135,.55)",
                boxShadow: "0 8px 22px rgba(0,0,0,.18)",
                cursor: "pointer", padding: 0, opacity: uploading ? 0.6 : 1,
              }}
            >
              {photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (firstName[0]?.toUpperCase() ?? "")}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Changer ma photo"
              style={{
                position: "absolute", left: -3, bottom: 0, width: 24, height: 24,
                borderRadius: "50%", background: T2.pine, display: "flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,.25)", border: "1.5px solid rgba(255,255,255,.85)",
                color: "#fff", cursor: "pointer",
              }}
            >
              <Icon name="camera" size={12} />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} style={{ display: "none" }} />
          </div>

          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 34, letterSpacing: 0.2, margin: 0 }}>
              {firstName}
            </h1>
            {/* Anneau champagne SANS chiffre + phrase 4 états */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7 }}>
              <span style={{
                width: 19, height: 19, borderRadius: "50%", position: "relative", flexShrink: 0,
                background: `conic-gradient(${T2.champ} 0 ${ringDeg}deg, rgba(255,255,255,.16) ${ringDeg}deg 360deg)`,
                boxShadow: "0 0 10px rgba(205,185,135,.45)",
              }}>
                <span style={{ position: "absolute", inset: 3.5, borderRadius: "50%", background: "#164534" }} />
              </span>
              <p style={{ fontSize: 14.5, color: "rgba(255,255,255,.84)", margin: 0 }}>
                {phrase.before}<b style={{ color: "#EBDDB6", fontWeight: 600 }}>{phrase.bold}</b>{phrase.after}
              </p>
            </div>
            {/* CTA texte champagne clair — deep-link questions (état 4 : plus rien à demander) */}
            {knowState < 4 && (
              <Link href="/moi/discovery?mode=full" style={{
                display: "inline-flex", alignItems: "center", gap: 5, margin: "2px 0 0 28px",
                fontSize: 12.5, fontWeight: 500, color: "rgba(235,221,182,.72)",
                minHeight: 34, textDecoration: "none",
              }}>
                Améliorer encore sa connaissance <Icon name="chevron" size={13} />
              </Link>
            )}
          </div>
        </div>

        {/* CTA : Partager (blanc, principal) + Ma wishlist (stub, contour) */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <Link href="/moi/partage" style={{
            flex: 1, minHeight: 50, borderRadius: 6, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, fontWeight: 600,
            background: "#fff", color: T2.pine, boxShadow: "0 6px 16px rgba(0,0,0,.14)",
            textDecoration: "none",
          }}>
            Partager mon profil
          </Link>
          <button style={{
            flex: 1, minHeight: 50, borderRadius: 6, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, fontWeight: 600,
            border: "1px solid rgba(255,255,255,.4)", color: "#fff",
            background: "none", cursor: "default", fontFamily: "var(--font-sans)",
          }}>
            <Icon name="plus" size={15} style={{ marginRight: 7 }} />Ma wishlist
          </button>
        </div>
      </div>
    </div>
  );
}

const btnRound: React.CSSProperties = {
  width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,.28)",
  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
  textDecoration: "none",
};

/** Recadrage carré centré, 512px, JPEG — simple, côté client. */
async function cropSquare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 512, 512);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("crop"))), "image/jpeg", 0.88));
}
