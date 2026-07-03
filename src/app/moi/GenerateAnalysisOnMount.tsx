"use client";

// Reprend le déclencheur de génération d'analyse qui vivait dans
// /moi/resultats (ResultatsClient) : après le questionnaire, si le profil
// a des données attention mais pas encore d'analyse, on la génère puis on
// rafraîchit la page pour afficher la fiche enrichie.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateAnalysisOnMount() {
  const router = useRouter();
  const fired = useRef(false);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    (async () => {
      try {
        await fetch("/api/profile/generate", { method: "POST" });
        router.refresh();
      } catch {
        // silencieux : la fiche affiche les CTA "Affiner avec Candice"
      } finally {
        setGenerating(false);
      }
    })();
  }, [router]);

  if (!generating) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", margin: "14px 18px 0",
      background: "linear-gradient(135deg,#F6F1E4,#fff)",
      border: "1px solid #EAD9B0", borderRadius: 14,
      fontSize: 12.5, color: "#5F5A51",
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        border: "2px solid #CDB987", borderTopColor: "transparent",
        animation: "spin 0.9s linear infinite", flexShrink: 0,
      }} />
      Candice met à jour ton analyse…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
