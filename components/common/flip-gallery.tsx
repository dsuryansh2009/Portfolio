"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageItem {
  id?: string;
  image?: { src?: string; alt?: string } | string;
  focusY?: number;
  text?: string;
}

interface TiltOptions {
  effect: "attract" | "repel";
  tiltLimit: number;
  scale: number;
}

interface ImageFlipProps {
  images: ImageItem[];
  fit: "cover" | "contain";
  rounded: number;
  transition: any;
  tilt: boolean;
  tiltOptions: TiltOptions;
  style?: CSSProperties;
  onClose?: () => void;
}

const DEFAULT_ITEMS: ImageItem[] = [
  {
    image: {
      src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/12e8b0be-f114-4134-1ab7-53116bfc2800/w=800",
    },
    focusY: 50,
    text: "A beautiful capture of moments that last forever.",
  },
];

const DEFAULTS = {
  fit: "cover" as const,
  focusY: 50,
  rounded: 16,
  transition: {
    ease: "easeInOut",
    mass: 1,
    type: "tween",
    damping: 60,
    duration: 0.6,
    stiffness: 800,
  },
  tilt: true,
  tiltOptions: { scale: 105, effect: "repel" as const, tiltLimit: 15 },
};

const PERSPECTIVE = 900;

const srcOf = (image: any): string =>
  typeof image === "string" ? image : image?.src ?? "";

const focusOf = (item: ImageItem | undefined) =>
  Math.min(
    100,
    Math.max(
      0,
      typeof item?.focusY === "number" ? item.focusY : DEFAULTS.focusY
    )
  );

function __OriginkitBase_ImageFlip(props: Partial<ImageFlipProps>) {
  const {
    images,
    fit = DEFAULTS.fit,
    rounded = DEFAULTS.rounded,
    transition = DEFAULTS.transition,
    tilt = DEFAULTS.tilt,
    tiltOptions = DEFAULTS.tiltOptions,
    style,
    onClose,
  } = props;

  const items = useMemo(() => {
    const list = (images ?? []).filter((item) => srcOf(item?.image));
    return list.length ? list : DEFAULT_ITEMS;
  }, [images]);

  const tiltRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const effect = tiltOptions?.effect ?? DEFAULTS.tiltOptions.effect;
  const tiltLimit = tiltOptions?.tiltLimit ?? DEFAULTS.tiltOptions.tiltLimit;
  const scale = (tiltOptions?.scale ?? DEFAULTS.tiltOptions.scale) / 100;

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);


  const toggleFlip = () => setIsFlipped((prev) => !prev);

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isTransitioning) return;
    setDirection(1);
    setIsTransitioning(true);
    setIsFlipped(false);
    setIndex((prev) => (prev + 1) % items.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isTransitioning) return;
    setDirection(-1);
    setIsTransitioning(true);
    setIsFlipped(false);
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      
      if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length, isTransitioning, onClose]);

  const onMouseEnter = () => {
    if (tiltRef.current) {
      rectRef.current = tiltRef.current.getBoundingClientRect();
    }
  };

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!tilt || !el) return;
    
    if (!rectRef.current) rectRef.current = el.getBoundingClientRect();
    const { width, height, top, left } = rectRef.current;
    
    const mult = effect === "repel" ? -1 : 1;
    const tiltX = ((e.clientY - top) / height - 0.5) * (tiltLimit * 2) * mult;
    const tiltY = ((e.clientX - left) / width - 0.5) * -(tiltLimit * 2) * mult;
    
    requestAnimationFrame(() => {
      if (tiltRef.current) {
        tiltRef.current.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      }
    });
  };

  const onLeave = () => {
    rectRef.current = null;
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  const currentItem = items[index];
  const src = srcOf(currentItem.image);
  const text = currentItem.text || "No description provided.";

  const faceStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    borderRadius: rounded,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  return (
    <div
      style={{
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: `${PERSPECTIVE}px`,
      }}
    >
      {/* Dynamic Background Reaction */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={`bg-${src}`}
          src={src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: "-10%",
            width: "120%",
            height: "120%",
            objectFit: "cover",
            filter: "blur(40px) brightness(0.5)",
            WebkitFilter: "blur(40px) brightness(0.5)",
            transform: "translateZ(0)",
            willChange: "opacity",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      </AnimatePresence>

      {/* Progress Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setDirection(i > index ? 1 : -1);
              setIndex(i);
              setIsFlipped(false);
            }}
            aria-label={`Go to image ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === index 
                ? "w-1.5 h-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                : "w-1 h-1 bg-white/40 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-12 z-20 p-3 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
            disabled={isTransitioning}
            aria-label="Previous Image"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-12 z-20 p-3 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
            disabled={isTransitioning}
            aria-label="Next Image"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div
        ref={tiltRef}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={toggleFlip}
        style={{
          position: "relative",
          maxWidth: "85vw",
          maxHeight: "80vh",
          display: "flex",
          transformStyle: "preserve-3d",
          transition: "transform 0.2s ease-out",
          willChange: "transform",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={transition}
          style={{
            position: "relative",
            display: "flex",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Front Face (Image) */}
          <motion.img
            key={src}
            initial={{ opacity: 0, scale: 0.97, x: direction > 0 ? 30 : -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.3 } }}
            onAnimationComplete={() => setIsTransitioning(false)}
            src={src}
            alt={(typeof currentItem.image !== "string" && currentItem.image?.alt) || text || "Gallery Image"}
            draggable={false}
            style={{
              borderRadius: rounded,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: fit,
              objectPosition: fit === "cover" ? `center ${focusOf(currentItem)}%` : "center",
              userSelect: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "block",
            }}
          />



          {/* Back Face (Text) */}
          <div
            style={{
              ...faceStyle,
              transform: "rotateY(180deg)",
              backgroundColor: "#111111",
              backgroundImage: "linear-gradient(145deg, #1a1a1a, #0a0a0a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2.5rem",
              textAlign: "center",
              color: "#f5f5f5",
              fontSize: "1.25rem",
              fontWeight: 500,
              lineHeight: 1.6,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <p className="font-sans tracking-wide whitespace-pre-wrap">{text}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const __originkitPresetProps = {
  images: [
    {
      image: {
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/12e8b0be-f114-4134-1ab7-53116bfc2800/w=800",
      },
      focusY: 50,
      text: "A beautiful capture of moments that last forever. Every picture tells a story.",
    },
    {
      image: {
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/08f4d1ae-43ca-4879-80f4-c1e7969eef00/w=800",
      },
      focusY: 50,
      text: "Sometimes, the simplest things are the most profound.",
    },
  ],
  fit: "contain" as const,
  rounded: 16,
  transition: {
    ease: "easeInOut",
    mass: 1,
    type: "tween",
    damping: 60,
    duration: 0.6,
    stiffness: 800,
  },
  tilt: true,
  tiltOptions: { scale: 105, effect: "repel" as const, tiltLimit: 15 },
};

export default function FlipGallery(props: Record<string, unknown>) {
  return <__OriginkitBase_ImageFlip {...__originkitPresetProps} {...props} />;
}
