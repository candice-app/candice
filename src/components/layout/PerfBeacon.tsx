"use client";

// F2 STOP final — instrumentation TEMPORAIRE (diagnostic perf device réel).
// À SUPPRIMER après le diagnostic. Mesure ce que le device vit :
//   · chargements durs : TTFB, DOM interactif, load (PerformanceNavigationTiming)
//   · navigations douces : tap → changement de route → contenu peint
// Envoi en beacon vers /api/perf-log (table perf_beacons, service role).

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

export default function PerfBeacon() {
  const pathname = usePathname();
  const lastClick = useRef<{ t: number; from: string } | null>(null);
  const prevPath = useRef<string | null>(null);

  // Chargement DUR : timings navigateur
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    send({
      kind: "hard",
      path: window.location.pathname,
      nav_type: nav.type, // navigate | reload | back_forward
      ttfb_ms: Math.round(nav.responseStart),
      dom_ms: Math.round(nav.domContentLoadedEventEnd),
      load_ms: Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tap sur un lien : point de départ des navigations douces
  useEffect(() => {
    const onClick = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='/']");
      if (a) lastClick.current = { t: performance.now(), from: window.location.pathname };
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, []);

  // Changement de route : mesure tap → route, puis route → contenu peint
  useEffect(() => {
    const from = prevPath.current;
    prevPath.current = pathname;
    if (from === null || from === pathname) return;

    const click = lastClick.current;
    lastClick.current = null;
    const routeAt = performance.now();
    // double rAF ≈ premier paint du nouveau contenu (ou du squelette)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const paintAt = performance.now();
      send({
        kind: "soft",
        path: pathname,
        from_path: from,
        click_to_route_ms: click ? Math.round(routeAt - click.t) : null,
        route_to_paint_ms: Math.round(paintAt - routeAt),
        total_ms: click ? Math.round(paintAt - click.t) : null,
      });
    }));
  }, [pathname]);

  return null;
}
