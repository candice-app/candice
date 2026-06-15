/* Sprite SVG V4 — copié verbatim depuis Candice_Redesign_Mockups_v4.html
   Ne pas modifier ces paths/viewBox sans mettre à jour le fichier de référence. */

export default function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <symbol id="i-detail" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16 16l4 4"/><path d="M11 8.5l.9 1.8 1.9.3-1.4 1.3.3 1.9-1.7-.9-1.7.9.3-1.9-1.4-1.3 1.9-.3z"/></symbol>
        <symbol id="i-hand" viewBox="0 0 24 24"><path d="M4 12v4a3 3 0 003 3h6.5a3 3 0 002.6-1.5L20 15"/><path d="M4 12l2.5-1 3 1.5"/><path d="M9 13l5 .5a1.4 1.4 0 000-2.8l-3-.2-2-3a1.5 1.5 0 00-2.7 1.2z"/></symbol>
        <symbol id="i-gift" viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11"/><path d="M12 9s-1.5-4-4-4-2.5 4 0 4 4 0 4 0 1.5-4 4-4 2.5 4 0 4z"/></symbol>
        <symbol id="i-moment" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.4"/><path d="M3 20c0-3 2.2-5 5-5s5 2 5 5"/><path d="M14 20c0-2.4 1.4-4 3.4-4s3.6 1.4 3.6 4"/></symbol>
        <symbol id="i-words" viewBox="0 0 24 24"><path d="M20 6.5l-9.5 9.5-3.5 1 1-3.5L17.5 4a1.5 1.5 0 012.5 2.5z"/><path d="M4 20h9"/></symbol>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></symbol>
        <symbol id="i-people" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 6.5a3 3 0 010 5.8M18 20c0-2.5-1-4.6-3-5.6"/></symbol>
        <symbol id="i-cal" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M4 9h16M8 3v4M16 3v4"/><path d="M12 13.5a1.6 1.6 0 011.6 1.6c0 1.3-1.6 2.4-1.6 2.4s-1.6-1.1-1.6-2.4A1.6 1.6 0 0112 13.5z"/></symbol>
        <symbol id="i-profile" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0115 0"/></symbol>
        <symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></symbol>
        <symbol id="i-send" viewBox="0 0 24 24"><path d="M5 12h13M12 6l6 6-6 6"/></symbol>
        <symbol id="i-news" viewBox="0 0 24 24"><path d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10 19a2 2 0 004 0"/></symbol>
        <symbol id="i-bookmark" viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></symbol>
        <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.5A3.5 3.5 0 0112 7a3.5 3.5 0 017 3.5c0 5.1-7 9.5-7 9.5z"/></symbol>
        <symbol id="i-mend" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M9 8l3-3 3 3M9 16l3 3 3-3"/><path d="M6 12h3M15 12h3" strokeDasharray="1.5 2"/></symbol>
        <symbol id="i-add" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0111-6.6"/><path d="M17 16v6M14 19h6"/></symbol>
        <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5" strokeWidth="1.4"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
        <symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></symbol>
        <symbol id="i-block" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/></symbol>
      </defs>
    </svg>
  );
}

export interface IconProps {
  name: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Icon({ name, size = 22, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      style={{
        display: "block",
        stroke: "currentColor",
        fill: "none",
        strokeWidth: 1.6,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...style,
      }}
      className={className}
    >
      <use href={`#${name}`} />
    </svg>
  );
}
