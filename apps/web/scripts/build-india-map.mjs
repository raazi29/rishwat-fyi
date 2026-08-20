/**
 * build-india-map.mjs — pre-project India state geometry at build time.
 *
 * Downloads the district-level India GeoJSON, keeps each state's outline
 * polygon (the `district: undefined` feature it ships), maps state names to
 * ISO 3166-2:IN suffix codes, simplifies rings with Douglas–Peucker, projects
 * with a plain Mercator into a fixed viewBox, rounds coordinates to 1 decimal,
 * and emits src/data/india-states.ts. No runtime geo library — the browser
 * only ever sees flat SVG path strings. The source is fetched to a temp path
 * OUTSIDE src and deleted afterwards; only the generated .ts is kept.
 *
 * Regenerate:  npm run map:build -w @rishwat/web
 * Source: udit-001/india-maps-data (CC0). Node builtins only (needs fetch).
 */

import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson";
const VIEW_WIDTH = 1000;
const SIMPLIFY_TOLERANCE = 0.7; // px, in the VIEW_WIDTH-wide projected space
const DECIMALS = 1;

/** GeoJSON `st_nm` → ISO 3166-2:IN suffix. 28 states + 8 union territories. */
const NAME_TO_CODE = {
  "Andaman and Nicobar Islands": "AN", "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR",
  Assam: "AS", Bihar: "BR", Chandigarh: "CH", Chhattisgarh: "CT",
  "Dadra and Nagar Haveli and Daman and Diu": "DH", Delhi: "DL", Goa: "GA",
  Gujarat: "GJ", Haryana: "HR", "Himachal Pradesh": "HP", "Jammu and Kashmir": "JK",
  Jharkhand: "JH", Karnataka: "KA", Kerala: "KL", Ladakh: "LA", Lakshadweep: "LD",
  "Madhya Pradesh": "MP", Maharashtra: "MH", Manipur: "MN", Meghalaya: "ML",
  Mizoram: "MZ", Nagaland: "NL", Odisha: "OR", Puducherry: "PY", Punjab: "PB",
  Rajasthan: "RJ", Sikkim: "SK", "Tamil Nadu": "TN", Telangana: "TG", Tripura: "TR",
  "Uttar Pradesh": "UP", Uttarakhand: "UT", "West Bengal": "WB",
};

/** The 8 current union territories, for the launch-time sanity report. */
const UT_CODES = new Set(["AN", "CH", "DH", "DL", "JK", "LA", "LD", "PY"]);

// --- geometry helpers ------------------------------------------------------

/** Flatten a GeoJSON Polygon/MultiPolygon into a list of coordinate rings. */
function ringsOf(geometry) {
  const rings = [];
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) rings.push(ring);
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) for (const ring of polygon) rings.push(ring);
  }
  return rings;
}

const RAD = Math.PI / 180;
/** Plain (spherical web) Mercator; the shared radius and offsets cancel on fit. */
function mercator(lon, lat) {
  return [lon * RAD, Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];
}

/** Perpendicular distance from point p to the infinite line through a–b. */
function perpendicular(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const twice = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]);
  return twice / Math.hypot(dx, dy);
}

/** Douglas–Peucker on an open polyline (endpoints preserved). Iterative stack. */
function simplify(points, tolerance) {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let maxDist = -1;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const dist = perpendicular(points[i], points[start], points[end]);
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }
    if (maxDist > tolerance && index !== -1) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/** Signed-area centroid of a ring; returns [cx, cy, absArea]. */
function centroidOf(ring) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const p0 = ring[i];
    const p1 = ring[(i + 1) % n];
    const cross = p0[0] * p1[1] - p1[0] * p0[1];
    area += cross;
    cx += (p0[0] + p1[0]) * cross;
    cy += (p0[1] + p1[1]) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-9) {
    let sx = 0;
    let sy = 0;
    for (const p of ring) { sx += p[0]; sy += p[1]; }
    return [sx / n, sy / n, 0];
  }
  return [cx / (6 * area), cy / (6 * area), Math.abs(area)];
}

const pow = 10 ** DECIMALS;
const round1 = (value) => Math.round(value * pow) / pow;
const fmt = (value) => {
  const r = round1(value);
  return Number.isInteger(r) ? String(r) : r.toFixed(DECIMALS);
};

// --- build -----------------------------------------------------------------

async function main() {
  console.log(`↓ downloading ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  const body = await response.text();

  const tempDir = mkdtempSync(join(tmpdir(), "rishwat-india-"));
  const tempFile = join(tempDir, "india.geojson");
  writeFileSync(tempFile, body);

  try {
    const geo = JSON.parse(readFileSync(tempFile, "utf8"));
    if (geo.type !== "FeatureCollection") throw new Error("Unexpected GeoJSON root");

    // Group rings by state, preferring the state-outline feature (no district).
    const grouped = new Map();
    for (const feature of geo.features) {
      const name = feature.properties?.st_nm;
      if (!name) continue;
      if (!(name in NAME_TO_CODE)) {
        throw new Error(`Unmapped GeoJSON state name: "${name}" — add it to NAME_TO_CODE`);
      }
      const bucket = grouped.get(name) ?? { outline: [], all: [] };
      const rings = ringsOf(feature.geometry);
      if (feature.properties.district == null) bucket.outline.push(...rings);
      bucket.all.push(...rings);
      grouped.set(name, bucket);
    }

    // Pass 1: Mercator bounds across every ring we will actually emit.
    const chosen = new Map();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [name, bucket] of grouped) {
      const rings = bucket.outline.length ? bucket.outline : bucket.all;
      chosen.set(name, rings);
      for (const ring of rings) {
        for (const [lon, lat] of ring) {
          const [mx, my] = mercator(lon, lat);
          if (mx < minX) minX = mx;
          if (mx > maxX) maxX = mx;
          if (my < minY) minY = my;
          if (my > maxY) maxY = my;
        }
      }
    }
    const scale = VIEW_WIDTH / (maxX - minX);
    const viewHeight = round1((maxY - minY) * scale);
    const project = (lon, lat) => {
      const [mx, my] = mercator(lon, lat);
      return [(mx - minX) * scale, (maxY - my) * scale]; // flip Y so north is up
    };

    // Pass 2: project, simplify, round, assemble path + centroid per state.
    const states = [];
    for (const [name, rings] of chosen) {
      const subpaths = [];
      let best = null; // largest simplified ring, used for the centroid
      const projectedRings = rings
        .map((ring) => ring.map(([lon, lat]) => project(lon, lat)))
        .sort((a, b) => centroidOf(b)[2] - centroidOf(a)[2]);

      for (const projected of projectedRings) {
        const pts = [];
        for (const point of simplify(projected, SIMPLIFY_TOLERANCE)) {
          const x = round1(point[0]);
          const y = round1(point[1]);
          const prev = pts[pts.length - 1];
          if (!prev || prev[0] !== x || prev[1] !== y) pts.push([x, y]);
        }
        // Drop the closing duplicate; the `Z` closes the subpath.
        if (pts.length > 1) {
          const first = pts[0];
          const last = pts[pts.length - 1];
          if (first[0] === last[0] && first[1] === last[1]) pts.pop();
        }
        if (pts.length < 3) continue;
        subpaths.push(`M${pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(" ")}Z`);
        const c = centroidOf(pts);
        if (!best || c[2] > best[2]) best = c;
      }

      // Safety net: keep even a micro-territory present and clickable.
      if (subpaths.length === 0) {
        let sx = 0, sy = 0, n = 0;
        for (const ring of projectedRings) for (const [x, y] of ring) { sx += x; sy += y; n++; }
        const cx = n ? sx / n : 0;
        const cy = n ? sy / n : 0;
        const r = 3;
        subpaths.push(
          `M${fmt(cx - r)} ${fmt(cy - r)} ${fmt(cx + r)} ${fmt(cy - r)} ` +
            `${fmt(cx + r)} ${fmt(cy + r)} ${fmt(cx - r)} ${fmt(cy + r)}Z`,
        );
        best = [cx, cy, 0];
      }

      states.push({
        code: NAME_TO_CODE[name],
        name,
        d: subpaths.join(""),
        centroid: [round1(best[0]), round1(best[1])],
      });
    }

    states.sort((a, b) => a.name.localeCompare(b.name));

    // Verify the full set before writing anything.
    const produced = new Set(states.map((s) => s.code));
    const expected = new Set(Object.values(NAME_TO_CODE));
    for (const code of expected) {
      if (!produced.has(code)) throw new Error(`Missing state after build: ${code}`);
    }
    if (produced.size !== expected.size) {
      throw new Error(`Expected ${expected.size} states, produced ${produced.size}`);
    }
    const utCount = states.filter((s) => UT_CODES.has(s.code)).length;

    const rows = states
      .map(
        (s) =>
          `  { code: ${JSON.stringify(s.code)}, name: ${JSON.stringify(s.name)}, ` +
          `centroid: [${s.centroid[0]}, ${s.centroid[1]}], d: ${JSON.stringify(s.d)} },`,
      )
      .join("\n");

    const file =
      `// GENERATED by scripts/build-india-map.mjs — DO NOT EDIT BY HAND.\n` +
      `// Regenerate:  npm run map:build -w @rishwat/web\n` +
      `// Source: ${SOURCE_URL}\n` +
      `// Plain Mercator into a ${VIEW_WIDTH}-wide viewBox; coordinates rounded to ${DECIMALS} dp.\n\n` +
      `export interface IndiaStatePath {\n` +
      `  /** ISO 3166-2:IN suffix, e.g. "UP", "MH". */\n  code: string;\n` +
      `  name: string;\n` +
      `  /** SVG path data in the INDIA_VIEWBOX coordinate space. */\n  d: string;\n` +
      `  /** Visual centre in viewBox units, for labels and tooltip anchoring. */\n` +
      `  centroid: [number, number];\n}\n\n` +
      `export const INDIA_VIEWBOX = "0 0 ${VIEW_WIDTH} ${viewHeight}";\n\n` +
      `export const INDIA_STATES: IndiaStatePath[] = [\n${rows}\n];\n`;

    const scriptDir = fileURLToPath(new URL(".", import.meta.url));
    const outDir = join(scriptDir, "..", "src", "data");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "india-states.ts"), file);

    const bytes = Buffer.byteLength(file);
    console.log(`✓ wrote src/data/india-states.ts`);
    console.log(`  viewBox: 0 0 ${VIEW_WIDTH} ${viewHeight}`);
    console.log(`  states: ${states.length - utCount} + union territories: ${utCount} = ${states.length}`);
    console.log(`  size: ${bytes} bytes (${(bytes / 1024).toFixed(1)} KB)`);
    if (bytes > 140 * 1024) {
      throw new Error(`Output ${(bytes / 1024).toFixed(1)} KB exceeds the ~140 KB budget`);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
    console.log("✓ removed temp download");
  }
}

main().catch((error) => {
  console.error("✗ build-india-map failed:", error.message);
  process.exit(1);
});
