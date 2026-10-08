"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function MagneticButton({ children, href, onClick, className = "" }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    // Move 30% of the distance from the center to the cursor
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const content = (
    <motion.div
      className={`relative rounded-full px-8 py-4 text-[15px] font-semibold tracking-wide text-black bg-white transition-colors duration-300 hover:bg-[#0022FF] hover:text-white flex items-center justify-center cursor-pointer shadow-lg ${className}`}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className="relative p-8 inline-block" // Extra padding increases the magnetic catch area
    >
      {href ? (
        <Link href={href} onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button onClick={onClick} className="outline-none focus:outline-none">
          {content}
        </button>
      )}
    </div>
  );
}
