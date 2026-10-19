"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { SiGithub, SiDiscord, SiSubstack, SiInstagram, SiSpotify, SiAnilist } from "react-icons/si";
import MagneticButton from "./magnetic-button";

const SerializdIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line
      x1="7.7"
      y1="16.3"
      x2="16.3"
      y2="7.7"
      stroke="currentColor"
      strokeWidth="5.1"
      strokeLinecap="round"
    />
  </svg>
);

const ChaosPrepIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="square">
    <path d="M 65 25 L 35 25 L 20 40 L 20 60 L 35 75 L 65 75" />
    <line x1="50" y1="12" x2="50" y2="40" />
    <line x1="50" y1="88" x2="50" y2="60" />
    <line x1="12" y1="50" x2="40" y2="50" />
    <line x1="88" y1="50" x2="60" y2="50" />
    <circle cx="50" cy="50" r="5" fill="currentColor" stroke="none" />
  </svg>
);

const socials = [
  { name: "github", label: "GitHub", url: "https://github.com/dsuryansh2009", icon: <SiGithub size={20} /> },
  { name: "discord", label: "Discord", url: "https://discord.com/users/973202333381038080", icon: <SiDiscord size={20} /> },
  { name: "substack", label: "Substack", url: "https://substack.com/@ilikehedgehogs", icon: <SiSubstack size={20} /> },
  { name: "instagram", label: "Instagram", url: "https://instagram.com/hedgehog_glazer", icon: <SiInstagram size={20} /> },
  { name: "spotify", label: "Spotify", url: "https://open.spotify.com/user/314vp6s4axooafqfsu43k3tj55xm?si=97cdf9922a2e45b1", icon: <SiSpotify size={20} /> },
  { name: "anilist", label: "AniList", url: "https://anilist.co/user/Dsuryansh/", icon: <SiAnilist size={20} /> },
  { name: "serialized", label: "Serialized", url: "https://serializd.com/user/Dsuryansh", icon: <SerializdIcon size={20} /> },
  { name: "chaosprep", label: "ChaosPrep", url: "https://chaosprep.in/?invite=DOqpF9IcBDNG54K0NquqVRYtr5m2", icon: <ChaosPrepIcon size={20} /> },
];

export default function ConnectionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const itemSpacing = 65;

  return (
    <>
      <div className="relative flex items-center justify-center h-[120px] w-full max-w-5xl mx-auto">
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                key="button"
                className="absolute z-50"
                initial={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.1, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <MagneticButton onClick={() => setIsOpen(true)}>
                  Connections
                </MagneticButton>
              </motion.div>
            )}

            {isOpen && !isMobile && (
              <>
                {/* Desktop: horizontal spread */}
                {/* The Center Close Button */}
                <motion.button
                  key="close-button"
                  onClick={() => setIsOpen(false)}
                  className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-black text-white hover:bg-red-600 hover:text-white transition-colors duration-300 z-50"
                  initial={{ x: 0, scale: 0 }}
                  animate={{ x: 0, scale: 1 }}
                  exit={{ x: 0, scale: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 18,
                    mass: 0.8,
                    delay: 0,
                  }}
                  aria-label="Close connections menu"
                >
                  <X size={24} />
                </motion.button>

                {/* The Social Icons */}
                {socials.map((social, i) => {
                  const pos = i < 4 ? i - 4 : i - 3;
                  const offset = pos * itemSpacing;
                  const delay = Math.abs(pos) * 0.05;

                  return (
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-white text-black hover:bg-[#0022FF] hover:text-white transition-colors duration-300 group"
                      initial={{ x: 0, scale: 0 }}
                      animate={{ x: offset, scale: 1 }}
                      exit={{ x: 0, scale: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 18,
                        mass: 0.8,
                        delay: delay,
                      }}
                    >
                      {social.icon}

                      {/* Tooltip */}
                      <span className="absolute -top-14 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-neutral-900 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap pointer-events-none flex items-center gap-1 shadow-xl origin-bottom">
                        {social.label} <ArrowUpRight size={12} className="opacity-60" strokeWidth={2} />
                      </span>
                    </motion.a>
                  );
                })}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Modal via Portal to avoid clipping/transform/stacking issues */}
      {mounted && isMobile && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
              {/* Dimmed backdrop */}
              <motion.div
                key="mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto cursor-pointer"
              />

              {/* Elevated Floating Card - perfectly centered */}
              <motion.div
                key="mobile-card"
                initial={{ scale: 0.92, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="relative pointer-events-auto w-full max-w-[340px] bg-[#121614]/95 border border-white/15 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col gap-5 text-white z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#84b897] animate-pulse" />
                    <span className="text-xs font-semibold tracking-widest uppercase text-white/90">
                      Connections
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                    aria-label="Close connections menu"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* 4x2 Grid of Socials */}
                <div className="grid grid-cols-4 gap-y-4 gap-x-2 w-full place-items-center">
                  {socials.map((social, i) => (
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1.5 group p-1 w-full max-w-[68px]"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 24,
                        delay: i * 0.03,
                      }}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-black group-hover:bg-[#0022FF] group-hover:text-white group-active:scale-95 group-active:bg-[#0022FF] group-active:text-white transition-all duration-200 shadow-md">
                        {social.icon}
                      </div>
                      <span className="text-[11px] font-medium text-white/70 group-hover:text-white transition-colors tracking-tight text-center truncate w-full">
                        {social.label}
                      </span>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
