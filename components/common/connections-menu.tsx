"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { SiGithub, SiDiscord, SiPinterest, SiInstagram, SiSpotify, SiAnilist } from "react-icons/si";
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
  { name: "discord", label: "Discord", url: "https://discordapp.com/users/d.dsuryansh", icon: <SiDiscord size={20} /> },
  { name: "pinterest", label: "Pinterest", url: "https://pinterest.com/yourusername", icon: <SiPinterest size={20} /> },
  { name: "instagram", label: "Instagram", url: "https://instagram.com/hedgehog_glazer", icon: <SiInstagram size={20} /> },
  { name: "spotify", label: "Spotify", url: "https://open.spotify.com/user/314vp6s4axooafqfsu43k3tj55xm?si=97cdf9922a2e45b1", icon: <SiSpotify size={20} /> },
  { name: "anilist", label: "AniList", url: "https://anilist.co/user/Dsuryansh/", icon: <SiAnilist size={20} /> },
  { name: "serialized", label: "Serialized", url: "https://serializd.com/user/Dsuryansh", icon: <SerializdIcon size={20} /> },
  { name: "chaosprep", label: "ChaosPrep", url: "https://chaosprep.in/?invite=DOqpF9IcBDNG54K0NquqVRYtr5m2", icon: <ChaosPrepIcon size={20} /> },
];

export default function ConnectionsMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
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

          {isOpen && (
            <>
              {/* The Center Close Button */}
              <motion.button
                key="close-button"
                onClick={() => setIsOpen(false)}
                className="absolute flex items-center justify-center w-[52px] h-[52px] md:w-14 md:h-14 rounded-full bg-black text-white hover:bg-red-600 hover:text-white transition-colors duration-300 z-50"
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
              >
                <X size={24} />
              </motion.button>

              {/* The Social Icons */}
              {socials.map((social, i) => {
                // Skips the 0 position (center) for socials
                // i = 0,1,2,3 -> pos = -4, -3, -2, -1
                // i = 4,5,6,7,8 -> pos = 1, 2, 3, 4, 5
                const pos = i < 4 ? i - 4 : i - 3;
                const offset = pos * 65;
                const delay = Math.abs(pos) * 0.05;

                return (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute flex items-center justify-center w-[52px] h-[52px] md:w-14 md:h-14 rounded-full bg-white text-black hover:bg-[#0022FF] hover:text-white transition-colors duration-300 group"
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
  );
}
