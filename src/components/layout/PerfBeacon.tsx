"use client";

// F2 v2 — instrumentation TEMPORAIRE corrigée (constat Estelle : le v1
// s'arrêtait au premier paint = LE SQUELETTE, pas l'attente réelle).
// Mesure désormais jusqu'au CONTENU RÉEL : chaque page pose un marqueur
// [data-page-ready] sur son contenu — le squelette n'en a pas.
//   · to_content_ms : tap → contenu réel affiché
//   · skeleton_shown : un premier paint SANS marqueur a précédé le contenu
// À SUPPRIMER après le diagnostic (dernier commit du lot).

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function send(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ ...payload, ua: navigator.userAgent.slice(0, 120) });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/perf-log", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/perf-log", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

const hasContent = () => !!document.querySelector("[data-page-ready]");

/** Attend le marqueur de contenu réel (poll rAF, plafond 30 s). */
function waitForContent(): Promise<number> {
  return new Promise(resolve => {
    const t0 = performance.now();
    const tick = () => {
      if (hasContent()) return resolve(performance.now() - t0);
      if (performance.now() - t0 > 30000) return resolve(-1);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export default function PerfBeacon() {
  const pathname = usePathname();
  const lastClick = useRef<{ t: number; from: string } | null>(null);
  const prevPath = useRef<string | null>(null);

  // Chargement DUR : TTFB navigateur + délai jusqu'au contenu réel
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    waitForContent().then(wait => {
      send({
        kind: "hard",
        path: window.location.pathname,
        nav_type: nav.type,
        ttfb_ms: Math.round(nav.responseStart),
        dom_ms: Math.round(nav.domContentLoadedEventEnd),
        to_content_ms: wait >= 0 ? Math.round(performance.now()) : null, // depuis navigationStart
        skeleton_shown: false,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tap sur un lien interne
  useEffect(() => {
    const onClick = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='/']");
      if (a) lastClick.current = { t: performance.now(), from: window.location.pathname };
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, []);

  // Navigation douce : tap → route → CONTENU RÉEL (le squelette ne compte pas)
  useEffect(() => {
    const from = prevPath.current;
    prevPath.current = pathname;
    if (from === null || from === pathname) return;

    const click = lastClick.current;
    lastClick.current = null;
    const routeAt = performance.now();

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const skeletonShown = !hasContent(); // premier paint sans marqueur = squelette
      waitForContent().then(wait => {
        const contentAt = performance.now();
        send({
          kind: "soft",
          path: pathname,
          from_path: from,
          click_to_route_ms: click ? Math.round(routeAt - click.t) : null,
          route_to_paint_ms: Math.round(contentAt - routeAt), // conservé : route → contenu
          to_content_ms: wait >= 0 ? Math.round(contentAt - routeAt) : null,
          total_ms: click ? Math.round(contentAt - click.t) : null, // TAP → CONTENU RÉEL
          skeleton_shown: skeletonShown,
        });
      });
    }));
  }, [pathname]);

  return null;
}
