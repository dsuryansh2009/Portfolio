"use client";

// Procedural Web Audio API sound generator for the Clay Robot companion
// Generates cute, organic, zero-latency synthesizer sounds without needing external audio files.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Playful springy hop sound effect (when the robot jumps)
 */
export function playRobotHop() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Main oscillator for the bouncy spring
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Pitch sweep: upward bounce then slight settling
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.22);

    // Smooth gain envelope (warm and not piercing)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {}
}

/**
 * Cute, procedural robotic chatter/chirp syllables (when speech popup appears)
 * Sounds like R2-D2 / Wall-E / Animal Crossing chatter.
 */
export function playRobotSpeech() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Friendly pentatonic scale frequencies (Hz)
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
    const syllableCount = 3 + Math.floor(Math.random() * 2); // 3 or 4 syllables

    let delay = 0.05; // Short delay after hop starts

    for (let i = 0; i < syllableCount; i++) {
      const startTime = now + delay;
      const duration = 0.045 + Math.random() * 0.025; // 45ms to 70ms per chirp
      const freq = scale[Math.floor(Math.random() * scale.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      // Subtle pitch inflection per syllable
      const pitchInflection = freq * (1 + (Math.random() * 0.2 - 0.1));
      osc.frequency.exponentialRampToValueAtTime(pitchInflection, startTime + duration);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);

      delay += duration + 0.02 + Math.random() * 0.02; // Small gap between syllables
    }
  } catch {}
}

/**
 * Plays both hop & speech together for an expressive, lively click interaction
 */
export function playRobotClickSound() {
  playRobotHop();
  playRobotSpeech();
}

