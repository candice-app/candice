import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

const ACTIONS = [
  {
    id: "nouvelle",
    href: "/parler-a-candice/w1",
    icon: "🩷",
    title: "J'ai une nouvelle sur un proche",
    desc: "Partage ce qui se passe — Candice retient ce qui compte.",
    active: true,
  },
  {
    id: "repere",
    href: "/parler-a-candice/w2",
    icon: "🎁",
    title: "J'ai repéré quelque chose pour lui",
    desc: "Une photo, un lien, une description — Candice l'ajoute à son profil.",
    active: true,
  },
  {
    id: "ne-va-pas",
    href: null,
    icon: "😔",
    title: "Quelqu'un ne va pas bien",
    desc: "Dis-moi ce qui se passe — je t'aide à être là.",
    active: false,
  },
  {
    id: "conflit",
    href: null,
    icon: "💬",
    title: "Je suis en conflit avec quelqu'un",
    desc: "Prends le temps d'y voir clair avant d'agir.",
    active: false,
  },
  {
    id: "evenement",
    href: null,
    icon: "🎂",
    title: "Je prépare un événement",
    desc: "Anniversaire, fête, surprise — je m'occupe du reste.",
    active: false,
  },
  {
    id: "plaisir",
    href: null,
    icon: "✨",
    title: "Je veux faire plaisir à quelqu'un",
    desc: "Pas d'occasion particulière, juste l'envie.",
    active: false,
  },
  {
    id: "fiche",
    href: null,
    icon: "📝",
    title: "Je veux mettre à jour une fiche",
    desc: "Quelque chose a changé — je note pour ne pas oublier.",
    active: false,
  },
  {
    id: "moi",
    href: null,
    icon: "💭",
    title: "Je veux dire ce qui me ferait plaisir",
    desc: "Exprime une envie — Candice garde ça pour toi.",
    active: false,
  },
];

export default async function ParlerACandice() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 40, paddingBottom: 40 }}>

        <p style={{
          fontSize: 10, fontWeight: 500, letterSpacing: ".42em",
          textTransform: "uppercase", color: "var(--pine)", marginBottom: 14,
        }}>
          Candice
        </p>

        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300, fontSize: 34,
          color: "var(--ink)", letterSpacing: "-.022em",
          lineHeight: 1.1, marginBottom: 10,
        } as React.CSSProperties}>
          Que se passe-t-il ?
        </h1>

        <p style={{
          fontSize: 14, fontWeight: 300, color: "var(--ink-2)",
          lineHeight: 1.6, marginBottom: 32,
        }}>
          Dis-moi ce que tu as en tête, je m&apos;occupe du reste.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACTIONS.map((action) => {
            const card = (
              <div
                key={action.id}
                style={{
                  padding: "18px 20px",
                  borderRadius: 16,
                  border: action.active
                    ? "0.5px solid rgba(23,62,49,.18)"
                    : "0.5px solid var(--line)",
                  background: action.active ? "var(--white)" : "rgba(253,253,251,.6)",
                  cursor: action.active ? "pointer" : "default",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  transition: "border-color .18s, box-shadow .18s",
                  opacity: action.active ? 1 : 0.72,
                  position: "relative",
                } as React.CSSProperties}
              >
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                  {action.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: action.active ? "var(--ink)" : "var(--ink-2)",
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}>
                    {action.title}
                  </p>
                  <p style={{
                    fontSize: 13,
                    fontWeight: 300,
                    color: "var(--ink-3)",
                    lineHeight: 1.55,
                  }}>
                    {action.desc}
                  </p>
                </div>
                {!action.active && (
                  <span style={{
                    position: "absolute",
                    top: 14,
                    right: 16,
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: ".3em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                  }}>
                    Bientôt
                  </span>
                )}
              </div>
            );

            if (!action.active || !action.href) return card;

            return (
              <Link key={action.id} href={action.href} style={{ textDecoration: "none" }}>
                {card}
              </Link>
            );
          })}
        </div>

      </div>
    </DashboardShell>
  );
}
