"use client";

import { useState } from "react";
import type { ProactiveSuggestion, RefusalReason } from "@/types";

const REFUSAL_OPTIONS: { value: RefusalReason; label: string }[] = [
  { value: "not_now",       label: "Pas le bon moment, garde pour plus tard" },
  { value: "already_done",  label: "Déjà fait cette semaine" },
  { value: "not_fitting",   label: "Ne lui correspond pas" },
  { value: "too_generic",   label: "Trop générique" },
  { value: "too_expensive", label: "Trop cher" },
  { value: "other",         label: "Autre raison" },
];

const RELATION_LABEL: Record<string, string> = {
  partner: "Partenaire",
  friend: "Ami(e)",
  family: "Famille",
  colleague: "Collègue",
  other: "Autre",
};

const CATEGORY_LABEL: Record<string, string> = {
  quality_time: "Temps partagé",
  gift: "Cadeau",
  message: "Message",
  gesture: "Geste",
  activity: "Activité",
};

interface Props {
  suggestion: ProactiveSuggestion;
  contactName: string;
  contactRelationship: string;
  badge: string | null;
  onClose: () => void;
  onValidate: (id: string) => void;
  onRefuse: (id: string, reason: RefusalReason) => void;
}

export default function ProactiveSuggestionDetail({
  suggestion,
  contactName,
  contactRelationship,
  badge,
  onClose,
  onValidate,
  onRefuse,
}: Props) {
  const [showRefusalMenu, setShowRefusalMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    await onValidate(suggestion.id);
    setLoading(false);
  };

  const handleRefuse = async (reason: RefusalReason) => {
    setLoading(true);
    await onRefuse(suggestion.id, reason);
    setLoading(false);
  };

  return (
    <div
      className="modal"
      style={{ display: "flex" }}
      onClick={onClose}
    >
      <div
        className="modal-box"
        style={{ maxWidth: 440, padding: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 400, color: "var(--con)", marginBottom: 2 }}>{contactName}</p>
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>
              {RELATION_LABEL[contactRelationship] ?? contactRelationship}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "var(--cond)", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Context badge */}
        {badge && (
          <p style={{
            display: "inline-block", fontSize: 10, fontWeight: 500, letterSpacing: 1.5,
            textTransform: "uppercase", color: "var(--terra)", marginBottom: 12,
            borderBottom: "1px solid var(--terra)", paddingBottom: 2,
          }}>
            {badge}
          </p>
        )}

        {/* Category */}
        <p style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          {CATEGORY_LABEL[suggestion.category] ?? suggestion.category}
        </p>

        {/* Title */}
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 22, fontWeight: 400, color: "var(--con)", lineHeight: 1.3, marginBottom: 16,
        }}>
          {suggestion.title}
        </p>

        {/* Description */}
        <p style={{ fontSize: 15, fontWeight: 300, color: "var(--con)", lineHeight: 1.65, marginBottom: 20 }}>
          {suggestion.description}
        </p>

        {/* Reasoning */}
        {suggestion.reasoning && (
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic", fontSize: 13, color: "var(--terra)", marginBottom: 6,
            }}>
              Pourquoi je te propose ça
            </p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
              {suggestion.reasoning}
            </p>
          </div>
        )}

        {/* Partner hint */}
        {suggestion.partner_hint && (
          <div style={{ background: "var(--br)", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
              Disponible chez{" "}
              <strong style={{ fontWeight: 500, color: "var(--con)" }}>{suggestion.partner_hint}</strong>
              {suggestion.estimated_price ? ` · ${suggestion.estimated_price}` : ""}
            </p>
          </div>
        )}

        {/* Price without partner */}
        {!suggestion.partner_hint && suggestion.estimated_price && (
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 20 }}>
            {suggestion.estimated_price}
          </p>
        )}

        {/* Actions */}
        {!showRefusalMenu ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="btn-primary"
              onClick={handleValidate}
              disabled={loading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? "…" : "Je m'en occupe"}
            </button>
            {/* TODO Phase 7: facilitation flow (booking, etc.) */}
            <button
              className="btn-ghost"
              onClick={handleValidate}
              disabled={loading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? "…" : "Je te facilite"}
            </button>
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <button
                onClick={() => setShowRefusalMenu(true)}
                style={{
                  fontSize: 11, fontWeight: 300, color: "var(--cond)",
                  background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
                }}
              >
                Pas le bon moment
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>
              Dis-moi pourquoi :
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {REFUSAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleRefuse(opt.value)}
                  disabled={loading}
                  style={{
                    textAlign: "left", background: "none",
                    border: "0.5px solid var(--brd)", borderRadius: 8,
                    padding: "10px 14px", fontSize: 13, fontWeight: 300,
                    color: "var(--cond)", cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setShowRefusalMenu(false)}
                style={{
                  fontSize: 11, color: "var(--cond)", background: "none",
                  border: "none", cursor: "pointer", textDecoration: "underline", marginTop: 4,
                }}
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
