"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import SparkleButton from "@/components/common/sparkle-button";
import MosaicLens from "@/components/common/mosaic-lens";
import IOSMessageList from "@/components/common/ios-message-list";
import PredictiveArcHorizon from "@/components/common/predictive-arc-horizon";
import Navbar from "@/components/layout/navbar";
import ConnectionsMenu from "@/components/common/connections-menu";
import BlockTextReveal from "@/components/common/block-text-reveal";
import MusicWidget from "@/components/common/music-widget";
import HoverImageReveal from "@/components/common/hover-image-reveal";
import FlipGallery from "@/components/common/flip-gallery";
import ProjectsShowcase from "@/components/common/projects-showcase";

import { getFolders } from "@/app/actions/gallery";
import { getAbout } from "@/app/actions/about";

let hasPlayedIntro = false;

export default function PortfolioClient({ initialActiveFolder = null }: { initialActiveFolder?: string | null }) {
  const [isChatFinished, setIsChatFinished] = useState(hasPlayedIntro);
  const [isFullyBlack, setIsFullyBlack] = useState(hasPlayedIntro);
  const [activeFolder, setActiveFolder] = useState<string | null>(initialActiveFolder);
  const [folders, setFolders] = useState<any[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [aboutContent, setAboutContent] = useState<string>("");

  const loadFolders = async () => {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const loadAbout = async () => {
    try {
      const data = await getAbout();
      if (data) {
        setAboutContent(data.paragraphs.join("\n\n"));
      } else {
        setAboutContent(`Hi, I'm Suryansh a student from India with a deep curiosity for AI, technology, and building things that leave an impression.\n\nI come from a small town, but I've never believed that ambition is defined by where you start. While preparing for competitive exams in high school, I spend every spare moment exploring artificial intelligence, experimenting with new ideas, and turning them into projects and experiences.\n\nThis website is a collection of that journey—my work, my thoughts, and the things I'm learning along the way. It's not a showcase of perfection; it's a record of progress.\n\nThanks for stopping by. I hope you find something here that inspires you as much as creating it inspires me.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFolders();
    loadAbout();
    if (initialActiveFolder) {
      hasPlayedIntro = true;
      setIsChatFinished(true);
      setIsFullyBlack(true);
    }
  }, [initialActiveFolder]);

  const completeIntro = () => {
    if (hasPlayedIntro) return;
    setIsChatFinished(true);
    setTimeout(() => {
      setIsFullyBlack(true);
      hasPlayedIntro = true;
    }, 800);
  };

  const handleChatComplete = () => {
    if (document.readyState === "complete") {
      completeIntro();
    } else {
      window.addEventListener("load", completeIntro);
      setTimeout(completeIntro, 2000);
    }
  };

  return (
    <main className="h-screen w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-[#0A0710] scroll-smooth">
      <h1 className="sr-only">Suryansh | AI Developer & Student Portfolio</h1>
      {!isFullyBlack && (
        <MosaicLens
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            minWidth: 0,
            minHeight: 0,
            zIndex: 0,
          }}
        />
      )}
      
      {!isFullyBlack && (
        <section className="relative z-10 flex h-screen w-full snap-start flex-col items-center justify-center">
          <h2 className="sr-only">Introduction</h2>
          <SparkleButton />
          <div className="absolute bottom-10 animate-bounce text-white/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>
      )}
      
      <section 
        id="home"
        className={`relative z-10 flex h-screen w-full snap-start items-center justify-center p-8 transition-colors duration-1000 ${
          isChatFinished ? "bg-black" : "bg-transparent"
        }`}
      >
        <h2 className="sr-only">Home & Chat</h2>
        <div className={`w-full max-w-3xl h-[600px] flex flex-col justify-end transition-opacity duration-1000 ${isChatFinished ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          {!isFullyBlack && <IOSMessageList onComplete={handleChatComplete} />}
        </div>
        
        {isFullyBlack && (
          <>
            <Navbar />
            <MusicWidget />
            <div className="absolute inset-x-0 bottom-12 flex justify-center z-10 pointer-events-none">
              <div className="pointer-events-auto">
                <ConnectionsMenu />
              </div>
            </div>
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
        <section id="about" className="relative z-10 flex min-h-screen w-full snap-start flex-col items-center justify-center bg-[#050505] px-8 md:px-24">
          <h2 className="sr-only">About Me</h2>
          <div className="w-full max-w-5xl mx-auto">
            <BlockTextReveal 
              text={aboutContent}
              font={{
                fontSize: "28px",
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
                  text: "Suryansh",
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

      {/* Gallery / Viewer Section */}
      {isFullyBlack && (
        <section id="gallery" className="relative z-10 flex min-h-screen w-full snap-start flex-col items-center justify-center bg-[#000000] px-8 md:px-24 overflow-hidden">
          <h2 className="sr-only">Gallery & Projects</h2>
          {activeFolder ? (
            <>
              <h3 className="sr-only">Viewing {activeFolder}</h3>
              <button 
                onClick={() => {
                  setActiveFolder(null);
                  if (initialActiveFolder) window.history.pushState({}, '', '/');
                }}
                className="absolute top-8 left-8 md:left-12 z-50 flex items-center gap-2 px-4 py-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
              >
                <ArrowLeft size={20} />
                <span className="font-medium text-sm tracking-wide">Back to Folders</span>
              </button>
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                {folders.find(f => f.name === activeFolder || f.slug === activeFolder)?.images?.length ? (
                  <FlipGallery 
                    images={folders.find(f => f.name === activeFolder || f.slug === activeFolder)!.images.map((img: any) => ({
                      image: { src: img.imageUrl, alt: img.title || "Gallery Image" },
                      text: [img.title, img.description].filter(Boolean).join('\n\n') || "No description provided",
                      focusY: 50
                    }))} 
                    fit="contain" 
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
              <HoverImageReveal 
                items={folders.map(f => ({
                  text: f.name,
                  image: { src: f.coverImage || f.images?.[0]?.imageUrl || "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800", alt: f.name },
                }))} 
                onItemClick={(folder: string) => setActiveFolder(folder)} 
                offsetX={400} 
              />
            ) : (
              <div className="text-white/50">No folders available.</div>
            )
          )}
        </section>
      )}
    </main>
  );
}
