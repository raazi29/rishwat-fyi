import { cn } from "@/lib/utils/cn";

/**
 * The one illustration in the system (DESIGN.md §Shapes): an authored,
 * single-weight ink line drawing of an institutional government building on
 * paper — a domed rotunda with a flag, a columned portico, flanking wings,
 * trees, a few walking figures and birds. No fills, no gradient sky, no
 * sketch/doodle texture; one uniform stroke width, inherited from the root.
 *
 * The hero communicates entirely through its text, so the drawing is
 * decorative. It carries a short role/label for anyone who lands on it, and
 * adds no interactive surface.
 */

// Central colonnade: six evenly spaced columns under the pediment.
const COLUMNS = [306, 328, 350, 372, 394, 416];

// Window centres for the two wings; two rows each.
const LEFT_WINDOWS = [176, 208, 240, 272];
const RIGHT_WINDOWS = [448, 480, 512, 544];
const WINDOW_ROWS = [238, 270];

// Central staircase: lines widen as they step down to the plaza.
const STEPS: Array<[number, number, number]> = [
  [300, 420, 300],
  [296, 424, 312],
  [290, 430, 324],
  [284, 436, 336],
  [278, 442, 348],
  [272, 448, 360],
];

/** An arched-top window outline centred on `x` at row `y`. */
function windowPath(x: number, y: number): string {
  const h = 22;
  const w = 8;
  const rise = 9;
  return `M${x - w} ${y + h} L${x - w} ${y} Q${x} ${y - rise} ${x + w} ${y} L${x + w} ${y + h} Z`;
}

/** A lumpy tree canopy centred on `x`, sitting above the ground line. */
function canopyPath(x: number): string {
  return [
    `M${x - 22} 330`,
    `C${x - 31} 314 ${x - 22} 295 ${x - 6} 296`,
    `C${x - 2} 283 ${x + 15} 285 ${x + 16} 298`,
    `C${x + 31} 299 ${x + 31} 320 ${x + 18} 328`,
    `C${x + 14} 339 ${x - 2} 339 ${x - 8} 332`,
    `C${x - 16} 337 ${x - 23} 335 ${x - 22} 330`,
    "Z",
  ].join(" ");
}

function Tree({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 360 V330`} />
      <path d={`M${x} 344 L${x - 7} 337`} />
      <path d={`M${x} 350 L${x + 7} 343`} />
      <path d={canopyPath(x)} />
    </g>
  );
}

/** A single walking figure; `flip` mirrors the stride. */
function WalkingFigure({ x, flip = false }: { x: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g>
      <circle cx={x} cy={338} r={4} />
      <path d={`M${x} 342 V353`} />
      <path d={`M${x} 353 L${x - 5 * s} 361`} />
      <path d={`M${x} 353 L${x + 5 * s} 360`} />
      <path d={`M${x} 345 L${x - 5 * s} 350`} />
      <path d={`M${x} 345 L${x + 4 * s} 349`} />
    </g>
  );
}

function Bird({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y} q6 -5 12 0 q6 -5 12 0`} />;
}

export function GovernmentBuilding({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 400"
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label="Line drawing of an institutional government building"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Sky */}
      <g opacity={0.45}>
        <Bird x={150} y={92} />
        <Bird x={496} y={80} />
        <Bird x={552} y={100} />
      </g>

      {/* Dome, drum, cupola and flag */}
      <g>
        <path d="M336 120 Q360 78 384 120" />
        <path d="M348 120 Q356 90 360 84" />
        <path d="M372 120 Q364 90 360 84" />
        <path d="M356 84 L356 76 L364 76 L364 84" />
        <circle cx={360} cy={72} r={2.5} />
        <path d="M360 70 V52" />
        <path d="M360 54 L382 57 L378 62 L382 67 L360 66" />
        <path d="M360 61 L379 62" />
        {/* Drum with three tall windows */}
        <path d="M336 120 V150 M384 120 V150 M336 150 H384" />
        <path d="M348 126 V146 M360 126 V146 M372 126 V146" />
      </g>

      {/* Central portico: pediment, entablature, colonnade, stylobate */}
      <g>
        <path d="M300 196 L360 150 L420 196" />
        <path d="M296 198 H424 M296 206 H424" />
        {COLUMNS.map((x) => (
          <g key={x}>
            <path d={`M${x - 5} 208 H${x + 5}`} />
            <rect x={x - 3.5} y={210} width={7} height={88} />
          </g>
        ))}
        <path d="M292 300 H428" />
      </g>

      {/* Left wing */}
      <g>
        <path d="M150 214 H296 M150 222 H296" />
        <path d="M150 222 V300 M146 300 H300" />
        {WINDOW_ROWS.map((y) =>
          LEFT_WINDOWS.map((x) => <path key={`l-${x}-${y}`} d={windowPath(x, y)} />),
        )}
      </g>

      {/* Right wing */}
      <g>
        <path d="M424 214 H570 M424 222 H570" />
        <path d="M570 222 V300 M420 300 H574" />
        {WINDOW_ROWS.map((y) =>
          RIGHT_WINDOWS.map((x) => <path key={`r-${x}-${y}`} d={windowPath(x, y)} />),
        )}
      </g>

      {/* Central staircase */}
      <g>
        {STEPS.map(([x1, x2, y]) => (
          <path key={y} d={`M${x1} ${y} H${x2}`} />
        ))}
      </g>

      {/* Trees */}
      <g opacity={0.5}>
        <Tree x={72} />
        <Tree x={120} />
        <Tree x={600} />
        <Tree x={648} />
      </g>

      {/* Ground */}
      <path d="M40 360 H680" />
      <path d="M64 380 H656" opacity={0.4} />

      {/* Walking figures */}
      <g opacity={0.85}>
        <WalkingFigure x={230} />
        <WalkingFigure x={300} flip />
        <WalkingFigure x={430} />
        <WalkingFigure x={492} flip />
      </g>
    </svg>
  );
}
