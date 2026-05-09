"use client";

import { useState } from "react";
import IdeaModal from "./IdeaModal";
import { Contact, QuestionnaireResponse } from "@/types";

interface Props {
  contacts: (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
}

export default function DashboardActions({ contacts }: Props) {
  const [showIdea, setShowIdea] = useState(false);

  if (contacts.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setShowIdea(true)}
        style={{
          background: "#2C1A0E",
          color: "#FAF7F2",
          border: "none",
          borderRadius: 8,
          padding: "12px 18px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginBottom: 20,
          width: "100%",
          justifyContent: "center",
        }}
      >
        ✦ Donne-moi une idée
      </button>
      {showIdea && (
        <IdeaModal contacts={contacts} onClose={() => setShowIdea(false)} />
      )}
    </>
  );
}
