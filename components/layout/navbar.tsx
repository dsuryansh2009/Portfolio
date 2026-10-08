"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
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
        e.preventDefault();
        
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            const scrollAmount = window.innerHeight;
            if (e.key === 'ArrowDown') {
                mainContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            } else {
                mainContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
            }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <nav className="fixed top-0 left-0 w-full z-[9999] flex justify-center py-8 px-8 pointer-events-none">
        <ul className={`flex items-center gap-6 md:gap-12 pointer-events-auto ${pathname === "/blog" ? "hidden" : ""}`}>
          {sections.map((section) => (
            <li key={section.name}>
              <Link
                href={section.href}
                className="text-white/50 hover:text-white transition-colors duration-300 text-xs md:text-sm tracking-[0.2em] uppercase font-medium"
              >
                {section.name}
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Transparent Music Player Controls */}
        <div className={`fixed z-[9999] flex items-center gap-8 py-2 pointer-events-auto ${pathname === "/blog" ? "bottom-8 right-8" : "bottom-8 left-1/2 -translate-x-1/2"}`}>
          
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
            className="text-white/50 hover:text-white transition-colors duration-300"
            aria-label="Previous Track"
          >
            <SkipBack size={18} strokeWidth={1.5} />
          </button>
          
          <button 
            onClick={toggleMusic}
            className="flex items-center justify-center w-8 h-8 text-white/50 hover:text-white transition-colors duration-300"
            aria-label="Toggle Music"
          >
            {isPlaying ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} className="ml-0.5" />}
          </button>

          <button 
            id="next-track-btn"
            onClick={handleNext}
            className="text-white/50 hover:text-white transition-colors duration-300"
            aria-label="Next Track"
          >
            <SkipForward size={18} strokeWidth={1.5} />
          </button>
        </div>
      </nav>
    </>
  );
}
