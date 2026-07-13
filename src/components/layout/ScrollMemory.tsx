"use client";

// F3 STOP final — restauration du scroll sur TOUS les chemins de retour
// (nav interne push, bouton retour Safari) et TOUS les shells :
//   · pages V4Shell : scroll fenêtre ;
//   · pages DashboardShell : scroll du conteneur interne .main-content.
// Position mémorisée par pathname (sessionStorage), restaurée avec retries
// le temps que le contenu streamé redonne sa hauteur. Monté UNE fois dans
// le layout racine.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = (p: string, kind: string) => `scroll:${kind}:${p}`;

export default function ScrollMemory() {
  const pathname = usePathname();

  // Sauvegarde continue (throttlée par rAF) — fenêtre + conteneur interne
  useEffect(() => {
    let ticking = false;
    const save = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(KEY(pathname, "win"), String(window.scrollY));
          const inner = document.querySelector(".main-content");
          if (inner) sessionStorage.setItem(KEY(pathname, "inner"), String(inner.scrollTop));
        } catch {}
        ticking = false;
      });
    };
    window.addEventListener("scroll", save, { passive: true });
    // le conteneur interne n'émet pas sur window : écoute en capture
    document.addEventListener("scroll", save, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", save);
      document.removeEventListener("scroll", save, { capture: true } as EventListenerOptions);
    };
  }, [pathname]);

  // Restauration à l'arrivée sur le pathname (push OU retour navigateur)
  useEffect(() => {
    let winTarget = 0;
    let innerTarget = 0;
    try {
      winTarget = Number(sessionStorage.getItem(KEY(pathname, "win")) ?? 0);
      innerTarget = Number(sessionStorage.getItem(KEY(pathname, "inner")) ?? 0);
    } catch {}
    if (!winTarget && !innerTarget) return;

    // Budget ADAPTATIF (D2/scroll) : on retente tant que le contenu réel n'est
    // pas peint ([data-page-ready]) ET que la hauteur ne permet pas la cible.
    // Sur un rendu FROID, le contenu arrive derrière le squelette en 1,3–2,4 s :
    // l'ancien plafond fixe (20 × 60 ms = 1,2 s) abandonnait avant, d'où le
    // scroll qui revenait en haut. Plafond dur porté à 5 s (garde-fou).
    const MAX_MS = 5000;
    const start = performance.now();
    let cancelled = false;
    const attempt = () => {
      if (cancelled) return;
      const painted = !!document.querySelector("[data-page-ready]");
      const giveUp = performance.now() - start >= MAX_MS;
      let heightReady = true;
      if (winTarget) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max >= winTarget || giveUp) {
          window.scrollTo(0, Math.min(winTarget, Math.max(0, max)));
        } else heightReady = false;
      }
      if (innerTarget) {
        const inner = document.querySelector(".main-content");
        if (inner) {
          const max = inner.scrollHeight - inner.clientHeight;
          if (max >= innerTarget || giveUp) {
            inner.scrollTop = Math.min(innerTarget, Math.max(0, max));
          } else heightReady = false;
        } else if (!giveUp) heightReady = false;
      }
      // Réglé seulement quand le contenu réel est peint ET la hauteur atteinte.
      // Sinon on continue (re-assertion après le layout shift du streaming).
      if ((!painted || !heightReady) && !giveUp) {
        setTimeout(attempt, 60);
      }
    };
    requestAnimationFrame(attempt);
    return () => { cancelled = true; };
  }, [pathname]);

  return null;
}
