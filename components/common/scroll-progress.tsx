"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress, scrollY } = useScroll();
  
  // Smooth out the progress bar movement
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Hide the progress bar at the very top of the page (e.g. intro screen)
  const opacity = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] md:h-[3px] bg-white origin-left z-[9999]"
      style={{ scaleX, opacity }}
    />
  );
}
