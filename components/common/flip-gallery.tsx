"use client";

import { motion } from "framer-motion";
import {
  useState,
  useMemo,
  useRef,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageItem {
  image?: { src?: string; alt?: string } | string;
  focusY?: number;
  text?: string; // Added for the back side text
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
}

const DEFAULT_ITEMS: ImageItem[] = [
  {
    image: {
      src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/12e8b0be-f114-4134-1ab7-53116bfc2800/w=800",
    },
    focusY: 50,
    text: "A beautiful capture of moments that last forever.",
  },
  {
    image: {
      src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/08f4d1ae-43ca-4879-80f4-c1e7969eef00/w=800",
    },
    focusY: 50,
    text: "Sometimes, the simplest things are the most profound.",
  },
  {
    image: {
      src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/75367195-8fa6-4ff1-d0ce-68df4694a700/w=800",
    },
    focusY: 50,
    text: "Exploring the intersections of art and daily life.",
  },
  {
    image: {
      src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/f0b7559d-35e2-4feb-ae16-7ca802b21f00/w=800",
    },
    focusY: 50,
    text: "The essence of street photography and urban culture.",
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
  } = props;

  const items = useMemo(() => {
    const list = (images ?? []).filter((item) => srcOf(item?.image));
    return list.length ? list : DEFAULT_ITEMS;
  }, [images]);
  const urls = useMemo(() => items.map((item) => srcOf(item.image)), [items]);

  const tiltRef = useRef<HTMLDivElement | null>(null);

  const effect = tiltOptions?.effect ?? DEFAULTS.tiltOptions.effect;
  const tiltLimit = tiltOptions?.tiltLimit ?? DEFAULTS.tiltOptions.tiltLimit;
  const scale = (tiltOptions?.scale ?? DEFAULTS.tiltOptions.scale) / 100;

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => setIsFlipped((prev) => !prev);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setIndex((prev) => (prev + 1) % items.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!tilt || !el) return;
    const { width, height, top, left } = el.getBoundingClientRect();
    const mult = effect === "repel" ? -1 : 1;
    const tiltX = ((e.clientY - top) / height - 0.5) * (tiltLimit * 2) * mult;
    const tiltY = ((e.clientX - left) / width - 0.5) * -(tiltLimit * 2) * mult;
    el.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
  };

  const onLeave = () => {
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
      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-12 z-10 p-3 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all active:scale-95"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-12 z-10 p-3 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all active:scale-95"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div
        ref={tiltRef}
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
          <img
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
              pointerEvents: "none",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
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
    {
      image: {
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/75367195-8fa6-4ff1-d0ce-68df4694a700/w=800",
      },
      focusY: 50,
      text: "Exploring the intersections of art and daily life.",
    },
    {
      image: {
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/f0b7559d-35e2-4feb-ae16-7ca802b21f00/w=800",
      },
      focusY: 50,
      text: "The essence of street photography and urban culture.",
    },
  ],
  fit: "cover" as const,
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
