// Pure deterministic question generator — no AI, safe to import in server components.

const TEMPLATES: ((name: string) => string)[] = [
  (n) => `Comment va ${n} en ce moment ?`,
  (n) => `Tu as des nouvelles de ${n} récemment ?`,
  (n) => `${n} a des projets ou des échéances cette semaine ?`,
  (n) => `Il se passe quelque chose d'important pour ${n} en ce moment ?`,
  (n) => `${n} traverse une période particulière ?`,
  (n) => `Tu sais comment se sent ${n} en ce moment ?`,
];

export function generateProactiveQuestion(firstName: string, recentlyAsked: string[]): string {
  const available = TEMPLATES.map((t) => t(firstName)).filter((q) => !recentlyAsked.includes(q));
  const pool = available.length > 0 ? available : TEMPLATES.map((t) => t(firstName));
  return pool[Math.floor(Math.random() * pool.length)];
}
