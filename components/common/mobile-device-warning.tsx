"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, X } from "lucide-react";

export default function MobileDeviceWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in this session
    try {
      const hasDismissed = sessionStorage.getItem("mobile_notice_dismissed");
      if (hasDismissed) return;
    } catch {
      // Ignore storage errors if private mode disables sessionStorage
    }

    // Only show on mobile phones (< 768px), not on desktops or tablets
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsVisible(isMobile);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("mobile_notice_dismissed", "true");
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-4 inset-x-4 z-[999999] pointer-events-auto max-w-md mx-auto"
          role="alert"
          aria-live="polite"
        >
          <div className="relative overflow-hidden rounded-2xl bg-black/90 border border-white/10 p-4 shadow-2xl backdrop-blur-xl text-white">
            {/* Ambient subtle glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#84b897]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-start gap-3.5">
              <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl bg-white/5 border border-white/10 text-white/80">
                <Monitor size={18} />
              </div>

              <div className="flex-1 pr-6">
                <h3 className="text-sm font-medium tracking-tight text-white">
                  Desktop or tablet recommended
                </h3>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  The mobile version of this website is currently not optimized. For the intended experience, you should open this on a desktop or tab.
                </p>

                <div className="mt-2.5 pt-2.5 border-t border-white/[0.08]">
                  <p className="text-[11px] text-white/50 italic leading-relaxed">
                    <span className="text-white/70 not-italic font-medium">Note from me:</span> &ldquo;bhayi/ben mobile chiz hi bekar hai sry mai nahi bana raha iske liye&rdquo;
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleDismiss}
                    className="text-xs font-medium text-white/80 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    Continue anyway
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="absolute top-0 right-0 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                aria-label="Dismiss notice"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
