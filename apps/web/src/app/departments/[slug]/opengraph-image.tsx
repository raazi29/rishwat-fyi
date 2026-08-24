import { ImageResponse } from "next/og";

import { MARK_DATA_URI } from "../../_brand/mark-data-uri";
import { getDepartment } from "@/lib/api";

export const alt = "Rishwat.fyi department — services and official sources";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FCFCFB";
const INK = "#14170F";
const INK_MUTED = "#6B7268";
const LINE = "#E4E6E0";
const OFFICIAL = "#0B3A20";

export default async function DepartmentOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let deptName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  try {
    const dept = await getDepartment(slug);
    if (dept) deptName = dept.data.name;
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
          <div style={{ display: "flex", fontSize: "16px", color: INK_MUTED }}>Department</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "64px", letterSpacing: "-1.8px", color: INK, lineHeight: 1.05 }}>
            {deptName}
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
            Official fees, timelines and documents — compared with what citizens reported experiencing.
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
          PUBLIC DATA · VERIFIED PROCESS · POWERED BY CITIZENS
        </div>
      </div>
    ),
    size,
  );
}
