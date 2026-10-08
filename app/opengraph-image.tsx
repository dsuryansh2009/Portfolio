import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "dsuryansh - AI Developer & Student Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          color: "white",
          background: "#050505",
          width: "100%",
          height: "100%",
          padding: "50px 200px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", color: "#84b897", fontSize: 100, fontWeight: "bold" }}>
          dsuryansh
        </div>
        <div style={{ display: "flex", color: "#a3a3a3", fontSize: 40, letterSpacing: "-0.02em" }}>
          AI Developer & Student Portfolio
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
