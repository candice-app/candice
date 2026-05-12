import Link from "next/link";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, number> = {
  sm: 18,
  md: 26,
  lg: 34,
};

export function Logo({ size = "md", href = "/" }: { size?: Size; href?: string }) {
  const fs = sizeMap[size];
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
          fontSize: fs,
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#2C1A0E",
          lineHeight: 1,
        }}
      >
        CANDICE
        <span style={{ color: "#C47A4A" }}>.</span>
      </span>
    </Link>
  );
}
