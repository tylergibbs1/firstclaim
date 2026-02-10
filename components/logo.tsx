"use client";

/*
  Logo Mark — "Seed": a sprouting seed with an unfurling leaf.
  Metaphor: careful cultivation, growth from intention, something alive.
  Uses CSS custom properties from the theme so it adapts to light/dark mode.
*/

function LogoMark({
  size = 40,
  animate = true,
  className = "",
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {/* Seed body */}
      <path
        d="M50 88 C38 88, 22 74, 22 56 C22 38, 34 24, 50 18 C66 24, 78 38, 78 56 C78 74, 62 88, 50 88Z"
        fill="var(--primary)"
        opacity="0.85"
        style={
          animate
            ? { animation: "logo-fade-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both" }
            : undefined
        }
      />
      {/* Inner unfurling line — the sprout emerging */}
      <path
        d="M50 72 C50 72, 42 58, 50 42 C54 35, 50 28, 50 24"
        stroke="var(--background)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
        style={
          animate
            ? { animation: "logo-fade-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both" }
            : undefined
        }
      />
      {/* Small leaf unfurling right */}
      <path
        d="M50 48 C56 44, 62 44, 64 48 C62 50, 56 50, 50 48Z"
        fill="var(--background)"
        opacity="0.75"
        style={
          animate
            ? { animation: "logo-fade-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both" }
            : undefined
        }
      />
    </svg>
  );
}

/*
  Wordmark — renders the brand name using the serif font from the theme.
*/
function Wordmark({
  text = "FirstClaim",
  size = "1.5rem",
  className = "",
}: {
  text?: string;
  size?: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-heading), Georgia, serif",
        fontSize: size,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: "var(--foreground)",
        lineHeight: 1.1,
        userSelect: "none",
      }}
    >
      {text}
    </span>
  );
}

/*
  Full Logo — composable mark + wordmark.

  Variants:
    horizontal    — mark left, wordmark right (navbars, headers)
    vertical      — mark top, wordmark below (footers, splash)
    mark-only     — just the stone mark (favicons, tight spaces)
    wordmark-only — just the text (when mark is elsewhere)

  Sizes: sm | md | lg
*/
export function Logo({
  text = "FirstClaim",
  variant = "horizontal",
  size = "md",
  animate = true,
  className = "",
}: {
  text?: string;
  variant?: "horizontal" | "vertical" | "mark-only" | "wordmark-only";
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: { mark: 28, font: "1.1rem", gap: "0.5rem" },
    md: { mark: 40, font: "1.5rem", gap: "0.75rem" },
    lg: { mark: 56, font: "2rem", gap: "1rem" },
  };

  const s = sizes[size];

  if (variant === "mark-only") {
    return <LogoMark size={s.mark} animate={animate} className={className} />;
  }

  if (variant === "wordmark-only") {
    return <Wordmark text={text} size={s.font} className={className} />;
  }

  const isVertical = variant === "vertical";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap: s.gap,
      }}
      role="img"
      aria-label={`${text} logo`}
    >
      <LogoMark size={s.mark} animate={animate} />
      <Wordmark text={text} size={s.font} />
    </div>
  );
}

export { LogoMark, Wordmark };
