"use client";

// V3.1 STOP vague 3 — restauration du scroll par onglet.
// La BottomNav navigue en push : nouvelle entrée d'historique → le
// navigateur remet le scroll à zéro par design (seul le bouton retour
// restaure). Pattern app à tabs : position mémorisée par pathname
// (sessionStorage) et restaurée au retour, avec retries le temps que le
// contenu streamé redonne sa hauteur à la page.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = (p: string) => `scroll:${p}`;

export default function ScrollMemory() {
  const pathname = usePathname();

  // Sauvegarde continue (throttlée par rAF)
  useEffect(() => {
    let ticking = false;
    const save = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try { sessionStorage.setItem(KEY(pathname), String(window.scrollY)); } catch {}
        ticking = false;
      });
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [pathname]);

  // Restauration à l'arrivée sur le pathname
  useEffect(() => {
    let target = 0;
    try { target = Number(sessionStorage.getItem(KEY(pathname)) ?? 0); } catch {}
    if (!target) return;

    let tries = 0;
    let cancelled = false;
    const attempt = () => {
      if (cancelled) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max >= target || tries >= 20) {
        window.scrollTo(0, Math.min(target, Math.max(0, max)));
        // le contenu peut encore pousser la hauteur : deux rappels espacés
        if (tries < 20 && Math.abs(window.scrollY - target) > 4) {
          tries += 1;
          setTimeout(attempt, 60);
        }
        return;
      }
      tries += 1;
      setTimeout(attempt, 60);
    };
    requestAnimationFrame(attempt);
    return () => { cancelled = true; };
  }, [pathname]);

  return null;
}
