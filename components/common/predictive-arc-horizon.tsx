"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

const MAX_DPR = 2

const VERT_SRC = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime, uDpr, uCell, uDot, uHover;
uniform vec2  uPtr;
uniform float uA, uB, uC, uD;
uniform vec3  uBg, uBase, uAccent, uHigh;

// Audio Uniforms
uniform float uBass, uMid, uTreble, uBeat;

void main(){
  float cs = max(uCell, 2.0);
  
  // Beat: scale pixel field by 5-10% (subtle enlargement)
  float scale = 1.0 - (uBeat * 0.05) - (uBass * 0.02);
  vec2 scaledCoord = (gl_FragCoord.xy - uRes * 0.5) * scale + uRes * 0.5;

  vec2 ci = floor(scaledCoord / cs);
  vec2 cc = (ci + 0.5) * cs;

  float x = cc.x / uDpr;
  float y = (uRes.y - cc.y) / uDpr;
  float w = uRes.x / uDpr;
  float h = uRes.y / uDpr;
  // Mid: Slightly increase animation energy
  float t = uTime + (uMid * 0.5);

  float i = 0.0;
  float R = w * uB;

  float rot = -clamp((uPtr.x - w * 0.5) / w, -0.5, 0.5) * 0.9 * uHover;
  vec2 c = vec2(w * 0.5, h * (1.0 - uA) + R);
  vec2 q = vec2(x, y) - c;
  float cr = cos(rot);
  float sr = sin(rot);
  q = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
  float r = length(q);
  
  // Bass: soft expanding pulse in distance 
  float dist = r - R - (uBass * 20.0 * sin(t * 2.0 - r * 0.01));
  
  float normX = q.x / (w * 0.75);
  float th = (140.0 + (1.0 - min(abs(normX), 1.0)) * 80.0) * uC;
  
  // Beat & Bass: increase glow intensity / wave amplitude slightly
  th *= (1.0 + uBeat * 0.15 + uBass * 0.1);

  float thS = dist > 0.0 ? th : th * 0.45;
  float ad = abs(dist);
  if (ad < thS && q.y < 0.0) {
    i = 1.0 - ad / thS;
    
    // Mid: Horizontal ripples
    float waveX = sin(x * 0.015 + t + uMid * 2.0);
    float waveR = cos(r * 0.02 - t * 1.6 - uBass * 1.0);
    i = i * 0.7 + waveX * waveR * 0.3 * i;
    i *= max(0.0, 1.0 - pow(min(abs(normX), 1.0), uD));
  }

  vec3 col = uBg;
  if (i > 0.02) {
    float side = uDot * i * uDpr;
    // Bass: scale pixels slightly
    side *= (1.0 + uBass * 0.1);
    
    vec2 d = abs(scaledCoord - cc);
    float cov = 1.0 - smoothstep(side * 0.5 - 1.0, side * 0.5 + 1.0, max(d.x, d.y));

    // Treble: shimmering highlights (vary opacity slightly)
    float shimmer = fract(sin(dot(ci, vec2(12.9898, 78.233)) + t * 5.0) * 43758.5453) * uTreble;
    i += shimmer * 0.15;

    // Beat: slightly brighten pink colors
    vec3 ink = mix(uBase, uAccent, clamp(pow(i, 1.1) + uBeat * 0.2, 0.0, 1.0));
    ink = mix(ink, uHigh, smoothstep(0.72 - uBeat * 0.1, 1.0, i));
    
    // Beat & Bass: increase overall brightness slightly
    ink += (uBeat * 0.15 + uBass * 0.1) * uAccent;
    
    col = mix(uBg, ink, cov * clamp(i * 1.6 + uBeat * 0.2, 0.0, 1.0));
  }
  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("PredictiveArcHorizon shader:", gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
    }
    return sh
}

function parseColor(input: string | undefined, fb: [number, number, number]): [number, number, number] {
    if (!input) return fb
    const str = String(input).trim()
    if (str.charAt(0) === "#") {
        let hex = str.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r / 255, g / 255, b / 255]
        }
        return fb
    }
    const m = str.match(/[\d.]+/g)
    if (m && m.length >= 3) {
        return [
            Math.min(255, parseFloat(m[0])) / 255,
            Math.min(255, parseFloat(m[1])) / 255,
            Math.min(255, parseFloat(m[2])) / 255,
        ]
    }
    return fb
}

function num(v: unknown, fb: number): number {
    return typeof v === "number" && isFinite(v) ? v : fb
}

function clampN(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v
}

interface Props {
    style?: React.CSSProperties
    width?: number
    height?: number
    background?: string
    baseColor?: string
    accentColor?: string
    highlight?: string
    density?: number
    dotSize?: number
    speed?: number
    hover?: number
    horizon?: HorizonGroup
}

type HorizonGroup = { rise?: number; radius?: number; thickness?: number; falloff?: number }
const HORIZON_DEFAULTS: Required<HorizonGroup> = { rise: 45, radius: 90, thickness: 100, falloff: 250 }

function __OriginkitBase_PredictiveArcHorizon(props: Props) {
    const {
        style,
        background = "#02040A",
        baseColor = "#0B2A5E",
        accentColor = "#3FA9FF",
        highlight = "#E8F6FF",
        density = 40,
        dotSize = 100,
        speed = 50,
        hover = 100,
        horizon = {"rise":45,"radius":90,"falloff":250,"thickness":100},
        width,
        height,
    } = props

    const grp = { ...HORIZON_DEFAULTS, ...(horizon || {}) }

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ptrRef = useRef({ tx: 0.5, ty: 0.5, x: 0.5, y: 0.5 })
    const sizeRef = useRef({ w: 0, h: 0 })
    sizeRef.current = { w: num(width, 0), h: num(height, 0) }

    const vRef = useRef<Record<string, number | string>>({})
    vRef.current = {
        bg: background,
        base: baseColor,
        accent: accentColor,
        high: highlight,
        density: Math.round(clampN(num(density, 160), 40, 320)),
        dotSize: clampN(num(dotSize, 100), 20, 400) / 100,
        speed: clampN(num(speed, 50), 0, 100) / 50,
        hover: clampN(num(hover, 100), 0, 200) / 100,
        rise: clampN(num(grp.rise, 45), 0, 100) / 100,
        radius: clampN(num(grp.radius, 90), 20, 300) / 100,
        thickness: clampN(num(grp.thickness, 100), 20, 400) / 100,
        falloff: clampN(num(grp.falloff, 250), 50, 600) / 100,
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false })
        if (!gl) {
            console.error("PredictiveArcHorizon: WebGL unavailable")
            return
        }

        const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
        if (!vs || !fs) return
        const prog = gl.createProgram()
        if (!prog) return
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error("PredictiveArcHorizon link:", gl.getProgramInfoLog(prog))
            return
        }
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const aPos = gl.getAttribLocation(prog, "a_pos")
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        const locs: Record<string, WebGLUniformLocation | null> = {}
        const u = (name: string) => {
            if (!(name in locs)) locs[name] = gl.getUniformLocation(prog, name)
            return locs[name]
        }

        let raf = 0
        let last = performance.now()
        let clock = 0
        const PTR_RATE = 6.0
        
        // Audio processing state
        let smoothedBass = 0;
        let smoothedMid = 0;
        let smoothedTreble = 0;
        let smoothedBeat = 0;
        let beatThreshold = 0.5;
        let beatHold = 0;

        // Visibility tracking for performance
        let isVisible = true;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]) {
                isVisible = entries[0].isIntersecting;
            }
        }, { threshold: 0 });
        observer.observe(canvas);

        const render = (now: number) => {
            if (!isVisible) {
                last = now;
                raf = requestAnimationFrame(render);
                return;
            }

            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const v = vRef.current

            clock = (clock + dt * 0.9 * (v.speed as number)) % 6283

            const audio = (window as any).__globalAudio;
            const isPlaying = audio && !audio.paused && !audio.ended;

            const ptr = ptrRef.current
            if (isPlaying) {
                ptr.tx = 0.5;
                ptr.ty = 0.5;
            }

            const k = 1 - Math.exp(-dt * PTR_RATE)
            ptr.x += (ptr.tx - ptr.x) * k
            ptr.y += (ptr.ty - ptr.y) * k

            // Limit DPR to 1.0 for massive GPU performance boost on pixel shader
            const dpr = 1.0; 
            const cw = sizeRef.current.w || canvas.clientWidth || 1200
            const ch = sizeRef.current.h || canvas.clientHeight || 800
            const bw = Math.max(1, Math.round(cw * dpr))
            const bh = Math.max(1, Math.round(ch * dpr))
            if (canvas.width !== bw || canvas.height !== bh) {
                canvas.width = bw
                canvas.height = bh
            }
            gl.viewport(0, 0, bw, bh)

            // Audio Analysis
            let rawBass = 0;
            let rawMid = 0;
            let rawTreble = 0;
            let rawBeat = 0;

            const analyser = (window as any).__globalAudioAnalyser;
            const dataArray = (window as any).__globalAudioDataArray;

            if (analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray);
                
                let bassSum = 0;
                for (let i = 0; i <= 2; i++) bassSum += dataArray[i];
                rawBass = Math.min(1.0, bassSum / (3 * 255));

                let midSum = 0;
                for (let i = 3; i <= 23; i++) midSum += dataArray[i];
                rawMid = Math.min(1.0, midSum / (21 * 255));

                let trebleSum = 0;
                for (let i = 24; i <= 140; i++) trebleSum += dataArray[i];
                rawTreble = Math.min(1.0, trebleSum / (117 * 255));
                
                // Beat detection
                if (rawBass > beatThreshold && beatHold === 0) {
                    rawBeat = 1.0;
                    beatThreshold = Math.min(0.9, rawBass * 1.1);
                    beatHold = 20; // Hold for a few frames to prevent double triggers
                } else {
                    if (beatHold > 0) beatHold--;
                    beatThreshold = Math.max(0.5, beatThreshold - 0.01);
                }
            }

            // Smooth values (lerp)
            const lerpFactor = Math.min(1.0, dt * 10.0);
            smoothedBass += (rawBass - smoothedBass) * lerpFactor;
            smoothedMid += (rawMid - smoothedMid) * lerpFactor;
            smoothedTreble += (rawTreble - smoothedTreble) * lerpFactor;

            if (rawBeat > smoothedBeat) {
                smoothedBeat += (rawBeat - smoothedBeat) * Math.min(1.0, dt * 25.0); // fast attack
            } else {
                smoothedBeat += (rawBeat - smoothedBeat) * Math.min(1.0, dt * 5.0); // slow decay (~200ms)
            }

            const pitchCss = Math.min(bw, bh) / dpr / (v.density as number)

            gl.uniform2f(u("uRes"), bw, bh)
            gl.uniform1f(u("uTime"), clock)
            gl.uniform1f(u("uDpr"), dpr)
            gl.uniform1f(u("uCell"), Math.max(2, pitchCss * dpr))
            gl.uniform1f(u("uDot"), pitchCss * 1.2 * (v.dotSize as number))
            gl.uniform1f(u("uA"), v.rise as number)
            gl.uniform1f(u("uB"), v.radius as number)
            gl.uniform1f(u("uC"), v.thickness as number)
            gl.uniform1f(u("uD"), v.falloff as number)
            gl.uniform1f(u("uHover"), v.hover as number)
            gl.uniform2f(u("uPtr"), ptr.x * (bw / dpr), ptr.y * (bh / dpr))
            
            // Apply a maximum 25% influence scalar as requested
            gl.uniform1f(u("uBass"), smoothedBass * 0.25);
            gl.uniform1f(u("uMid"), smoothedMid * 0.25);
            gl.uniform1f(u("uTreble"), smoothedTreble * 0.25);
            gl.uniform1f(u("uBeat"), smoothedBeat * 0.25);
            const cg = parseColor(v.bg as string, [0.012, 0.012, 0.012])
            const cb = parseColor(v.base as string, [0.169, 0.055, 0.369])
            const ca = parseColor(v.accent as string, [0.627, 0.314, 1.0])
            const chh = parseColor(v.high as string, [1, 1, 1])
            gl.uniform3f(u("uBg"), cg[0], cg[1], cg[2])
            gl.uniform3f(u("uBase"), cb[0], cb[1], cb[2])
            gl.uniform3f(u("uAccent"), ca[0], ca[1], ca[2])
            gl.uniform3f(u("uHigh"), chh[0], chh[1], chh[2])

            gl.drawArrays(gl.TRIANGLES, 0, 3)
            raf = requestAnimationFrame(render)
        }

        const track = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect()
            if (r.width <= 0 || r.height <= 0) return
            ptrRef.current.tx = clampN((e.clientX - r.left) / r.width, 0, 1)
            ptrRef.current.ty = clampN((e.clientY - r.top) / r.height, 0, 1)
        }
        const onLeave = () => {
            ptrRef.current.tx = 0.5
            ptrRef.current.ty = 0.5
        }
        canvas.addEventListener("pointermove", track)
        canvas.addEventListener("pointerenter", track)
        canvas.addEventListener("pointerleave", onLeave)

        raf = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(raf)
            observer.disconnect()
            canvas.removeEventListener("pointermove", track)
            canvas.removeEventListener("pointerenter", track)
            canvas.removeEventListener("pointerleave", onLeave)
        }
    }, [])

    return (
        <div
            style={{
                position: "relative",
                overflow: "hidden",
                background,
                minWidth: 0,
                minHeight: 0,
                width: typeof width === "number" && width > 0 ? width : "100%",
                height: typeof height === "number" && height > 0 ? height : "100%",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

const __originkitPresetProps = {
  "background": "#02040A",
  "baseColor": "#8E0C15",
  "accentColor": "#B31195",
  "highlight": "#E8F6FF",
  "density": 40,
  "dotSize": 100,
  "speed": 50,
  "hover": 100,
  "horizon": {
    "rise": 45,
    "radius": 90,
    "falloff": 250,
    "thickness": 100
  }
};

export default function PredictiveArcHorizon(props: any) {
  return <__OriginkitBase_PredictiveArcHorizon {...__originkitPresetProps as any} {...props} />;
}
