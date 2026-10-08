"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type Transition as MotionTransition,
} from "framer-motion";

interface Item {
  text?: string;
  image?: { src?: string; srcSet?: string; alt?: string };
  link?: string;
}

interface ItemsValue {
  itemCount?: number;
  [key: string]: unknown;
}

const MAX_ITEMS = 6;

interface FontValue {
  fontSize?: number | string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  [key: string]: unknown;
}

interface HoverImageRevealProps {
  items?: ItemsValue;
  font?: FontValue;
  textColor?: string;
  dimColor?: string;
  align?: "left" | "center" | "right";
  rowGap?: number;
  imageWidth?: number;
  imageHeight?: number;
  rounded?: number;
  offsetX?: number;
  offsetY?: number;
  followStrength?: number;
  transition?: MotionTransition;
  backgroundColor?: string;
  style?: CSSProperties;
  onItemClick?: (itemText: string) => void;
}

const DEFAULT_ITEMS_DATA: { text: string; src: string }[] = [
  {
    text: "NEW SEASON DROP",
    src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800",
  },
  {
    text: "ESSENTIAL COLLECTION",
    src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/d6af07a0-4dc5-4de4-07b1-9d2ad6100000/w=800",
  },
  {
    text: "SUMMER EDITION",
    src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/c083d83a-f5a4-4434-989f-4eaa9bbe7500/w=800",
  },
  {
    text: "STREET ICONS",
    src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/93bad0e0-e2ab-4e21-de9c-4cb54b028f00/w=800",
  },
  {
    text: "PREMIUM DENIM",
    src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/09a59a65-3c07-4500-f72c-68c824168c00/w=800",
  },
  {
    text: "ARCHIVE PIECES",
    src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800",
  },
];

const DEFAULT_ITEMS = DEFAULT_ITEMS_DATA.map(d => ({ text: d.text, image: { src: d.src } }));

const DEFAULT_FONT: FontValue = {
  fontFamily: "Inter",
  fontWeight: 400,
  fontSize: 61,
  lineHeight: "0.9em",
  letterSpacing: "-0.05em",
  textAlign: "left",
};

const DEFAULT_TRANSITION: MotionTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 1,
};

const alignToFlex: Record<string, CSSProperties["alignItems"]> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};
const alignToText: Record<string, CSSProperties["textAlign"]> = {
  left: "left",
  center: "center",
  right: "right",
};

function __OriginkitBase_HoverImageReveal({
  items = DEFAULT_ITEMS as any,
  font = DEFAULT_FONT,
  textColor = "#FFFFFF",
  dimColor = "#51565A",
  align = "center",
  rowGap = 30,
  imageWidth = 300,
  imageHeight = 400,
  rounded = 16,
  offsetX = 200,
  offsetY = 0,
  followStrength = 0,
  transition = DEFAULT_TRANSITION,
  backgroundColor = "#000000",
  style,
  onItemClick,
}: HoverImageRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const stiffness = 60 + followStrength * 5;
  const springCfg = { stiffness, damping: 28, mass: 0.5 };
  const x = useSpring(rawX, springCfg);
  const y = useSpring(rawY, springCfg);

  let list: Item[] = [];
  if (Array.isArray(items)) {
    list = items;
  } else {
    // Legacy support
    const data = items || {};
    const count = (data.itemCount as number) || 5;
    for (let i = 1; i <= count; i++) {
      const it = data[`item${i}`] as Item | undefined;
      const fallback = DEFAULT_ITEMS_DATA[i - 1];
      list.push({
        text: it?.text ?? fallback?.text ?? `Item ${i}`,
        image: it?.image ?? (fallback ? { src: fallback.src } : undefined),
        link: it?.link,
      });
    }
  }

  const anyActive = hovered != null;

  const onMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left + offsetX);
    rawY.set(e.clientY - rect.top + offsetY);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={() => setHovered(null)}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: alignToFlex[align],
        gap: `${rowGap}px`,
        padding: 24,
        boxSizing: "border-box",
        cursor: "default",
        ...(font as CSSProperties),
        ...style,
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          width: imageWidth,
          height: imageHeight,
          borderRadius: rounded,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 2,
        }}
        animate={{ opacity: anyActive ? 1 : 0 }}
        transition={transition}
      >
        {list.map((item, i) => {
          const src = item.image?.src;
          const yPos =
            hovered == null
              ? "100%"
              : i < hovered
                ? "-100%"
                : i > hovered
                  ? "100%"
                  : "0%";
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ y: yPos }}
              transition={transition}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            >
              {src ? (
                <img
                  src={src}
                  alt={item.image?.alt || item.text || ""}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg,#333,#111)",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <div
        onMouseLeave={() => setHovered(null)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: alignToFlex[align],
          gap: `${rowGap}px`,
        }}
      >
        {list.map((item, i) => {
          const isHovered = hovered === i;
          const color = anyActive ? (isHovered ? textColor : dimColor) : textColor;
          const copyStyle: CSSProperties = {
            display: "block",
            color,
            transition: "color 0.2s ease",
            whiteSpace: "pre",
            textAlign: alignToText[align],
          };
          const inner = (
            <motion.div
              style={{ position: "relative" }}
              animate={{ y: isHovered ? "-100%" : "0%" }}
              transition={transition}
            >
              <span style={copyStyle}>{item.text}</span>
              <span
                aria-hidden
                style={{
                  ...copyStyle,
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  width: "100%",
                }}
              >
                {item.text}
              </span>
            </motion.div>
          );
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onClick={() => onItemClick?.(item.text || "")}
              style={{
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const __originkitPresetProps = {
  "items": {
    "itemCount": 5,
    "item1": {
      "text": "U WANT ME ?",
      "image": {
        "src": "https://i.pinimg.com/736x/b2/e4/7c/b2e47c367c53d753f48f8b7005649958.jpg"
      },
      "link": ""
    },
    "item2": {
      "text": "PHOTOGRAPHY",
      "image": {
        "src": "https://i.pinimg.com/736x/f1/2e/98/f12e9816880e0d79de1ef35793cbd8eb.jpg"
      },
      "link": ""
    },
    "item3": {
      "text": "SCREENSHOTS",
      "image": {
        "src": "https://scontent.fgau1-1.fna.fbcdn.net/v/t39.30808-6/544866009_2635076986838993_1433190377742974914_n.jpg?stp=dst-jpg_tt6&cstp=mx1079x1029&ctp=s1079x1029&_nc_cat=101&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=8Y8-e9Ybm10Q7kNvwHvhR71&_nc_oc=AdrBiLUyPrXobhacSI_6Ha6Wxw9V4iL5CJbGrYvC8lJmP18syyI87rh6hpVUE2TwKFSmDT0jRIW8nrTiEoNuuLAU&_nc_zt=23&_nc_ht=scontent.fgau1-1.fna&_nc_gid=51vuMg4zcReyoyXIFve9Hw&_nc_ss=7b289&oh=00_AQOY_REgiUhraN-45xCQ0_UKXd8xTqIcow7JgFOJ1oYNow&oe=6ACAF2F9"
      },
      "link": ""
    },
    "item4": {
      "text": "MISCELLANEOUS",
      "image": {
        "src": "https://i.pinimg.com/1200x/5e/f1/67/5ef1676ec8506c541863f2b242b92864.jpg"
      },
      "link": ""
    },
    "item5": {
      "text": "MY SKETCHES",
      "image": {
        "src": "https://i.pinimg.com/736x/b5/57/57/b55757278fe0435480e50d0358b2b108.jpg"
      },
      "link": ""
    },
    "item6": {
      "text": "ARCHIVE PIECES",
      "image": {
        "src": "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800"
      },
      "link": ""
    }
  },
  "font": {
    "fontFamily": "Inter",
    "variant": "Regular",
    "fontWeight": 400,
    "fontSize": 61,
    "lineHeight": "0.9em",
    "letterSpacing": "-0.05em",
    "textAlign": "left"
  },
  "textColor": "#FFFFFF",
  "dimColor": "#51565A",
  "align": "center",
  "rowGap": 30,
  "imageWidth": 300,
  "imageHeight": 400,
  "rounded": 16,
  "offsetX": 200,
  "offsetY": 0,
  "followStrength": 0,
  "transition": {
    "type": "spring",
    "stiffness": 400,
    "damping": 40,
    "mass": 1
  },
  "backgroundColor": "#000000"
};

export default function HoverImageReveal(props: Record<string, unknown>) {
  return <__OriginkitBase_HoverImageReveal {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}
