import { ImageResponse } from "next/og";

import { MARK_DATA_URI } from "../../_brand/mark-data-uri";
import { getStateDetail } from "@/lib/api";

export const alt = "Rishwat.fyi state — government-service gaps in this state";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FCFCFB";
const INK = "#14170F";
const INK_MUTED = "#6B7268";
const LINE = "#E4E6E0";
const OFFICIAL = "#0B3A20";

export default async function StateOpengraphImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let stateName = code;
  try {
    const detail = await getStateDetail(code);
    if (detail) stateName = detail.data.state.name;
  } catch {
    // fallback
  }

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
          padding: "56px 64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og raster */}
          <img src={MARK_DATA_URI} alt="" width={48} height={48} style={{ borderRadius: "12px" }} />
          <div style={{ display: "flex", fontSize: "30px", letterSpacing: "-0.6px", color: OFFICIAL, marginLeft: "16px" }}>
            Rishwat.fyi
          </div>
          <div style={{ display: "flex", width: "1px", height: "28px", backgroundColor: LINE, margin: "0 18px" }} />
          <div style={{ display: "flex", fontSize: "16px", color: INK_MUTED }}>States · India</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "68px", letterSpacing: "-1.8px", color: INK, lineHeight: 1.05 }}>
            {stateName}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "14px",
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#4A514A",
              maxWidth: "760px",
            }}
          >
            How official government fees compare with what citizens reported in {stateName}.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${LINE}`,
            paddingTop: "22px",
            fontSize: "14px",
            letterSpacing: "1.2px",
            color: INK_MUTED,
          }}
        >
          GOVERNMENT, AS EXPERIENCED BY CITIZENS
        </div>
      </div>
    ),
    size,
  );
}
