"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface MinecraftAchievementProps {
  show: boolean;
  onDone?: () => void;
}

export default function MinecraftAchievement({
  show,
  onDone,
}: MinecraftAchievementProps) {
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!show) return;

    setAnimOut(false);
    setVisible(true);

    // Play sound
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sfx/minecraft-achievement.mp3");
        audioRef.current.volume = 0.7;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (_) {}

    // Auto-dismiss after 4.5 s
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAnimOut(true);
      setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 600);
    }, 4500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes mc-slide-in {
          from { transform: translateX(calc(100% + 32px)); opacity: 0; }
          to   { transform: translateX(0);                opacity: 1; }
        }
        @keyframes mc-slide-out {
          from { transform: translateX(0);                opacity: 1; }
          to   { transform: translateX(calc(100% + 32px)); opacity: 0; }
        }
        .mc-toast-in  { animation: mc-slide-in  0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .mc-toast-out { animation: mc-slide-out 0.50s cubic-bezier(0.55, 0, 1, 0.45) forwards; }
      `}</style>

      <div
        className={`fixed top-6 right-6 z-[9999] pointer-events-none select-none ${
          animOut ? "mc-toast-out" : "mc-toast-in"
        }`}
        style={{ imageRendering: "pixelated" }}
      >
        <Image
          src="/sfx/achievement.png"
          alt="Achievement Made! U crush on me right???"
          width={320}
          height={70}
          style={{
            imageRendering: "pixelated",
            width: "auto",
            height: "auto",
            maxWidth: "min(320px, calc(100vw - 48px))",
          }}
          priority
          unoptimized
        />
      </div>
    </>
  );
}
