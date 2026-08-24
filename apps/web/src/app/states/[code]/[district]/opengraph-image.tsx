import { ImageResponse } from "next/og";

import { MARK_DATA_URI } from "../../../_brand/mark-data-uri";
import { getStateDetail, listDistricts } from "@/lib/api";

export const alt = "Rishwat.fyi district — government-service gaps in this district";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FCFCFB";
const INK = "#14170F";
const INK_MUTED = "#6B7268";
const LINE = "#E4E6E0";
const OFFICIAL = "#0B3A20";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}
function deslugify(slug: string): string {
  return slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export default async function DistrictOpengraphImage({ params }: { params: Promise<{ code: string; district: string }> }) {
  const { code, district: districtSlug } = await params;
  let stateName = code;
  let districtName = deslugify(districtSlug);
  try {
    const [stateDetail, districts] = await Promise.all([getStateDetail(code), listDistricts(code)]);
    if (stateDetail) stateName = stateDetail.data.state.name;
    const found = districts.data.find((d) => slugify(d.name) === districtSlug.toLowerCase());
    if (found) districtName = found.name;
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
          <div style={{ display: "flex", fontSize: "16px", color: INK_MUTED }}>
            {stateName} · {districtName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "56px", letterSpacing: "-1.6px", color: INK, lineHeight: 1.05 }}>
            {districtName}
          </div>
          <div style={{ display: "flex", fontSize: "26px", color: INK_MUTED, marginTop: "6px" }}>{stateName}, India</div>
          <div
            style={{
              display: "flex",
              marginTop: "14px",
              fontSize: "20px",
              lineHeight: 1.4,
              color: "#4A514A",
              maxWidth: "760px",
            }}
          >
            Official fees vs what citizens reported in {districtName}.
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
