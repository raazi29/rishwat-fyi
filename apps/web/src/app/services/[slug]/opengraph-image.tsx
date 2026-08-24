import { ImageResponse } from "next/og";

import { MARK_DATA_URI } from "../../_brand/mark-data-uri";
import { getServiceDetail } from "@/lib/api";

export const alt = "Rishwat.fyi service — official vs citizen-reported comparison";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FCFCFB";
const INK = "#14170F";
const INK_MUTED = "#6B7268";
const LINE = "#E4E6E0";
const OFFICIAL = "#0B3A20";
const REPORTED = "#A8201A";

export default async function ServiceOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let serviceName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let department = "Government service";
  try {
    const detail = await getServiceDetail(slug);
    if (detail) {
      serviceName = detail.data.service.name;
      department = detail.data.service.department;
    }
  } catch {
    // fallback to slug
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
          <div style={{ display: "flex", fontSize: "16px", color: INK_MUTED }}>{department}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "62px", letterSpacing: "-1.8px", color: INK, lineHeight: 1.05 }}>
            {serviceName}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "14px",
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#4A514A",
            }}
          >
            Official fee vs what citizens reported — open, anonymised public data.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${LINE}`, paddingTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: "220px", fontSize: "14px", letterSpacing: "1.2px", color: OFFICIAL }}>
              OFFICIAL
            </div>
            <div style={{ display: "flex", width: "180px", height: "12px", borderRadius: "6px", backgroundColor: OFFICIAL }} />
          </div>
          <div style={{ display: "flex", height: "14px" }} />
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: "220px", fontSize: "14px", letterSpacing: "1.2px", color: REPORTED }}>
              CITIZEN EXPERIENCE
            </div>
            <div style={{ display: "flex", width: "360px", height: "12px", borderRadius: "6px", backgroundColor: REPORTED }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
