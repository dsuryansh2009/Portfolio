"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Pen, ArrowUp, Mail } from "lucide-react";
import SparkleButton from "@/components/common/sparkle-button";
import MosaicLens from "@/components/common/mosaic-lens";
import IOSMessageList from "@/components/common/ios-message-list";
import PredictiveArcHorizon from "@/components/common/predictive-arc-horizon";
import Navbar from "@/components/layout/navbar";
import ConnectionsMenu from "@/components/common/connections-menu";
import BlockTextReveal from "@/components/common/block-text-reveal";
import MusicWidget from "@/components/common/music-widget";
import DiscordWidget from "@/components/common/discord-widget";
import HoverImageReveal from "@/components/common/hover-image-reveal";
import FlipGallery from "@/components/common/flip-gallery";
import ProjectsShowcase from "@/components/common/projects-showcase";
import MinecraftAchievement from "@/components/common/minecraft-achievement";
import ScrollProgress from "@/components/common/scroll-progress";
import { useLenis } from "lenis/react";
import { CommunityScribbles } from "@/components/blog/community-scribbles";
import { LeaveScribble } from "@/components/blog/leave-scribble";
import OverscrollContainer from "@/components/common/overscroll-container";

let hasPlayedIntro = false;

export default function PortfolioClient({ 
  initialActiveFolder = null,
  initialFolders = [],
  initialAboutContent = "",
  initialScribbles = [],
  initialProjects = []
}: { 
  initialActiveFolder?: string | null;
  initialFolders?: any[];
  initialAboutContent?: string;
  initialScribbles?: any[];
  initialProjects?: any[];
}) {
  const [introStep, setIntroStep] = useState<"intro" | "chat" | "finished">(() => {
    if (hasPlayedIntro) return "finished";
    if (initialActiveFolder) return "finished";
    if (typeof window !== "undefined" && window.location.hash && window.location.hash !== "#home") return "finished";
    return "intro";
  });
  const [isIntroFadingOut, setIsIntroFadingOut] = useState(false);
  const [isChatFinished, setIsChatFinished] = useState(() => hasPlayedIntro || !!initialActiveFolder || (typeof window !== "undefined" && !!window.location.hash && window.location.hash !== "#home"));
  const [isFullyBlack, setIsFullyBlack] = useState(() => hasPlayedIntro || !!initialActiveFolder || (typeof window !== "undefined" && !!window.location.hash && window.location.hash !== "#home"));
  const [activeFolder, setActiveFolder] = useState<string | null>(initialActiveFolder);
  const [folders, setFolders] = useState<any[]>(initialFolders);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [aboutContent, setAboutContent] = useState<string>(initialAboutContent);
  const [featuredScribbles, setFeaturedScribbles] = useState<any[]>(initialScribbles);
  const [showExtras, setShowExtras] = useState(false);
  const [isScribbleOpen, setIsScribbleOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMcAchievement, setShowMcAchievement] = useState(false);
  const mcAchievementShownRef = useRef(false);
  const lenis = useLenis();
  const footerRef = useRef<HTMLElement>(null);
  const footerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetFooterTimer = useCallback(() => {
    if (footerTimerRef.current) {
      clearTimeout(footerTimerRef.current);
      footerTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isFullyBlack || activeFolder || showExtras) {
      resetFooterTimer();
      return;
    }

    const footerEl = footerRef.current;
    if (!footerEl) return;

    const startTimer = () => {
      resetFooterTimer();
      footerTimerRef.current = setTimeout(() => {
        if (lenis) {
          lenis.scrollTo("#gallery", { duration: 1.4 });
        } else {
          const galleryEl = document.getElementById("gallery");
          if (galleryEl) {
            galleryEl.scrollIntoView({ behavior: "smooth" });
          }
        }
      }, 5000);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          startTimer();
        } else {
          resetFooterTimer();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(footerEl);

    return () => {
      observer.disconnect();
      resetFooterTimer();
    };
  }, [isFullyBlack, activeFolder, showExtras, lenis, resetFooterTimer]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);


  useEffect(() => {
    if (initialActiveFolder || (typeof window !== "undefined" && window.location.hash && window.location.hash !== "#home")) {
      hasPlayedIntro = true;
      setIsChatFinished(true);
      setIsFullyBlack(true);
      setIntroStep("finished");
    }
    
    const handleHashChange = () => {
      const hash = window.location.hash;
      setShowExtras(hash === '#extras');
      if (hash && hash !== '#home') {
        hasPlayedIntro = true;
        setIsChatFinished(true);
        setIsFullyBlack(true);
        setIntroStep("finished");
      }
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (target?.hash) {
        if (target.hash === '#extras') {
          setShowExtras(true);
        } else {
          setShowExtras(false);
        }
        if (target.hash !== '#home') {
          hasPlayedIntro = true;
          setIsChatFinished(true);
          setIsFullyBlack(true);
          setIntroStep("finished");
        }
      }
    };
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [initialActiveFolder]);

  useEffect(() => {
    if (showExtras) {
      if (lenis) lenis.stop();
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else if (introStep === "finished") {
      if (lenis) lenis.start();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showExtras, lenis, introStep]);

  useEffect(() => {
    if (!showExtras) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isScribbleOpen) {
        window.history.pushState({}, '', '/');
        setShowExtras(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showExtras, isScribbleOpen]);

  const introStepRef = useRef(introStep);
  useEffect(() => {
    introStepRef.current = introStep;
  }, [introStep]);

  const isOpeningChatRef = useRef(false);

  const openChat = useCallback(() => {
    if (introStepRef.current !== "intro" || isOpeningChatRef.current) return;
    isOpeningChatRef.current = true;
    setIntroStep("chat");
  }, []);

  const completeIntro = useCallback(() => {
    if (hasPlayedIntro || introStepRef.current === "finished") return;
    setIsIntroFadingOut(true);
    setTimeout(() => {
      setIsChatFinished(true);
      setIsFullyBlack(true);
      setIntroStep("finished");
      hasPlayedIntro = true;
      setIsIntroFadingOut(false);
      if (lenis) lenis.start();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }, 700);
  }, [lenis]);

  const handleChatComplete = useCallback(() => {
    setTimeout(completeIntro, 1200);
  }, [completeIntro]);

  // Safety fallback: if chat animation doesn't complete within 7 seconds, complete intro automatically
  useEffect(() => {
    if (introStep === "chat") {
      const timer = setTimeout(() => {
        completeIntro();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [introStep, completeIntro]);

  // Lock scrolling & handle gestures during intro and unscrollable chat
  useEffect(() => {
    if (introStep === "finished") {
      if (lenis) lenis.start();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      return;
    }

    // Strictly lock scrolling during intro and chat
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    if (typeof window !== "undefined" && window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }

    const handleWheel = (e: WheelEvent) => {
      if (introStepRef.current === "intro") {
        if (e.deltaY > 0) {
          e.preventDefault();
          openChat();
        }
      } else if (introStepRef.current === "chat") {
        // Chat section is strictly unscrollable
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (introStepRef.current === "intro") {
        const touchY = e.touches[0].clientY;
        const diffY = touchStartY - touchY;
        if (diffY > 15) {
          if (e.cancelable) e.preventDefault();
          openChat();
        }
      } else if (introStepRef.current === "chat") {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (introStepRef.current === "intro") {
        if (["ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) {
          e.preventDefault();
          openChat();
        }
      } else if (introStepRef.current === "chat") {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(e.key)) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      if (lenis) lenis.start();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [introStep, lenis, openChat]);

  return (
    <main className="w-full bg-[#0A0710] overflow-x-hidden">
      <h1 className="sr-only">dsuryansh</h1>

      {isFullyBlack && (
        <>
          <ScrollProgress />
          <Navbar />
        </>
      )}

      {/* Intro & Chat Fullscreen Sequence Overlay */}
      {introStep !== "finished" && (
        <div 
          className={`fixed inset-0 z-40 overflow-hidden select-none transition-opacity duration-700 ${
            isIntroFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* MosaicLens Background */}
          <MosaicLens
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              minWidth: 0,
              minHeight: 0,
              zIndex: 0,
            }}
          />

          {/* Sliding Viewport: 200% height, shifts -50% to open chat full-page automatically */}
          <div
            className="relative z-10 w-full h-[200%] flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{
              transform: introStep === "chat" ? "translateY(-50%)" : "translateY(0%)"
            }}
          >
            {/* Step 1: Intro Screen (100% of viewport) */}
            <div className="w-full h-1/2 flex flex-col items-center justify-center relative">
              <h2 className="sr-only">Introduction</h2>
              <SparkleButton />
              <button 
                onClick={openChat}
                className="absolute bottom-10 animate-bounce text-white/50 hover:text-white transition-colors cursor-pointer p-3 z-20 focus:outline-none"
                aria-label="Open chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>

            {/* Step 2: Full-page Unscrollable Chat Screen (100% of viewport) */}
            <div className="w-full h-1/2 flex flex-col items-center justify-center p-4 sm:p-8 relative">
              <h2 className="sr-only">Chat</h2>
              <div className="w-full max-w-3xl h-[500px] sm:h-[600px] flex flex-col justify-end">
                <IOSMessageList 
                  startImmediately={introStep === "chat"} 
                  onComplete={handleChatComplete} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overscroll Container: allows scrolling further than boundary and smoothly glides back to rest without bounce */}
      <OverscrollContainer disabled={!isFullyBlack || showExtras || !!activeFolder}>
        {/* Main Home Section */}
        <section 
          id="home"
        className="relative z-10 flex h-screen w-full items-center justify-center p-4 sm:p-8 bg-black"
      >
        <h2 className="sr-only">Home</h2>
        
        {(isFullyBlack || isIntroFadingOut) && (
          <>
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-[1000] flex flex-col md:flex-row items-center gap-4 scale-[0.8] origin-bottom">
              <MusicWidget />
              <DiscordWidget />
            </div>
            <div className="absolute inset-x-0 bottom-12 flex justify-center z-[1010] pointer-events-none">
              <div className="pointer-events-auto">
                <ConnectionsMenu />
              </div>
            </div>
            <div id="home-music-controls" className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1010] flex items-center justify-center pointer-events-auto" />
            <PredictiveArcHorizon
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: -1,
              }}
            />
          </>
        )}
      </section>

      {/* About Section */}
      {isFullyBlack && (
        <section id="about" className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center bg-[#050505] px-5 sm:px-8 md:px-24 py-24">
          <h2 className="sr-only">About Me</h2>
          <div className="w-full max-w-5xl mx-auto">
            <BlockTextReveal 
              text={aboutContent}
              font={{
                fontSize: "clamp(16px, 4.5vw, 28px)",
                textAlign: "left",
                fontFamily: "Inter",
                fontWeight: 500,
                lineHeight: "1.6em",
                letterSpacing: "-0.02em"
              }}
              textColor="#a3a3a3"
              blockColor="#1a1a1a"
              highlight={[
                {
                  text: "dsuryansh",
                  block: true,
                  color: "#84b897",
                  rounded: 8,
                  textColor: "#000000"
                },
                {
                  text: "artificial intelligence,",
                  block: true,
                  color: "#2a3630",
                  rounded: 8,
                  textColor: "#84b897"
                },
                {
                  text: "record of progress.",
                  block: true,
                  color: "#ffffff",
                  rounded: 8,
                  textColor: "#000000"
                }
              ]}
            />
          </div>
        </section>
      )}

      {/* Projects Section */}
      {isFullyBlack && (
        <section id="projects" className="relative z-10 w-full bg-[#000000]">
          <ProjectsShowcase projects={initialProjects} />
        </section>
      )}

      {/* Gallery / Viewer Section */}
      {isFullyBlack && (
        <section id="gallery" className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center bg-[#000000] px-4 sm:px-8 md:px-24 overflow-hidden">
          <h2 className="sr-only">Gallery & Projects</h2>
          {activeFolder ? (
            <>
              <h3 className="sr-only">Viewing {activeFolder}</h3>
              <button 
                onClick={() => {
                  setActiveFolder(null);
                  if (initialActiveFolder) window.history.pushState({}, '', '/');
                }}
                className="absolute top-20 md:top-8 left-4 md:left-12 z-50 flex items-center gap-2 px-4 py-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
              >
                <ArrowLeft size={20} />
                <span className="font-medium text-sm tracking-wide">Back to Folders</span>
              </button>
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                {folders.find(f => f.name === activeFolder || f.slug === activeFolder)?.images?.length ? (
                  <FlipGallery 
                    images={folders.find(f => f.name === activeFolder || f.slug === activeFolder)!.images.map((img: any) => ({
                      image: { src: img.imageUrl, alt: img.title || "Gallery Image" },
                      text: [img.title, img.description].filter(Boolean).join('\n\n') || "No description provided",
                      focusY: 50
                    }))} 
                    fit="contain" 
                    onClose={() => {
                      setActiveFolder(null);
                      if (initialActiveFolder) window.history.pushState({}, '', '/');
                    }}
                  />
                ) : (
                  <div className="text-white/50">No images in this folder</div>
                )}
              </div>
            </>
          ) : (
            isGalleryLoading ? (
              <div className="text-white/50">Loading Gallery...</div>
            ) : folders.length > 0 ? (
              isMobile ? (
                // Mobile: tap-friendly card grid
                <div className="w-full py-16">
                  <h3 className="text-white/30 text-xs tracking-[0.3em] uppercase font-medium text-center mb-8">Gallery</h3>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {folders.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => {
                          setActiveFolder(f.name);
                          if (
                            f.name?.toLowerCase().includes("mean me") &&
                            !mcAchievementShownRef.current
                          ) {
                            mcAchievementShownRef.current = true;
                            setTimeout(() => setShowMcAchievement(true), 600);
                          }
                        }}
                        className="relative group overflow-hidden rounded-2xl aspect-square bg-white/5 border border-white/10 active:scale-95 transition-transform duration-200"
                      >
                        {(f.coverImage || f.images?.[0]?.imageUrl) && (
                          <img
                            src={f.coverImage || f.images?.[0]?.imageUrl}
                            alt={f.name}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover opacity-70 group-active:opacity-90 transition-opacity"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <span className="absolute bottom-0 left-0 right-0 p-3 text-white font-medium text-sm tracking-wide text-left truncate">
                          {f.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <HoverImageReveal 
                  items={folders.map(f => ({
                    text: f.name,
                    image: { src: f.coverImage || f.images?.[0]?.imageUrl || "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800", alt: f.name },
                  }))} 
                  onItemClick={(folder: string) => {
                    setActiveFolder(folder);
                    if (
                      folder?.toLowerCase().includes("mean me") &&
                      !mcAchievementShownRef.current
                    ) {
                      mcAchievementShownRef.current = true;
                      setTimeout(() => setShowMcAchievement(true), 600);
                    }
                  }}
                  offsetX={400}
                />
              )
            ) : (
              <div className="text-white/50">No folders available.</div>
            )
          )}
        </section>
      )}

      {/* Footer */}
      {isFullyBlack && !activeFolder && (
        <footer 
          ref={footerRef}
          onMouseMove={() => {
            if (footerTimerRef.current) {
              clearTimeout(footerTimerRef.current);
              footerTimerRef.current = setTimeout(() => {
                if (lenis) {
                  lenis.scrollTo("#gallery", { duration: 1.4 });
                } else {
                  document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
                }
              }, 5000);
            }
          }}
          className="relative z-10 w-full bg-[#000000] px-5 sm:px-8 md:px-24 py-10 pb-20 sm:pb-12 text-white"
        >
          <div className="max-w-6xl mx-auto flex flex-col gap-6 text-xs sm:text-sm">
            {/* Main Row: Links on left, Copyright & Back to Top on right */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left: Email, Socials & Extras link */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 sm:gap-x-5 gap-y-2">
                <a 
                  href="mailto:dsuryansh@proton.me" 
                  className="text-white/60 hover:text-white transition-colors duration-200"
                >
                  dsuryansh@proton.me
                </a>

                <span className="text-white/20 select-none">·</span>

                <a 
                  href="https://github.com/dsuryansh2009" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors duration-200"
                >
                  GitHub
                </a>

                <span className="text-white/20 select-none">·</span>

                <a 
                  href="https://x.com/dsuryansh2009" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors duration-200"
                >
                  X
                </a>

                <span className="text-white/20 select-none">·</span>

                <a
                  href="#extras"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = "#extras";
                    setShowExtras(true);
                  }}
                  className="text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  Leave a scribble
                </a>
              </div>

              {/* Right: Copyright & Back to Top */}
              <div className="flex items-center justify-center gap-4 sm:gap-5 text-white/50">
                <span>© {new Date().getFullYear()} dsuryansh</span>

                <span className="text-white/20 select-none">·</span>

                <button
                  onClick={() => {
                    if (lenis) {
                      lenis.scrollTo(0, { duration: 1.2 });
                    } else {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="text-white/60 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-1 group"
                >
                  <span>Back to top</span>
                  <span className="transition-transform duration-200 group-hover:-translate-y-0.5">↑</span>
                </button>
              </div>
            </div>

            {/* Bottom Sub-row: Vibecoding & WIP notice */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-white/40">
              <span className="text-white/50">Made with vibecoding</span>
              <span className="text-white/35">Work in progress — website isn&apos;t fully finished yet</span>
            </div>
          </div>
        </footer>
      )}
      </OverscrollContainer>

      {/* Extras Section Overlay */}
      {isFullyBlack && showExtras && (
        <section 
          id="extras" 
          data-lenis-prevent
          className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-[#050505] px-5 sm:px-8 md:px-24 py-24"
        >
          <button 
            onClick={() => {
              window.history.pushState({}, '', '/');
              setShowExtras(false);
            }}
            className="fixed top-20 sm:top-8 left-4 sm:left-8 md:left-12 z-[101] flex items-center gap-2 px-4 py-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-sm tracking-wide">Back</span>
          </button>
          
          <div className="w-full max-w-6xl mx-auto pt-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-12">
              <div>
                <h2 className="text-4xl md:text-6xl font-bold text-white font-serif italic tracking-tight">Extras</h2>
                <p className="text-white/60 text-sm mt-2">Doodles, notes, and community scribbles.</p>
              </div>
              <button
                onClick={() => setIsScribbleOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 cursor-pointer"
              >
                <Pen size={16} />
                <span>Add Scribble</span>
              </button>
            </div>

            {featuredScribbles.length > 0 ? (
              <CommunityScribbles initialScribbles={featuredScribbles} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-white/10 rounded-2xl bg-white/[0.02]">
                <p className="text-white/60 mb-5 text-sm">No featured scribbles available yet. Be the first to leave one!</p>
                <button
                  onClick={() => setIsScribbleOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 cursor-pointer"
                >
                  <Pen size={16} />
                  <span>Add Scribble</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <LeaveScribble 
        variant="modal-only"
        isOpen={isScribbleOpen}
        onOpenChange={setIsScribbleOpen}
      />
      <MinecraftAchievement
        show={showMcAchievement}
        onDone={() => setShowMcAchievement(false)}
      />
    </main>
  );
}
