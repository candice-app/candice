import { NextRequest, NextResponse } from "next/server";

// Fail-closed : aucun repli en dur (un secret committé reste dans l'historique Git indéfiniment —
// c'est la rotation qui l'a neutralisé, pas ce retrait). Si BETA_PASSWORD est absent, on refuse tout.
const BETA_PASSWORD = process.env.BETA_PASSWORD;

export async function POST(request: NextRequest) {
  let password: string;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!BETA_PASSWORD || password !== BETA_PASSWORD) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("beta_access", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return response;
}
