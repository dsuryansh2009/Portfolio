// lib/loading-tracker.ts

export type LoadingItem =
  | "dom"
  | "fonts"
  | "images"
  | "mosaic_lens"
  | "horizon"
  | "clay_robot"
  | "widgets";

// Weights for each item in the loading bar (sum = 1.0)
const ITEM_WEIGHTS: Record<LoadingItem, number> = {
  dom: 0.10,
  fonts: 0.15,
  images: 0.10,
  mosaic_lens: 0.15,
  horizon: 0.15,
  clay_robot: 0.25,
  widgets: 0.10,
};

const loadedItems = new Set<LoadingItem>();
const listeners = new Set<(progress: number) => void>();

export function markLoaded(item: LoadingItem) {
  if (typeof window === "undefined") return;
  if (loadedItems.has(item)) return;
  loadedItems.add(item);
  const p = getRealLoadingProgress();
  listeners.forEach((fn) => fn(p));
}

export function isItemLoaded(item: LoadingItem): boolean {
  return loadedItems.has(item);
}

export function getRealLoadingProgress(): number {
  let score = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(ITEM_WEIGHTS)) {
    totalWeight += weight;
    if (loadedItems.has(key as LoadingItem)) {
      score += weight;
    }
  }
  return totalWeight > 0 ? Math.min(1, score / totalWeight) : 1;
}

export function onLoadingProgress(fn: (progress: number) => void): () => void {
  listeners.add(fn);
  fn(getRealLoadingProgress());
  return () => {
    listeners.delete(fn);
  };
}

// Automatically bind browser standard loading events (DOM, fonts, window load)
if (typeof window !== "undefined") {
  // 1. DOM ready
  if (document.readyState === "interactive" || document.readyState === "complete") {
    markLoaded("dom");
  } else {
    document.addEventListener("DOMContentLoaded", () => markLoaded("dom"), { once: true });
  }

  // 2. Window fully loaded (images & stylesheets)
  if (document.readyState === "complete") {
    markLoaded("images");
  } else {
    window.addEventListener("load", () => markLoaded("images"), { once: true });
  }

  // 3. Fonts ready
  if ("fonts" in document) {
    document.fonts.ready
      .then(() => markLoaded("fonts"))
      .catch(() => markLoaded("fonts"));
  } else {
    markLoaded("fonts");
  }
}
