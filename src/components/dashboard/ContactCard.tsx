import Link from "next/link";
import { Contact, QuestionnaireResponse } from "@/types";

const RELATIONSHIP_LABEL: Record<string, string> = {
  partner: "Partenaire",
  friend: "Ami(e)",
  family: "Famille",
  colleague: "Collègue",
  other: "Autre",
};

const AVATAR_COLORS = [
  "linear-gradient(135deg,#C47A4A,#8A4020)",
  "linear-gradient(135deg,#4A7C59,#2A5C39)",
  "linear-gradient(135deg,#534AB7,#3C3489)",
  "linear-gradient(135deg,#9A3556,#72243E)",
  "linear-gradient(135deg,#BA7517,#854F0B)",
];

const SCORED_FIELDS: (keyof QuestionnaireResponse)[] = [
  "love_language", "communication_style", "stress_response", "social_energy",
  "appreciation_style", "conflict_resolution", "decision_making", "emotional_expression",
  "core_values", "recognition_preference", "boundaries", "growth_mindset",
  "hobbies", "favorite_foods", "gift_preference", "conversation_topics", "important_dates",
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function getCompletion(profile: QuestionnaireResponse | undefined): number {
  if (!profile) return 0;
  const filled = SCORED_FIELDS.filter(f => !!profile[f]).length;
  return Math.round((filled / SCORED_FIELDS.length) * 100);
}

function getCandiceStatus(name: string, pct: number): string | null {
  const firstName = name.split(" ")[0];
  if (pct === 0) return null;
  if (pct < 50) return `Candice commence à connaître ${firstName}`;
  if (pct < 80) return `Candice connaît ${firstName}`;
  if (pct < 100) return `Candice anticipe pour ${firstName}`;
  return null;
}

interface Props {
  contact: Contact & { questionnaire_responses: QuestionnaireResponse[] };
}

export default function ContactCard({ contact }: Props) {
  const profile = contact.questionnaire_responses?.[0];
  const pct = getCompletion(profile);
  const statusText = getCandiceStatus(contact.name, pct);

  return (
    <Link href={`/contacts/${contact.id}`} style={{ display: "block" }}>
      <div className="contact-row">
        <div
          className="contact-avatar"
          style={{ background: getColor(contact.name) }}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="contact-name">{contact.name}</p>
          <p className="contact-meta">
            {RELATIONSHIP_LABEL[contact.relationship] ?? contact.relationship}
            {contact.email && <span style={{ marginLeft: 8, opacity: 0.6 }}>· {contact.email}</span>}
          </p>
        </div>

        {statusText && (
          <span style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", fontStyle: "italic", flexShrink: 0, maxWidth: 200, textAlign: "right" }}>
            {statusText}
          </span>
        )}

        <span style={{ fontSize: 12, color: "var(--cond)", opacity: 0.5, flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}
