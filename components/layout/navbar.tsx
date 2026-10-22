"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

const PLAYLIST = [
  "/audio/Ariana Grande.mp3",
  "/audio/Banjaare.mp3",
  "/audio/coffee or tea.mp3",
  "/audio/The Police.mp3"
];

export default function Navbar() {
  const sections = [
    { name: "Home", href: "/#home" },
    { name: "About", href: "/#about" },
    { name: "Projects", href: "/#projects" },
    { name: "Gallery", href: "/#gallery" },
    { name: "Blog", href: "/blog" },
    { name: "Extras", href: "/#extras" }
  ];

  const pathname = usePathname();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Floating particles state
  const particleIdCounter = useRef(0);
  const [particles, setParticles] = useState<{ 
    id: number; 
    text: string; 
    xDist: string; 
    yPeak: string; 
    yEnd: string; 
    rot: string 
  }[]>([]);

  const spawnParticleForTrack = (index: number, forcedDir?: number) => {
    const text = PLAYLIST[index].replace("/audio/", "").replace(".mp3", "").replace(/%20/g, " ");
    const id = particleIdCounter.current++;
    
    // Generate random projectile parameters
    const dir = forcedDir !== undefined ? forcedDir : (Math.random() > 0.5 ? 1 : -1);
    const xDist = (250 + Math.random() * 200) * dir; // Much wider horizontal range
    const yPeak = -40 - Math.random() * 40;          // Lower vertical peak
    const yEnd = 40 + Math.random() * 60;            // Fall distance
    
    setParticles((prev) => [...prev, { 
      id, 
      text, 
      xDist: `${xDist}px`, 
      yPeak: `${yPeak}px`, 
      yEnd: `${yEnd}px`, 
      rot: `0deg` // Disabled rotation for readability
    }]);
    
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 3500); // 3.5 second lifetime for readability
  };

  useEffect(() => {
    // Create the audio object ONLY ONCE on mount
    const audio = new Audio();
    audio.src = PLAYLIST[0]; // Set initial track
    audioRef.current = audio;
    
    const handleEnded = () => {
      document.getElementById('next-track-btn')?.click();
    };
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
      delete (window as any).__globalAudioAnalyser;
      delete (window as any).__globalAudioDataArray;
    };
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (!analyserRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.8;
          
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          
          analyserRef.current = analyser;
          (window as any).__globalAudioAnalyser = analyser;
          (window as any).__globalAudioDataArray = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) {
          console.error("AudioContext setup failed:", e);
        }
      }

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (analyserRef.current && analyserRef.current.context.state === 'suspended') {
          (analyserRef.current.context as AudioContext).resume();
        }
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        // When pressing play, pop in a random direction or default right
        spawnParticleForTrack(currentTrackIndex);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = PLAYLIST[nextIdx];
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error(e));
        spawnParticleForTrack(nextIdx, 1); // 1 = force throw right
      }
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prevIdx);
    if (audioRef.current) {
      audioRef.current.src = PLAYLIST[prevIdx];
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error(e));
        spawnParticleForTrack(prevIdx, -1); // -1 = force throw left
      }
    }
  };

  const handlersRef = useRef({ toggleMusic, handleNext, handlePrev });
  useEffect(() => {
    handlersRef.current = { toggleMusic, handleNext, handlePrev };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); // Prevent page scrolling
        handlersRef.current.toggleMusic();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlersRef.current.handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlersRef.current.handlePrev();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const extrasEl = document.getElementById('extras');
        if (extrasEl) {
          e.preventDefault();
          extrasEl.scrollBy({ 
            top: e.key === 'ArrowDown' ? 300 : -300, 
            behavior: 'smooth' 
          });
          return;
        }
        e.preventDefault();
        const scrollAmount = window.innerHeight;
        window.scrollBy({ 
          top: e.key === 'ArrowDown' ? scrollAmount : -scrollAmount, 
          behavior: 'smooth' 
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [homeTarget, setHomeTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (pathname === "/blog") {
      setHomeTarget(null);
      return;
    }
    const updateTarget = () => {
      const el = document.getElementById("home-music-controls");
      if (el) {
        setHomeTarget(el);
        return true;
      }
      return false;
    };
    if (updateTarget()) return;
    const interval = setInterval(() => {
      if (updateTarget()) {
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [pathname]);

  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Only apply scroll-direction visibility on the main page where links are displayed
    if (pathname !== "/") {
      setIsVisible(true);
      return;
    }

    // Set initial position
    lastScrollY.current = window.scrollY;
    setIsAtTop(window.scrollY <= 20);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY.current;

          if (currentScrollY <= 20) {
            setIsAtTop(true);
            setIsVisible(true);
          } else {
            setIsAtTop(false);

            // Ignore overscroll bouncing at bottom of page
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (currentScrollY > maxScroll) {
              ticking = false;
              return;
            }

            // Require meaningful scroll delta to avoid jitter
            if (Math.abs(diff) > 6) {
              if (diff > 0) {
                // Scrolling down -> hide navbar
                setIsVisible(false);
              } else {
                // Scrolling up -> show navbar
                setIsVisible(true);
              }
            }
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <>
      <style>{`
        @keyframes float-x {
          0% {
            transform: translateX(-50%) scale(0.5);
            animation-timing-function: cubic-bezier(0.1, 1, 0.3, 1); /* shoots fast, then slowly drifts */
          }
          100% {
            transform: translateX(calc(-50% + var(--x-dist))) scale(0.95);
          }
        }

        @keyframes float-y {
          0% {
            transform: translateY(0px);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1); /* ease-out up to peak */
          }
          30% {
            transform: translateY(var(--y-peak));
            animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.2); /* ease-in falling down */
          }
          100% {
            transform: translateY(var(--y-end));
          }
        }

        @keyframes fade-blur {
          0% { opacity: 0; filter: blur(4px); }
          5% { opacity: 1; filter: blur(0px); }
          75% { opacity: 1; filter: blur(0px); }
          100% { opacity: 0; filter: blur(6px); }
        }
      `}</style>

      {/* Top Navbar Header */}
      <header
        className={`fixed top-0 left-0 w-full z-[9999] flex justify-center py-6 md:py-8 px-4 md:px-8 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <ul
          className={`flex items-center gap-6 md:gap-12 pointer-events-auto flex-wrap justify-center transition-all duration-300 ${
            isAtTop
              ? "bg-transparent border border-transparent py-1 px-2"
              : "bg-black/60 backdrop-blur-md border border-white/10 py-2.5 px-6 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          } ${pathname === "/blog" ? "hidden" : ""}`}
        >
          {sections.map((section) => (
            <li key={section.name}>
              <Link
                href={section.href}
                className="text-white/50 hover:text-white transition-colors duration-300 text-xs md:text-sm tracking-[0.2em] uppercase font-medium whitespace-nowrap"
              >
                {section.name}
              </Link>
            </li>
          ))}
        </ul>
      </header>
        
      {/* Transparent Music Player Controls */}
      {(() => {
        const controls = (
          <div
            className={
              pathname === "/blog"
                ? "fixed z-[9999] flex items-center gap-8 py-2 pointer-events-auto pb-safe bottom-8 right-8"
                : "relative flex items-center gap-8 py-2 pointer-events-auto"
            }
          >
            {/* Floating Track Name Particles */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute left-1/2 top-1/2 pointer-events-none z-[9999]"
                style={{ 
                  animation: "float-x 3.5s forwards, fade-blur 3.5s linear forwards",
                  "--x-dist": p.xDist,
                } as React.CSSProperties}
              >
                <div 
                  className="text-white font-medium text-[11px] tracking-widest uppercase"
                  style={{
                    animation: "float-y 3.5s forwards",
                    textShadow: "0px 2px 12px rgba(0,0,0,0.9)",
                    "--y-peak": p.yPeak,
                    "--y-end": p.yEnd,
                  } as React.CSSProperties}
                >
                  {p.text}
                </div>
              </div>
            ))}

            <button 
              onClick={handlePrev}
              className="text-white/50 hover:text-white transition-colors duration-300 p-2.5 -m-2.5 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Previous Track"
            >
              <SkipBack size={18} strokeWidth={1.5} />
            </button>
            
            <button 
              onClick={toggleMusic}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white/50 hover:text-white transition-colors duration-300 touch-manipulation cursor-pointer"
              aria-label="Toggle Music"
            >
              {isPlaying ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} className="ml-0.5" />}
            </button>

            <button 
              id="next-track-btn"
              onClick={handleNext}
              className="text-white/50 hover:text-white transition-colors duration-300 p-2.5 -m-2.5 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Next Track"
            >
              <SkipForward size={18} strokeWidth={1.5} />
            </button>
          </div>
        );

        if (pathname === "/blog") {
          return controls;
        }

        if (homeTarget) {
          return createPortal(controls, homeTarget);
        }

        return null;
      })()}
    </>
  );
}
