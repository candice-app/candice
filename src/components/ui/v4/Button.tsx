"use client";
/* .btn, .btn.ghost, .btn.champ — verbatim from Candice_Redesign_Mockups_v4.html
   .btn: height:50px;border-radius:15px;background:var(--pine);color:#fff;
     font-weight:600;font-size:14.5px;border:none;width:100%;
     box-shadow:0 6px 16px rgba(23,62,49,.18)
   .ghost: background:transparent;color:var(--pine);border:1px solid var(--line);box-shadow:none
   .champ: background:linear-gradient(180deg,#e8d8ab,var(--champ));color:#3a2f10;
     box-shadow:0 6px 16px rgba(205,185,135,.3) */

import React from "react";

export interface ButtonProps {
  variant?: "primary" | "ghost" | "champ";
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 50,
  borderRadius: 15,
  fontWeight: 600,
  fontSize: 14.5,
  border: "none",
  width: "100%",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

const VARIANTS: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--pine)",
    color: "#fff",
    boxShadow: "0 6px 16px rgba(23,62,49,.18)",
  },
  ghost: {
    background: "transparent",
    color: "var(--pine)",
    border: "1px solid var(--line)",
    boxShadow: "none",
  },
  champ: {
    background: "linear-gradient(180deg,#e8d8ab,var(--champ))",
    color: "#3a2f10",
    boxShadow: "0 6px 16px rgba(205,185,135,.3)",
  },
};

export default function Button({ variant = "primary", children, onClick, style, disabled, type = "button" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...BASE, ...VARIANTS[variant], ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}), ...style }}
    >
      {children}
    </button>
  );
}
