import Link from "next/link";

type Size = "sm" | "md" | "lg";

const wordSizes: Record<Size, number> = { sm: 14, md: 16, lg: 18 };
const dotSizes: Record<Size, number> = { sm: 16, md: 18, lg: 20 };

export function Logo({
  size = "md",
  href = "/",
  color = "#2C1A0E",
}: {
  size?: Size;
  href?: string;
  color?: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "inline-flex", alignItems: "baseline", lineHeight: 1 }}>
      <span
        style={{
          fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
          fontSize: wordSizes[size],
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color,
          lineHeight: 1,
        }}
      >
        CANDICE
      </span>
      <span
        style={{
          fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
          fontSize: dotSizes[size],
          fontWeight: 500,
          color: "#C47A4A",
          lineHeight: 1,
          display: "inline-block",
          marginLeft: 4,
        }}
      >
        •
      </span>
    </Link>
  );
}
