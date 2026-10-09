"use client";

import { motion } from "framer-motion";

export default function InkBleed({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className="relative group/bleed">
      {/* SVG Filter for genuine ink bleed effect */}
      <svg className="hidden">
        <defs>
          <filter id="ink-bleed-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="0.5" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <div 
        className={className} 
        style={{ 
          filter: "url(#ink-bleed-filter)",
          transition: "filter 0.5s ease-in-out"
        }}
      >
        {children}
      </div>
    </div>
  );
}
