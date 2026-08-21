import { ImageResponse } from "next/og";

/**
 * The home-screen icon. Safari ignores SVG touch icons, so this renders the
 * same mark as `icon.svg` as a PNG. No text and therefore no font: `next/og`
 * would otherwise need a font file, and fetching one at build time would make
 * the build depend on the network.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          // Apple applies its own corner mask, so the tile is a full bleed.
          backgroundColor: "#0B3A20",
          padding: "0 39px",
        }}
      >
        {/* Official figure: the shorter bar. */}
        <div style={{ width: "62px", height: "20px", borderRadius: "10px", backgroundColor: "#FCFCFB" }} />
        <div style={{ height: "34px" }} />
        {/* Citizen-reported figure: longer, in the reported red. */}
        <div style={{ width: "102px", height: "20px", borderRadius: "10px", backgroundColor: "#E8776A" }} />
      </div>
    ),
    size,
  );
}
