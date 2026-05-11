"use client";

import { useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const AVATAR_COLORS = [
  "linear-gradient(135deg,#C47A4A,#8A4020)",
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
  userId: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  completionPct: number;
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  partner: "Partenaire", friend: "Ami(e)", family: "Famille", colleague: "Collègue", other: "Autre",
};

export default function ContactHeader({ contactId, userId, name, relationship, phone, email, photoUrl, completionPct }: Props) {
  const [photo, setPhoto] = useState<string | null>(photoUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${contactId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("contact-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("contact-photos").getPublicUrl(path);
      await supabase.from("contacts").update({ photo_url: publicUrl }).eq("id", contactId);
      setPhoto(publicUrl);
    } catch {
      // silently fail — photo upload is optional
    } finally {
      setUploading(false);
    }
  };

  const barColor = completionPct >= 75 ? "#4A7C59" : completionPct >= 40 ? "#C47A4A" : "#9E7B5A";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
      {/* Avatar with upload */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Changer la photo"
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: photo ? "transparent" : getColor(name),
            border: "none", cursor: "pointer", padding: 0, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          {photo ? (
            <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 500, color: "#fff" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1 className="page-title" style={{ margin: 0 }}>{name}</h1>
          <span style={{
            fontSize: 10, fontWeight: 500, letterSpacing: 1.5,
            textTransform: "uppercase", color: "var(--terra)",
            background: "var(--t2)", border: "0.5px solid var(--t3)",
            padding: "2px 8px", borderRadius: 20,
          }}>
            {RELATIONSHIP_LABEL[relationship] ?? relationship}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          {phone && (
            <a href={`tel:${phone}`} style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", textDecoration: "none" }}>
              📞 {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", textDecoration: "none" }}>
              ✉ {email}
            </a>
          )}
        </div>

        {/* Completion bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: "var(--brd)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completionPct}%`, background: barColor, borderRadius: 2, transition: "width 0.5s ease" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 500, color: barColor, flexShrink: 0 }}>
            {completionPct}% profil
          </span>
        </div>
      </div>
    </div>
  );
}
