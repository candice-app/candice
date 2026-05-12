import Link from "next/link";

type Size = "sm" | "md" | "lg";

const wordSizes: Record<Size, number> = { sm: 18, md: 26, lg: 34 };
const dotSizes: Record<Size, number>  = { sm: 26, md: 36, lg: 48 };

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
          fontWeight: 300,
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
          fontWeight: 400,
          color: "#C47A4A",
          lineHeight: 1,
          display: "inline-block",
          marginLeft: 2,
        }}
      >
        •
      </span>
    </Link>
  );
}
