"use client";

import { usePathname } from "next/navigation";
import Hairline from "@/components/common/hairline-loader";
import DotCursor from "@/components/common/dot-cursor";
import { useEffect, useState } from "react";

export default function GlobalEffects() {
  const pathname = usePathname();
  const isBlog = pathname === "/blog" || pathname.startsWith("/admin");
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    setHasFinePointer(window.matchMedia("(pointer: fine)").matches);
  }, []);

  if (isBlog) return null;

  return (
    <div>
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
      {hasFinePointer && (
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
      )}
    </div>
  );
}
