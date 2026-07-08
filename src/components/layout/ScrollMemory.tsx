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

    let tries = 0;
    let cancelled = false;
    const attempt = () => {
      if (cancelled) return;
      let settled = true;
      if (winTarget) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max >= winTarget || tries >= 20) {
          window.scrollTo(0, Math.min(winTarget, Math.max(0, max)));
        } else settled = false;
      }
      if (innerTarget) {
        const inner = document.querySelector(".main-content");
        if (inner) {
          const max = inner.scrollHeight - inner.clientHeight;
          if (max >= innerTarget || tries >= 20) {
            inner.scrollTop = Math.min(innerTarget, Math.max(0, max));
          } else settled = false;
        } else if (tries < 20) settled = false;
      }
      if (!settled && tries < 20) {
        tries += 1;
        setTimeout(attempt, 60);
      }
    };
    requestAnimationFrame(attempt);
    return () => { cancelled = true; };
  }, [pathname]);

  return null;
}
