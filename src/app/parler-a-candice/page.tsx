import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";
import { Icon } from "@/components/ui/v4/IconSprite";

// Icône dans un carré 40x40 radius 12 (même style que .intent .ii maquette)
function IntentIcon({ name, bg, color }: { name: string; bg: string; color: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon name={name} size={19} />
    </div>
  );
}

const ACTIONS = [
  {
    id: "nouvelle",
    href: "/parler-a-candice/w1",
    iconName: "i-news",
    iconBg: "rgba(95,129,144,.14)",
    iconColor: "var(--blue)",
    title: "J'ai une nouvelle sur un proche",
    desc: "Partage ce qui se passe — Candice retient ce qui compte.",
    active: true,
  },
  {
    id: "repere",
    href: "/parler-a-candice/w2",
    iconName: "i-bookmark",
    iconBg: "var(--gtint)",
    iconColor: "var(--pine)",
    title: "J'ai repéré quelque chose pour lui",
    desc: "Une photo, un lien, une description — Candice l'ajoute à son profil.",
    active: true,
  },
  {
    id: "ne-va-pas",
    href: null,
    iconName: "i-heart",
    iconBg: "rgba(194,74,60,.13)",
    iconColor: "var(--red)",
    title: "Quelqu'un ne va pas bien",
    desc: "Dis-moi ce qui se passe — je t'aide à être là.",
    active: false,
  },
  {
    id: "conflit",
    href: null,
    iconName: "i-mend",
    iconBg: "rgba(138,90,107,.15)",
    iconColor: "var(--plum)",
    title: "Je suis en conflit avec quelqu'un",
    desc: "Prends le temps d'y voir clair avant d'agir.",
    active: false,
  },
  {
    id: "evenement",
    href: null,
    iconName: "i-cal",
    iconBg: "rgba(197,123,78,.15)",
    iconColor: "var(--terra)",
    title: "Je prépare un événement",
    desc: "Anniversaire, fête, surprise — je m'occupe du reste.",
    active: false,
  },
  {
    id: "plaisir",
    href: null,
    iconName: "i-spark",
    iconBg: "rgba(199,168,90,.2)",
    iconColor: "#9a7d2e",
    title: "Je veux faire plaisir à quelqu'un",
    desc: "Pas d'occasion particulière, juste l'envie.",
    active: false,
  },
  {
    id: "fiche",
    href: null,
    iconName: "i-words",
    iconBg: "var(--gtint)",
    iconColor: "var(--pine)",
    title: "Je veux mettre à jour une fiche",
    desc: "Quelque chose a changé — je note pour ne pas oublier.",
    active: false,
  },
  {
    id: "moi",
    href: null,
    iconName: "i-chat",
    iconBg: "var(--sage-bg)",
    iconColor: "var(--pine)",
    title: "Je veux dire ce qui me ferait plaisir",
    desc: "Exprime une envie — Candice garde ça pour toi.",
    active: false,
  },
];

export default async function ParlerACandice() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const active = ACTIONS.filter(a => a.active);
  const upcoming = ACTIONS.filter(a => !a.active);

  return (
    <V4Shell>
      <div style={{ padding: "12px 20px 120px", fontFamily: "var(--font-sans)" }}>

        <div style={{ textAlign: "center", margin: "8px 0 4px" }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: 22,
            color: "var(--ink)", letterSpacing: "-.012em", lineHeight: 1.25,
          }}>
            Que veux-tu confier à Candice&nbsp;?
          </h2>
          <p style={{ fontSize: 12.5, color: "var(--ink2)", margin: "4px 0 16px" }}>
            Choisis un point de départ. Ensuite, parle librement.
          </p>
        </div>

        {/* Active actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {active.map((action) => (
            <Link key={action.id} href={action.href!} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: 13, border: "1px solid var(--line)", borderRadius: 16,
                background: "var(--surface)", marginBottom: 10,
                boxShadow: "var(--shadow)", cursor: "pointer",
              }}>
                <IntentIcon name={action.iconName} bg={action.iconBg} color={action.iconColor} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14, color: "var(--ink)", display: "block" }}>{action.title}</b>
                  <small style={{ fontSize: 11.5, color: "var(--ink2)", marginTop: 2, lineHeight: 1.35, display: "block" }}>
                    {action.desc}
                  </small>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming — visually secondary */}
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "1.6px",
          textTransform: "uppercase", color: "var(--ink3)",
          margin: "14px 0 10px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
          À venir
          <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {upcoming.map((action) => (
            <div
              key={action.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 4px",
                borderBottom: "1px solid var(--line2)",
                opacity: 0.55,
              }}
            >
              <IntentIcon name={action.iconName} bg={action.iconBg} color={action.iconColor} />
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink2)", lineHeight: 1.4, flex: 1 }}>
                {action.title}
              </p>
            </div>
          ))}
        </div>

      </div>
    </V4Shell>
  );
}
