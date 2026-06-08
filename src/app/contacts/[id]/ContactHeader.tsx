"use client";

import { useRef, useState } from "react";
import { ageSlice } from "@/lib/utils/age";

function compressImage(file: File, maxPx: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not available")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")); },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#2A5C39,#1A3E26)",
  "linear-gradient(135deg,#4A7C59,#2A5C39)",
  "linear-gradient(135deg,#534AB7,#3C3489)",
  "linear-gradient(135deg,#9A3556,#72243E)",
  "linear-gradient(135deg,#BA7517,#854F0B)",
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

interface Props {
  contactId: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  signedUrl: string | null;
  memoryMode?: boolean;
  dateDeNaissance?: string | null;
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  partner: "Partenaire", friend: "Ami(e)", family: "Famille", colleague: "Collègue", other: "Autre",
};

export default function ContactHeader({ contactId, name, relationship, phone, email, signedUrl, memoryMode, dateDeNaissance }: Props) {
  const [photo, setPhoto] = useState<string | null>(signedUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.8);
      const body = new FormData();
      body.append("file", compressed, "avatar.jpg");
      body.append("contactId", contactId);
      const res = await fetch("/api/contacts/upload-photo", { method: "POST", body });
      if (!res.ok) throw new Error("Upload failed");
      const { signedUrl: freshUrl } = await res.json() as { signedUrl: string };
      setPhoto(freshUrl);
    } catch {
      // silently fail — photo upload is optional
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {/* Photo upload */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Changer la photo"
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: photo ? "transparent" : getColor(name),
            border: "none", cursor: "pointer", padding: 0, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            boxShadow: "0 0 0 1px var(--champ-line)",
          }}
        >
          {photo ? (
            <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28, fontWeight: 300,
              color: "var(--canvas)",
              letterSpacing: "-.01em",
            }}>
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <span style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: uploading ? 1 : 0,
            transition: "opacity 0.2s",
            fontSize: 18,
          }}>
            {uploading ? "…" : "📷"}
          </span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontSize: "clamp(22px, 4.5vw, 28px)",
          color: "var(--canvas)",
          letterSpacing: "-.018em",
          lineHeight: 1.15,
          fontStyle: memoryMode ? "italic" : "normal",
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 12,
          color: "var(--champ-line)",
          fontWeight: 300,
          marginTop: 5,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}>
          {RELATIONSHIP_LABEL[relationship] ?? relationship}
          {dateDeNaissance && ageSlice(dateDeNaissance) && ` · ${ageSlice(dateDeNaissance)}`}
          {memoryMode && " · En souvenir"}
        </div>
        {(phone || email) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
            {phone && (
              <a href={`tel:${phone}`} style={{ fontSize: 12, fontWeight: 300, color: "rgba(244,241,232,.6)", textDecoration: "none" }}>
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} style={{ fontSize: 12, fontWeight: 300, color: "rgba(244,241,232,.6)", textDecoration: "none" }}>
                {email}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
