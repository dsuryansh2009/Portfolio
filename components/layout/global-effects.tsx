"use client";

import { usePathname } from "next/navigation";
import Hairline from "@/components/common/hairline-loader";
import DotCursor from "@/components/common/dot-cursor";

export default function GlobalEffects() {
  const pathname = usePathname();
  const isBlog = pathname === "/blog" || pathname.startsWith("/admin");

  return (
    <div style={{ display: isBlog ? "none" : "block" }}>
      <Hairline
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          width: "100vw",
          height: "100vh",
          minWidth: 0,
          minHeight: 0,
        }}
      />
      <DotCursor
        trailColor="#FF2D8D"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />
    </div>
  );
}
