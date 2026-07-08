// NEUTRALISÉ — Refonte Profil V2, Phase B.
// Cette route servait les sélecteurs legacy (getNextDripQuestion /
// createOrResumeSession) SANS la garde anti-redemande. Morte côté UI,
// elle restait joignable en HTTP. Le seul chemin de sélection autorisé
// est getNextMicroQuestion (page /moi/discovery, garde complète).

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Ce point d'entrée n'existe plus." },
    { status: 410 },
  );
}
