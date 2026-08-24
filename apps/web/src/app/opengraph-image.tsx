import { ImageResponse } from "next/og";

import { MARK_DATA_URI } from "./_brand/mark-data-uri";

/**
 * The share card. Same surface as the site: paper ground, official green for
 * the institutional voice, reported red used only as a data channel — the two
 * bars are the paired figure, never a decoration, and carry no numbers because
 * an invented figure on a share card would be exactly the thing this project
 * exists to stop.
 *
 * Deliberately typeset in `next/og`'s bundled font. Source Serif 4 lives in the
 * `next/font` cache, not on disk at a stable path, so using it here would mean
 * fetching a font over the network during `next build` — a build-time network
 * dependency that would break CI and Vercel builds behind a proxy.
 */
export const alt = "Rishwat.fyi — What should government cost you?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FCFCFB";
const INK = "#14170F";
const INK_SECONDARY = "#4A514A";
const INK_MUTED = "#6B7268";
const LINE = "#E4E6E0";
const OFFICIAL = "#0B3A20";
const REPORTED = "#A8201A";

/** One row of the paired-figure band: a named column label and its bar. */
function FigureBar({ label, width, color }: { label: string; width: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          width: "290px",
          fontSize: "17px",
          letterSpacing: "1.4px",
          color,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", width: `${width}px`, height: "14px", borderRadius: "7px", backgroundColor: color }} />
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: "64px 72px",
        }}
      >
        {/* Masthead: mark, wordmark, hairline, descriptor — the site header, flattened. */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders
              to a raster; next/image has no meaning inside an ImageResponse. */}
          <img src={MARK_DATA_URI} alt="" width={56} height={56} style={{ borderRadius: "13px" }} />
          <div
            style={{
              display: "flex",
              fontSize: "36px",
              letterSpacing: "-0.8px",
              color: OFFICIAL,
              marginLeft: "18px",
            }}
          >
            Rishwat.fyi
          </div>
          <div style={{ display: "flex", width: "1px", height: "34px", backgroundColor: LINE, margin: "0 20px" }} />
          <div style={{ display: "flex", fontSize: "19px", color: INK_MUTED }}>
            Public data. Open process. Powered by citizens.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "82px", letterSpacing: "-2.4px", color: INK }}>
            <div style={{ display: "flex" }}>What should&nbsp;</div>
            <div style={{ display: "flex", color: OFFICIAL }}>government</div>
          </div>
          <div style={{ display: "flex", fontSize: "82px", letterSpacing: "-2.4px", color: INK }}>
            cost you?
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "22px",
              maxWidth: "840px",
              fontSize: "27px",
              lineHeight: 1.45,
              color: INK_SECONDARY,
            }}
          >
            Search official fees and timelines. Compare them with what citizens actually experience.
          </div>
        </div>

        {/* The paired figure: official against reported, and the gap between. */}
        <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${LINE}`, paddingTop: "30px" }}>
          <FigureBar label="OFFICIAL" width={210} color={OFFICIAL} />
          <div style={{ display: "flex", height: "20px" }} />
          <FigureBar label="CITIZEN EXPERIENCE" width={470} color={REPORTED} />
        </div>
      </div>
    ),
    size,
  );
}
