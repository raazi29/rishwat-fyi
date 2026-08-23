/**
 * RishwatMark — the brand mark as inline SVG: the serif R of the record, the
 * three document lines of an official procedure inside its bowl, and the
 * magnifier that is the whole product (looking at what the procedure actually
 * costs), on the official-green tile.
 *
 * Inline rather than an <img> for three reasons that matter here: it cannot 404
 * or flash, it needs no image optimiser, and the tile is drawn with the theme's
 * own tokens so a single mark stays correct in light and dark instead of needing
 * a swapped pair.
 *
 * `variant="tile"` is the app-icon lockup (mark on a green rounded square, for
 * the header, footer and menu). `variant="bare"` drops the tile and inherits
 * `currentColor`, for placement on a surface that is already official green.
 */
export function RishwatMark({
  size = 30,
  variant = "tile",
  className,
}: {
  size?: number;
  variant?: "tile" | "bare";
  className?: string;
}) {
  const tile = variant === "tile";
  // On the tile the R is the paper cream and the accents are the light green
  // from the dark-theme palette; bare, everything is the inherited ink.
  const glyph = tile ? "var(--color-ink-inverse, #f7f8f5)" : "currentColor";
  const accent = tile ? "var(--color-official-soft, #63a37e)" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {tile ? <rect width="64" height="64" rx="14" fill="var(--color-official, #0b3a20)" /> : null}

      {/* The R: stem with serif feet, a bowl, and a leg that carries the lens. */}
      <path
        fill={glyph}
        d="M13.5 12.5h20.2c6.9 0 11.4 3.9 11.4 9.9 0 4.6-2.7 7.9-7.2 9.2l6.1 9.1-4.6 3.1-7.4-11.2h-6.6v11.9h4.7v4.6H13.5v-4.6h4.6V17.1h-4.6v-4.6Zm11.9 4.6v10.9h7.3c3.8 0 6.1-2 6.1-5.5 0-3.4-2.3-5.4-6.1-5.4h-7.3Z"
      />
      {/* The official procedure, inside the bowl: three lines, shortest last. */}
      <g fill={accent}>
        <rect x="28.4" y="19.6" width="9.6" height="2.4" rx="1.2" />
        <rect x="28.4" y="23.4" width="7.6" height="2.4" rx="1.2" />
        <rect x="28.4" y="27.2" width="5.4" height="2.4" rx="1.2" />
      </g>
      {/* The magnifier: lens on the leg, handle running out to the corner. */}
      <circle cx="44.4" cy="43.6" r="6.2" fill={accent} stroke={glyph} strokeWidth="2.4" />
      <path
        d="M48.9 48.4 54.6 54.2"
        stroke={glyph}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
