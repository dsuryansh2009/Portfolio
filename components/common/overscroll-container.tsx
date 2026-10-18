"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useLenis } from "lenis/react";
import { cn } from "@/lib/utils";

interface OverscrollContainerProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  maxPull?: number;
}

/**
 * Logarithmic rubber-band resistance curve:
 * Allows pulling further past the boundary with continuous smooth resistance
 */
function rubberBand(distance: number, dimension: number, constant = 0.55): number {
  if (distance <= 0) return 0;
  return (1.0 - 1.0 / ((distance * constant) / dimension + 1.0)) * dimension;
}

export default function OverscrollContainer({
  children,
  disabled = false,
  className,
  maxPull = 120,
}: OverscrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  const currentOffsetRef = useRef(0);
  const rawDeltaRef = useRef(0);
  const wheelStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Touch tracking refs
  const isTouchingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchDirectionRef = useRef<"none" | "top" | "bottom">("none");

  // Smooth ease-out glide back to 0 with mathematically zero bounce
  const glideBackToRest = () => {
    const el = containerRef.current;
    if (!el || currentOffsetRef.current === 0) return;

    rawDeltaRef.current = 0;
    currentOffsetRef.current = 0;

    // Direct ease-out return: decelerates smoothly to 0 with NO overshoot / NO bounce
    el.style.transition = "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = "translate3d(0, 0px, 0)";

    if (resetTransitionTimeoutRef.current) {
      clearTimeout(resetTransitionTimeoutRef.current);
    }
    resetTransitionTimeoutRef.current = setTimeout(() => {
      if (currentOffsetRef.current === 0 && el) {
        el.style.transition = "";
        el.style.transform = "";
        el.style.willChange = "auto";
      }
    }, 400);
  };

  const applyOffset = (offset: number) => {
    const el = containerRef.current;
    if (!el) return;

    if (resetTransitionTimeoutRef.current) {
      clearTimeout(resetTransitionTimeoutRef.current);
      resetTransitionTimeoutRef.current = null;
    }

    currentOffsetRef.current = offset;

    // Instant tactile tracking while pulling
    el.style.transition = "none";
    el.style.willChange = "transform";
    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  };

  useEffect(() => {
    if (disabled) {
      if (containerRef.current) {
        containerRef.current.style.transition = "";
        containerRef.current.style.transform = "";
        containerRef.current.style.willChange = "auto";
      }
      currentOffsetRef.current = 0;
      rawDeltaRef.current = 0;
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const isInteractiveElement = (target: HTMLElement | null) => {
      if (!target) return false;
      return !!target.closest(
        "input, textarea, select, [contenteditable='true'], [data-lenis-prevent], #extras, [role='dialog'], [role='menu']"
      );
    };

    // ─── Wheel & Trackpad Listener ────────────────────────
    const handleWheel = (e: WheelEvent) => {
      if (disabled) return;
      if (isInteractiveElement(e.target as HTMLElement)) return;

      const scrollY = lenis ? lenis.scroll : window.scrollY;
      const maxScroll = lenis
        ? lenis.limit
        : Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      const isAtTop = scrollY <= 1;
      const isAtBottom = scrollY >= Math.max(0, maxScroll - 2);

      let deltaY = e.deltaY;
      if (e.deltaMode === 1) deltaY *= 33;
      else if (e.deltaMode === 2) deltaY *= window.innerHeight;

      // Top overscroll: user scrolling further than top of page
      if (isAtTop && (deltaY < 0 || currentOffsetRef.current > 0.5)) {
        if (deltaY < 0) {
          rawDeltaRef.current += -deltaY;
          const pull = rubberBand(rawDeltaRef.current, maxPull);
          applyOffset(pull);
          if (e.cancelable) e.preventDefault();
        } else if (rawDeltaRef.current > 0) {
          // Returning back down towards boundary
          rawDeltaRef.current = Math.max(0, rawDeltaRef.current - deltaY * 1.3);
          const pull = rubberBand(rawDeltaRef.current, maxPull);
          applyOffset(pull);
          if (pull > 0 && e.cancelable) e.preventDefault();
        }

        // When wheel stops, smoothly glide back to the same spot (0) with no bounce
        if (wheelStopTimeoutRef.current) clearTimeout(wheelStopTimeoutRef.current);
        wheelStopTimeoutRef.current = setTimeout(() => {
          glideBackToRest();
        }, 75);
      }
      // Bottom overscroll: user scrolling further than bottom of page
      else if (isAtBottom && (deltaY > 0 || currentOffsetRef.current < -0.5)) {
        if (deltaY > 0) {
          rawDeltaRef.current += deltaY;
          const pull = -rubberBand(rawDeltaRef.current, maxPull);
          applyOffset(pull);
          if (e.cancelable) e.preventDefault();
        } else if (rawDeltaRef.current > 0) {
          // Returning back up towards boundary
          rawDeltaRef.current = Math.max(0, rawDeltaRef.current + deltaY * 1.3);
          const pull = -rubberBand(rawDeltaRef.current, maxPull);
          applyOffset(pull);
          if (pull < 0 && e.cancelable) e.preventDefault();
        }

        // When wheel stops, smoothly glide back to the same spot (0) with no bounce
        if (wheelStopTimeoutRef.current) clearTimeout(wheelStopTimeoutRef.current);
        wheelStopTimeoutRef.current = setTimeout(() => {
          glideBackToRest();
        }, 75);
      }
    };

    // ─── Touch Listeners ──────────────────────────────────
    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || e.touches.length !== 1) return;
      if (isInteractiveElement(e.target as HTMLElement)) return;

      const touch = e.touches[0];
      touchStartYRef.current = touch.clientY;
      touchStartXRef.current = touch.clientX;
      isTouchingRef.current = true;
      touchDirectionRef.current = "none";

      const scrollY = lenis ? lenis.scroll : window.scrollY;
      const maxScroll = lenis
        ? lenis.limit
        : Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      if (scrollY <= 1) {
        touchDirectionRef.current = "top";
      } else if (scrollY >= Math.max(0, maxScroll - 2)) {
        touchDirectionRef.current = "bottom";
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchingRef.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const currentY = touch.clientY;
      const currentX = touch.clientX;
      const diffY = currentY - touchStartYRef.current;
      const diffX = currentX - touchStartXRef.current;

      if (Math.abs(diffX) > Math.abs(diffY) && touchDirectionRef.current === "none") {
        return;
      }

      const scrollY = lenis ? lenis.scroll : window.scrollY;
      const maxScroll = lenis
        ? lenis.limit
        : Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      if (touchDirectionRef.current === "none") {
        if (scrollY <= 1 && diffY > 0) {
          touchDirectionRef.current = "top";
          touchStartYRef.current = currentY;
        } else if (scrollY >= Math.max(0, maxScroll - 2) && diffY < 0) {
          touchDirectionRef.current = "bottom";
          touchStartYRef.current = currentY;
        }
      }

      if (touchDirectionRef.current === "top") {
        if (diffY > 0) {
          const pull = rubberBand(diffY, maxPull);
          applyOffset(pull);
          if (e.cancelable) e.preventDefault();
        } else {
          applyOffset(0);
        }
      } else if (touchDirectionRef.current === "bottom") {
        if (diffY < 0) {
          const pull = -rubberBand(-diffY, maxPull);
          applyOffset(pull);
          if (e.cancelable) e.preventDefault();
        } else {
          applyOffset(0);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isTouchingRef.current) return;
      isTouchingRef.current = false;
      touchDirectionRef.current = "none";

      // Smoothly glide straight back to 0 on finger release (no bounce)
      glideBackToRest();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      if (wheelStopTimeoutRef.current) clearTimeout(wheelStopTimeoutRef.current);
      if (resetTransitionTimeoutRef.current) clearTimeout(resetTransitionTimeoutRef.current);
    };
  }, [disabled, lenis, maxPull]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full relative", className)}
      style={{
        transformOrigin: "center center",
      }}
    >
      {/* Top canvas extension */}
      <div
        aria-hidden="true"
        className="absolute -top-[100vh] left-0 right-0 h-[100vh] bg-[#0A0710] pointer-events-none"
      />

      {children}

      {/* Bottom dark extension */}
      <div
        aria-hidden="true"
        className="absolute -bottom-[100vh] left-0 right-0 h-[100vh] bg-[#000000] pointer-events-none"
      />
    </div>
  );
}
