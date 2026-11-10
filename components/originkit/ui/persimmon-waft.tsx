/* eslint-disable */
"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

/*
 * PersimmonWaft — living oranda goldfish on black water.
 *
 * Built after a 720×1280 phone clip of a pearly oranda (orange wen, pale
 * gold scaled body, long translucent double tail) drifting on pure black.
 * Nothing from the clip ships with the component: each fish is generated in
 * WebGL2 — a body swept along a bending spine with a lumpy hood, overlapping
 * scales and a domed eye, and nine ray-and-membrane fins whose rays are
 * integrated per vertex so they ripple, trail and droop with real lag.
 * The clip was measured only to tune proportions (body 0.63 deep per body
 * length, tail ≈ 0.9 body lengths, eye at 15% of the body) and colours
 * (head ≈ rgb 228,172,56, back ≈ 238,167,107, fins gold to dark brown).
 *
 * One fish at a time, chosen from two: the clip's oranda and a red-cap pearl
 * oranda. It swims on its own (the oranda opens with the clip's turn from facing the
 * camera to a side view), follows the cursor and darts off at a sudden
 * flick. Its fins move as soft rays do: slow travelling waves that grow
 * toward the tips, a beat that eases between paces, never a flicker.
 */

// ---------------------------------------------------------------- types

type Variant = "oranda" | "redcap"

interface FishColors {
    cap: string
    body: string
    fins: string
}

interface Adjust {
    hue: number
    saturation: number
    brightness: number
}

interface Placement {
    x: number
    y: number
    angle: number
    tilt: number
}

interface Advanced {
    tailLength: number
    scaleSize: number
    finSway: number
    beatRate: number
    lightAngle: number
    sheen: number
    lens: number
    cursorLight: number
}

export interface PersimmonWaftProps {
    /** Which fish swims here: the clip's oranda or a red-cap pearl oranda. */
    variant?: Variant
    /** Water colour behind the fish. */
    background?: string
    /** Bubbles let out of the mouth every few breaths. */
    bubbles?: boolean
    /** Snout-to-tail length of the fish, as a share of the frame. */
    size?: number
    /** The oranda's hood, body and fin colours. */
    orandaColors?: Partial<FishColors>
    /** The red-cap oranda's hood, body and fin colours. */
    redCapColors?: Partial<FishColors>
    /** Hue, saturation and brightness of the whole fish. */
    adjust?: Partial<Adjust>
    /** Where the fish's water sits in the frame, and how it is turned. */
    placement?: Partial<Placement>
    /** Swim to the cursor (and dart to a tap). */
    follow?: boolean
    /** How keenly the fish chases the cursor. */
    eagerness?: number
    /** Pace of its own wandering. */
    speed?: number
    /** How much of the frame it wanders over. */
    roam?: number
    /** Tuning constants behind the look. */
    advanced?: Partial<Advanced>
    style?: CSSProperties
}

// ---------------------------------------------------------------- defaults

const REF_W = 1200
const REF_H = 800
const REF_ASPECT = REF_W / REF_H

const DEFAULTS = {
    variant: "oranda",
    background: "#000000",
    bubbles: true,
    size: 50,
    follow: true,
    eagerness: 10,
    speed: 5,
    roam: 6,
}
// The clip's oranda: orange skin under a metallic gold finish, the hood a
// shade deeper.
const DEFAULT_ORANDA_COLORS: FishColors = { cap: "#F5841C", body: "#F08A2A", fins: "#F0A050" }
// A pearl oranda with a red cap.
const DEFAULT_REDCAP_COLORS: FishColors = { cap: "#D8371A", body: "#F2DFC8", fins: "#F0D2B4" }
const DEFAULT_ADJUST: Adjust = { hue: 0, saturation: 100, brightness: 100 }
const DEFAULT_PLACEMENT: Placement = { x: 0, y: 0, angle: 0, tilt: 0 }
const DEFAULT_ADVANCED: Advanced = {
    tailLength: 0.9,
    scaleSize: 100,
    finSway: 100,
    beatRate: 0.7,
    lightAngle: -25,
    sheen: 100,
    lens: 22,
    cursorLight: 100,
}

// ---------------------------------------------------------------- constants

const STEP = 1 / 120 // longest physics substep, s
const MAX_DPR = 2
const PIXEL_CAP = 4.2e6
// Longest the fish is ever drawn, in device px. Its cost is the pixels it
// covers, so a big fish on a dense screen draws a little coarser rather
// than slower; soft fins and skin cannot tell 2× from 1.25× at that size.
const FISH_PX_CAP = 900
const QUALITY_FLOOR = 0.6
const PITCH_MAX = 0.55
// Snout sits half a body length ahead of the body's centre.
const HEAD_OFF = 0.5

// ---------------------------------------------------------------- helpers

type V3 = [number, number, number]

function clamp(x: number, a: number, b: number) {
    return x < a ? a : x > b ? b : x
}
function num(v: unknown, d: number) {
    const n = typeof v === "number" ? v : parseFloat(String(v))
    return Number.isFinite(n) ? n : d
}
function smooth(a: number, b: number, x: number) {
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}
function mulberry(seed: number) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function srgbToLin(c: number) {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function resolveRGB(el: HTMLElement, c: string): V3 {
    const probe = document.createElement("span")
    probe.style.color = c
    probe.style.display = "none"
    el.appendChild(probe)
    const m = getComputedStyle(probe).color.match(/[\d.]+/g)
    el.removeChild(probe)
    if (!m || m.length < 3) return [255, 255, 255]
    return [+m[0], +m[1], +m[2]]
}
function norm3(v: V3): V3 {
    const l = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / l, v[1] / l, v[2] / l]
}
function cross3(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

// Small 3D value noise for the hood's lumps (CPU, mesh build only).
function hash3(x: number, y: number, z: number) {
    let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function vnoise3(x: number, y: number, z: number) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const iz = Math.floor(z)
    let fx = x - ix
    let fy = y - iy
    let fz = z - iz
    fx = fx * fx * (3 - 2 * fx)
    fy = fy * fy * (3 - 2 * fy)
    fz = fz * fz * (3 - 2 * fz)
    const l = (a: number, b: number, t: number) => a + (b - a) * t
    return l(
        l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy),
        l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy),
        fz
    )
}

// ---------------------------------------------------------------- body shape

// A species' body: side profile per body length (snout s=0 → peduncle s=1)
// as knots of [s, half height, centre-line height, half width], the lengths
// of the rounded caps at either end, whether it grows a hood, and its eye
// (x forward from mid-body, y up, radius).
interface Shape {
    knots: number[][]
    snout: number
    butt: number
    hood: boolean
    eye: V3
}

// The clip's oranda, traced off its profile frame. A small head (0.18 at the
// eye), deepest at s≈0.6 (0.62 body lengths tall), the belly hanging low and
// the peduncle carried high.
const ORANDA_KNOTS: number[][] = [
    [0.0, 0.07, -0.04, 0.062],
    [0.08, 0.128, -0.006, 0.112],
    [0.16, 0.18, 0.012, 0.158],
    [0.25, 0.213, 0.008, 0.188],
    [0.35, 0.245, 0.0, 0.205],
    [0.45, 0.283, -0.008, 0.228],
    [0.55, 0.31, -0.015, 0.24],
    [0.65, 0.308, -0.008, 0.232],
    [0.75, 0.266, 0.01, 0.195],
    [0.85, 0.198, 0.027, 0.14],
    [0.93, 0.126, 0.05, 0.085],
    [1.0, 0.076, 0.064, 0.05],
]
const ORANDA: Shape = { knots: ORANDA_KNOTS, snout: 0.1, butt: 0.035, hood: true, eye: [0.5 - 0.155, 0.008, 0.048] }

const SE_P = 2.3 // cross-section superellipse exponent

// The mouth, after a photographed goldfish, in rest body coordinates (s back
// from the snout, y up). The slit where the lips meet runs from just under
// the snout's tip back to a corner below and ahead of the eye, dipping into
// a short hook there. MOUTH below is the same line for the shaders.
const M_CORNER = 0.1
function mouthY(s: number) {
    return -0.052 - 0.014 * smooth(0, M_CORNER, s) - 0.012 * smooth(M_CORNER - 0.02, M_CORNER + 0.01, s)
}
// The upper lip's thickness above the slit (the lower lip's is 0.7 of it),
// full at the snout and thinning to the corner.
function lipT(s: number) {
    return 0.045 - 0.029 * smooth(0, M_CORNER, s)
}
// A rounded swell across a band, 0 at both edges and 1 in the middle.
function lipBump(u: number) {
    const v = clamp(u, 0, 1)
    return 16 * v * v * (1 - v) * (1 - v)
}

function knot(sh: Shape, s: number, k: number) {
    const KNOTS = sh.knots
    const n = KNOTS.length
    const x = clamp(s, 0, 1)
    let i = 0
    while (i < n - 2 && KNOTS[i + 1][0] < x) i++
    const s0 = KNOTS[i][0]
    const s1 = KNOTS[i + 1][0]
    const p0 = KNOTS[i][k]
    const p1 = KNOTS[i + 1][k]
    const m = (j: number) => {
        const a = KNOTS[Math.max(0, j - 1)]
        const b = KNOTS[Math.min(n - 1, j + 1)]
        return (b[k] - a[k]) / (b[0] - a[0])
    }
    const h = s1 - s0
    const t = (x - s0) / h
    const t2 = t * t
    const t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * h * m(i + 1)
}
// Half height, centre, half width at s, with round caps at both ends.
function prof(sh: Shape, s: number): V3 {
    let g = 1
    if (s < sh.snout) {
        const q = 1 - s / sh.snout
        g = Math.sqrt(Math.max(0, 1 - q * q))
    } else if (s > 1) {
        const q = (s - 1) / sh.butt
        g = Math.sqrt(Math.max(0, 1 - q * q))
    }
    return [knot(sh, s, 1) * g, knot(sh, s, 2), knot(sh, s, 3) * g]
}
function spow(x: number, p: number) {
    return Math.sign(x) * Math.pow(Math.abs(x), p)
}
// A point on the rest body's skin at normalised height yn on side sigma.
function skin(sh: Shape, s: number, yn: number, sigma: number): V3 {
    const [hh, cy, hw] = prof(sh, s)
    const zn = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(yn), SE_P)), 1 / SE_P)
    return [0.5 - s, cy + hh * yn, sigma * hw * zn]
}

interface BodyMesh {
    data: Float32Array
    index: Uint16Array
}

const NS = 132
const NT = 88

function buildBody(sh: Shape): BodyMesh {
    const [EYE_X, EYE_Y, EYE_R] = sh.eye
    const P = new Float64Array(NS * NT * 3)
    const SYZ = new Float32Array(NS * NT * 3)
    for (let i = 0; i < NS; i++) {
        const s = (1 + sh.butt) * Math.pow(i / (NS - 1), 1.25)
        const [hh, cy, hw] = prof(sh, s)
        for (let j = 0; j < NT; j++) {
            const th = (j / NT) * Math.PI * 2
            const yn = spow(Math.sin(th), 2 / SE_P)
            const zn = spow(Math.cos(th), 2 / SE_P)
            let x = 0.5 - s
            let y = cy + hh * yn
            let z = hw * zn
            // how near the lips this point is
            const dm = y - mouthY(s)
            const nearMouth = (1 - smooth(M_CORNER, M_CORNER + 0.03, s)) * Math.exp(-((dm / 0.035) ** 2))
            // Oranda hood: lumpy growth over the crown and cheeks, clear of
            // the mouth and sunk round the eye so the eye sits in a socket.
            const ex = x - EYE_X
            const ey = y - EYE_Y
            const re = Math.hypot(ex, ey)
            const hood = sh.hood ? smooth(0.015, 0.07, s) * (1 - smooth(0.25, 0.38, s + 0.05 * yn)) * smooth(-0.7, 0.05, yn) * (1 - nearMouth) : 0
            if (hood > 0) {
                const lump = vnoise3(x * 13 + 3.1, y * 13, z * 13) * 0.65 + vnoise3(x * 29, y * 29 + 7.7, z * 29) * 0.35
                const socket = smooth(EYE_R * 1.05, EYE_R * 1.9, re)
                const d = 0.028 * hood * (0.3 + 0.7 * lump) * (Math.abs(zn) > 0.2 ? socket : 1)
                const ry = hh * yn
                const rz = hw * zn
                const rl = Math.hypot(ry, rz) || 1
                y += (ry / rl) * d
                z += (rz / rl) * d
                x += 0.25 * d * (1 - s / 0.38)
            }
            // The eye: a low dome on each side.
            if (re < EYE_R && Math.abs(zn) > 0.3) {
                const q = re / EYE_R
                z += Math.sign(zn) * 0.016 * Math.sqrt(1 - q * q)
            }
            // The lips: both swell out of the face, fleshy, and at the snout
            // the upper one is pushed forward and the chin set back a touch,
            // so the profile pouts as the photograph's does.
            const lipRun = 1 - smooth(M_CORNER, M_CORNER + 0.02, s)
            const bU = lipBump(dm / lipT(s)) * lipRun
            const bL = lipBump(-dm / (0.7 * lipT(s))) * lipRun
            // (spread over the lip's whole front, so it rounds off blunt
            // rather than drawing the tip out to a point)
            const front = 1 - smooth(0.01, 0.1, s)
            x += front * (0.007 * bU - 0.004 * smooth(-0.004, -0.03, dm))
            const ly = y - cy
            const ll = Math.hypot(ly, z) || 1
            y += (ly / ll) * (0.008 * bU + 0.005 * bL)
            z += (z / ll) * (0.008 * bU + 0.005 * bL)
            const k = (i * NT + j) * 3
            P[k] = x
            P[k + 1] = y
            P[k + 2] = z
            SYZ[k] = s
            SYZ[k + 1] = yn
            SYZ[k + 2] = zn
        }
    }
    const data = new Float32Array(NS * (NT + 1) * 9)
    for (let i = 0; i < NS; i++) {
        for (let jj = 0; jj <= NT; jj++) {
            const j = jj % NT
            const k = (i * NT + j) * 3
            let n: V3
            if (i === 0) n = [1, 0, 0]
            else if (i === NS - 1) n = [-1, 0, 0]
            else {
                const a = ((i + 1) * NT + j) * 3
                const b = ((i - 1) * NT + j) * 3
                const c = (i * NT + ((j + 1) % NT)) * 3
                const d = (i * NT + ((j + NT - 1) % NT)) * 3
                const ds: V3 = [P[a] - P[b], P[a + 1] - P[b + 1], P[a + 2] - P[b + 2]]
                const dt: V3 = [P[c] - P[d], P[c + 1] - P[d + 1], P[c + 2] - P[d + 2]]
                n = norm3(cross3(dt, ds))
                const cy = prof(sh, SYZ[k])[1]
                const radial: V3 = [0, P[k + 1] - cy, P[k + 2]]
                if (n[0] * radial[0] + n[1] * radial[1] + n[2] * radial[2] < 0) n = [-n[0], -n[1], -n[2]]
            }
            const o = (i * (NT + 1) + jj) * 9
            data[o] = P[k]
            data[o + 1] = P[k + 1]
            data[o + 2] = P[k + 2]
            data[o + 3] = n[0]
            data[o + 4] = n[1]
            data[o + 5] = n[2]
            data[o + 6] = SYZ[k]
            data[o + 7] = SYZ[k + 1]
            data[o + 8] = SYZ[k + 2]
        }
    }
    const index = new Uint16Array((NS - 1) * NT * 6)
    let q = 0
    for (let i = 0; i < NS - 1; i++) {
        for (let j = 0; j < NT; j++) {
            const a = i * (NT + 1) + j
            const b = a + 1
            const c = a + NT + 1
            const d = c + 1
            // Counter-clockwise seen from outside.
            index[q++] = a
            index[q++] = b
            index[q++] = c
            index[q++] = b
            index[q++] = d
            index[q++] = c
        }
    }
    return { data, index }
}

function buildGrid(nu: number, nv: number) {
    const data = new Float32Array(nu * nv * 2)
    for (let j = 0; j < nv; j++)
        for (let i = 0; i < nu; i++) {
            // Denser toward the root, where the membrane bends least but
            // meets the body; rays bend most at the tip, so keep it even-ish.
            data[(j * nu + i) * 2] = Math.pow(i / (nu - 1), 1.1)
            data[(j * nu + i) * 2 + 1] = j / (nv - 1)
        }
    const index = new Uint16Array((nu - 1) * (nv - 1) * 6)
    let q = 0
    for (let j = 0; j < nv - 1; j++)
        for (let i = 0; i < nu - 1; i++) {
            const a = j * nu + i
            const b = a + 1
            const c = a + nu
            const d = c + 1
            index[q++] = a
            index[q++] = b
            index[q++] = c
            index[q++] = b
            index[q++] = d
            index[q++] = c
        }
    return { data, index }
}

// ---------------------------------------------------------------- fins

interface FinDef {
    sigma: number
    big: boolean
    s0: number
    s1: number
    b0: V3
    b1: V3
    d0: V3
    dm: V3
    d1: V3
    nf: V3
    len: number[]
    rays: number
    // amp, wave number, beat-phase share, own rate (rad/s, two decimals so
    // the wrapped clock stays seamless)
    wave: number[]
    // phase across rays, phase offset, slow billow amp, billow rate (rad/s)
    wave2: number[]
    // in-plane sway: amp, wave number, beat share, own rate (rad/s)
    sway: number[]
    pliancy: number
    droop: V3
    tone: number // + bright rays, − dark rays
    aBase: number
    aTip: number
    rim: number
    capMix: number
    tail: boolean
    flap: number // pectoral sculling amplitude, rad
}

function buildOrandaFins(sh: Shape): FinDef[] {
    const fins: FinDef[] = []
    const up = (s: number, inset: number): V3 => {
        const [hh, cy] = prof(sh, s)
        return [0.5 - s, cy + hh - inset, 0]
    }
    // Dorsal: a tall comb of dark rays from mid-back to just short of the
    // peduncle, raked back and curling at the tips (the clip's dorsal rays
    // read dark brown with almost no membrane between them).
    fins.push({
        sigma: 1,
        big: false,
        s0: 0.5,
        s1: 0.93,
        b0: up(0.5, 0.012),
        b1: up(0.93, 0.008),
        d0: norm3([-0.55, 1, 0]),
        dm: norm3([-0.95, 0.8, 0]),
        d1: norm3([-1, 0.2, 0]),
        nf: [0, 0, 1],
        len: [0.37, 0.33, 0.25, 0.16, 0.07],
        rays: 9,
        wave: [0.45, 2.2, 0, 1.31],
        wave2: [-3.0, 0, 0.3, 0.57],
        sway: [0.28, 1.8, 0, 1.03],
        pliancy: 0.45,
        droop: [-0.4, -0.05, 0],
        tone: -1,
        aBase: 0.2,
        aTip: 0.04,
        rim: 0.25,
        capMix: 0.25,
        tail: false,
        flap: 0,
    })
    for (const sg of [1, -1]) {
        const [, cyP] = prof(sh, 0.985)
        // Caudal half: a fan from the peduncle, upper lobe nearly level,
        // lower lobe sagging steeply, forked in the middle and splayed to its
        // side — the double tail that reads as an X head-on.
        fins.push({
            sigma: sg,
            big: true,
            s0: 1,
            s1: 1,
            b0: [0.5 - 0.985, cyP + 0.062, sg * 0.016],
            b1: [0.5 - 0.985, cyP - 0.062, sg * 0.016],
            d0: norm3([-1, 0.22, sg * 0.38]),
            dm: norm3([-1, -0.25, sg * 0.18]),
            d1: norm3([-0.55, -0.9, sg * 0.4]),
            nf: [0, 0, sg],
            len: [0.86, 0.9, 0.56, 0.82, 0.72],
            rays: 26,
            wave: [1.35, 2.4, 1, 0],
            wave2: [0.5, sg > 0 ? 0 : Math.PI, 0.28, 0.41],
            sway: [0.7, 2.2, 1, 0],
            pliancy: 1,
            droop: [0, -0.5, 0],
            tone: 0.12,
            aBase: 0.92,
            aTip: 0.24,
            rim: 0.9,
            capMix: 0.55,
            tail: true,
            flap: 0,
        })
        // Pectoral: small fans low behind the gill, sculling alternately.
        const p0 = skin(sh, 0.3, -0.42, sg)
        const p1 = skin(sh, 0.335, -0.55, sg)
        fins.push({
            sigma: sg,
            big: false,
            s0: 0.3,
            s1: 0.335,
            b0: p0,
            b1: p1,
            d0: norm3([-0.2, -0.75, sg * 0.75]),
            dm: norm3([-0.45, -0.75, sg * 0.6]),
            d1: norm3([-0.75, -0.6, sg * 0.45]),
            nf: norm3(cross3(norm3([-0.2, -0.75, sg * 0.75]), norm3([-0.75, -0.6, sg * 0.45]))),
            len: [0.2, 0.25, 0.26, 0.22, 0.15],
            rays: 10,
            wave: [0.6, 2.2, 0, 0],
            wave2: [1.2, 0, 0.3, 0.79],
            sway: [0.4, 1.8, 0, 1.43],
            pliancy: 0.6,
            droop: [0, -0.1, 0],
            tone: 0.2,
            aBase: 0.45,
            aTip: 0.12,
            rim: 0.6,
            capMix: 0.45,
            tail: false,
            flap: 0.32,
        })
        // Pelvic: long paired fins hanging from the belly.
        fins.push({
            sigma: sg,
            big: false,
            s0: 0.58,
            s1: 0.66,
            b0: skin(sh, 0.58, -0.93, sg),
            b1: skin(sh, 0.66, -0.91, sg),
            d0: norm3([-0.15, -1, sg * 0.3]),
            dm: norm3([-0.55, -0.9, sg * 0.26]),
            d1: norm3([-1, -0.55, sg * 0.2]),
            nf: [0, 0, sg],
            len: [0.42, 0.46, 0.42, 0.34, 0.22],
            rays: 9,
            wave: [0.45, 2.2, 0.5, 0.37],
            wave2: [1.4, sg > 0 ? 0 : 1.3, 0.3, 0.53],
            sway: [0.35, 2.0, 0.5, 0.67],
            pliancy: 0.8,
            droop: [0, -0.05, 0],
            tone: 0.32,
            aBase: 0.72,
            aTip: 0.26,
            rim: 0.7,
            capMix: 0.35,
            tail: false,
            flap: 0,
        })
        // Anal: the fancy goldfish's paired anal fins, just ahead of the tail.
        fins.push({
            sigma: sg,
            big: false,
            s0: 0.84,
            s1: 0.93,
            b0: skin(sh, 0.84, -0.9, sg),
            b1: skin(sh, 0.93, -0.85, sg),
            d0: norm3([-0.3, -1, sg * 0.28]),
            dm: norm3([-0.75, -0.8, sg * 0.24]),
            d1: norm3([-1, -0.35, sg * 0.18]),
            nf: [0, 0, sg],
            len: [0.4, 0.44, 0.38, 0.3, 0.18],
            rays: 8,
            wave: [0.65, 2.2, 0.9, 0],
            wave2: [0.9, sg > 0 ? 0.4 : 1.9, 0.25, 0.47],
            sway: [0.4, 2.0, 0.8, 0],
            pliancy: 0.9,
            droop: [0, -0.1, 0],
            tone: 0.32,
            aBase: 0.72,
            aTip: 0.26,
            rim: 0.7,
            capMix: 0.4,
            tail: false,
            flap: 0,
        })
    }
    return fins
}


// ---------------------------------------------------------------- shaders

const BEND = /* glsl */ `
uniform vec4 uBody; // beat phase, beat amplitude, turn bend, gulp
// Lateral offset of the spine: a tail-weighted travelling wave with a little
// head recoil, plus the C-bend of a turn.
float latD(float s) {
    float ph = uBody.x;
    float sc = max(s, 0.0);
    return uBody.y * (0.085 * pow(sc, 2.4) * sin(ph - 3.0 * sc) - 0.012 * (1.0 - sc) * sin(ph + 0.9))
         + uBody.z * (1.4 * pow(max(sc - 0.2, 0.0), 2.0) - 0.03);
}
void bendFrame(float s, out vec3 sp, out vec3 ex, out vec3 ez) {
    float dp = (latD(s + 0.01) - latD(s - 0.01)) * 50.0;
    float m = inversesqrt(1.0 + dp * dp);
    ex = vec3(1.0, 0.0, -dp) * m;
    ez = vec3(dp, 0.0, 1.0) * m;
    sp = vec3(0.5 - s, 0.0, latD(s));
}
`

const MOUTH = /* glsl */ `
const float M_CORNER = ${M_CORNER.toFixed(3)};
float mouthY(float s) {
    return -0.052 - 0.014 * smoothstep(0.0, M_CORNER, s) - 0.012 * smoothstep(M_CORNER - 0.02, M_CORNER + 0.01, s);
}
float lipT(float s) {
    return 0.045 - 0.029 * smoothstep(0.0, M_CORNER, s);
}
`

const TONE = /* glsl */ `
vec3 tone(vec3 c) {
    c = 1.0 - exp(-max(c, vec3(0.0)));
    return pow(c, vec3(1.0 / 2.2));
}
`

const BODY_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec3 aSYZ;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uVP;
${BEND}
${MOUTH}
out vec3 vRest;
out vec3 vSYZ;
out vec3 vN;
out vec3 vV;
void main() {
    float s = aSYZ.x;
    vec3 sp, ex, ez;
    bendFrame(s, sp, ex, ez);
    // Gulp: the lower jaw drops, hinged at the corner of the mouth, and the
    // skin across the slit stretches into the opening.
    vec3 rest = aPos;
    float below = 1.0 - smoothstep(-0.005, 0.005, aPos.y - mouthY(s));
    rest.y -= uBody.w * 0.016 * below * (1.0 - smoothstep(0.0, M_CORNER, s));
    vec3 rel = rest - vec3(0.5 - s, 0.0, 0.0);
    vec3 P = sp + ex * rel.x + vec3(0.0, rel.y, 0.0) + ez * rel.z;
    vec3 N = ex * aNrm.x + vec3(0.0, aNrm.y, 0.0) + ez * aNrm.z;
    vec4 wp = uModel * vec4(P, 1.0);
    vV = (uView * wp).xyz;
    vN = mat3(uView) * (mat3(uModel) * N);
    vRest = aPos;
    vSYZ = aSYZ;
    gl_Position = uVP * wp;
}
`

const BODY_FS = /* glsl */ `#version 300 es
precision highp float;
in vec3 vRest;
in vec3 vSYZ;
in vec3 vN;
in vec3 vV;
uniform vec3 uCap;
uniform vec3 uSkin;
uniform vec3 uL;
uniform mat3 uNV;
uniform vec4 uLook; // sheen, glow, gulp, scale size
uniform mat3 uAdj;  // hue, saturation and brightness, as one matrix
uniform vec3 uEye;  // eye centre x, y and radius, body-local
uniform vec4 uPL;   // cursor lamp: view-space position, strength
uniform float uPLk; // its falloff
out vec4 o;
${TONE}
${MOUTH}
float h21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
float vn2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
    float s = vSYZ.x;
    float yn = vSYZ.y;
    float zn = vSYZ.z;
    float side = zn >= 0.0 ? 1.0 : -1.0;
    vec3 N = normalize(vN);
    vec3 V = normalize(-vV);

    // ---- pigment: orange hood; orange skin under a gold metallic finish,
    // deeper along the back, golden cream under the belly.
    // the hood ends along the gill cover: an arc bulging toward the tail
    float capEdge = 0.255 + 0.085 * (1.0 - yn * yn) + 0.02 * yn + 0.03 * (vn2(vec2(yn * 4.0, 3.7)) - 0.5);
    float cap = 1.0 - smoothstep(capEdge - 0.07, capEdge + 0.06, s);
    float mxc = max(max(uCap.r, uCap.g), max(uCap.b, 1e-4));
    vec3 capHue = uCap / mxc;
    vec3 orange = uSkin;
    // the finish: metallic gold
    vec3 goldM = mix(uSkin, vec3(1.0, 0.7, 0.2), 0.5);
    vec3 cream = mix(uSkin, vec3(1.0, 0.8, 0.42), 0.5);
    vec3 alb = orange;
    float mottle = vn2(vec2(s * 6.0, yn * 2.6) + 11.0);
    alb = mix(alb, goldM, 0.3 * smoothstep(0.4, 0.85, mottle));
    alb = mix(alb, mix(orange, uCap, 0.45) * 0.92, smoothstep(0.4, 0.85, yn) * smoothstep(0.28, 0.42, s));
    alb = mix(alb, cream, smoothstep(-0.35, -0.85, yn) * 0.7 * (1.0 - smoothstep(0.5, 0.78, s)));
    alb = mix(alb, mix(orange, uCap, 0.5), smoothstep(0.86, 0.99, s));
    // the hood itself, with a paler throat
    vec3 capC = mix(uCap, mix(uCap, cream, 0.35), smoothstep(-0.4, -0.95, yn));
    alb = mix(alb, capC, cap);

    // ---- scales: overlapping discs, front row on top, so each shows its
    // free rim toward the tail. Rows follow the body's contour, so the scales
    // shrink toward the peduncle as on the fish.
    float ssz = uLook.w;
    vec2 g = vec2(s / (0.03 * ssz), yn * 10.0 / ssz);
    float fw = length(fwidth(g));
    float detail = 1.0 - smoothstep(0.35, 0.8, fw);
    float scaleOn = smoothstep(capEdge, capEdge + 0.05, s) * (1.0 - smoothstep(0.96, 1.01, s)) * (1.0 - smoothstep(0.82, 0.97, abs(yn)));
    vec2 cell = vec2(0.0);
    vec2 dl = vec2(0.0);
    const float R = 0.78;
    bool got = false;
    for (int i = -1; i <= 0; i++) {
        float cx = floor(g.x) + float(i);
        float off = mod(cx, 2.0) * 0.5;
        float ry = floor(g.y - off);
        for (int j = -1; j <= 1; j++) {
            vec2 c = vec2(cx + 0.5, ry + float(j) + 0.5 + off);
            vec2 d = g - c;
            if (!got && dot(d, d) < R * R) {
                got = true;
                cell = c;
                dl = d;
            }
        }
    }
    float rr = length(dl) / R;
    float su = dl.x / R;
    float sv = dl.y / R;
    float hs = h21(cell);
    float hs2 = h21(cell + 17.3);
    float sk = scaleOn * detail;
    // gold reflective band along the free (rear) edge; a shadowed pocket
    // where the scale tucks under the row in front; fine radii fanning from
    // the scale's focus
    float freeRim = smoothstep(0.6, 0.92, rr) * smoothstep(-0.15, 0.35, su);
    float pocket = smoothstep(0.5, 0.92, rr) * smoothstep(0.1, -0.5, su);
    float radii = (0.5 + 0.5 * sin(atan(sv, su + 0.75) * 18.0)) * smoothstep(0.25, 0.7, rr) * (1.0 - smoothstep(0.3, 0.6, fw));
    alb *= mix(1.0, 0.86 + 0.26 * hs, sk);
    alb *= 1.0 - 0.3 * pocket * sk;
    alb *= 1.0 - 0.07 * radii * sk;
    // the free edges catch gold
    alb = mix(alb, goldM, 0.4 * freeRim * sk);
    // each scale is a shallow dome set at its own small angle: the diffuse
    // light sees a smoothed version, the gold mirror and glints the full one
    vec3 tiltL = vec3(dl.x * 0.24 + (hs - 0.5) * 0.18, dl.y * 0.2 + (hs2 - 0.5) * 0.18, 0.0) * sk;
    vec3 Ns = normalize(N + uNV * tiltL);
    N = normalize(N + uNV * (tiltL * 0.35));

    // ---- mouth: a thick upper lip, deeper and redder than the face, full
    // at the snout and tapering back to the corner; a paler lower lip; the
    // dark slit between them, which parts at the front as it gulps. The
    // lips are lit through their own relief, and look wet.
    float nearMouth = 0.0;
    float lipWet = 0.0;
    if (s < 0.14) {
        float run = 1.0 - smoothstep(M_CORNER, M_CORNER + 0.02, s);
        float taper = smoothstep(0.0, M_CORNER, s);
        float gape = uLook.z * (1.0 - taper);
        float d = vRest.y - mouthY(s);              // above the slit is +
        nearMouth = run * exp(-pow(d / 0.04, 2.0));
        // relief: each lip a rounded swell across its band (as the mesh's),
        // meeting in a valley at the slit
        float tU = lipT(s);
        float tL = 0.7 * tU;
        float uU = clamp(d / tU, 0.0, 1.0);
        float uL = clamp(-d / tL, 0.0, 1.0);
        float bU = 16.0 * uU * uU * (1.0 - uU) * (1.0 - uU);
        float bL = 16.0 * uL * uL * (1.0 - uL) * (1.0 - uL);
        float dbU = 32.0 * uU * (1.0 - uU) * (1.0 - 2.0 * uU) / tU;
        float dbL = -32.0 * uL * (1.0 - uL) * (1.0 - 2.0 * uL) / tL;
        float dhd = (0.006 * dbU + 0.004 * dbL) * run;
        float dyds = (mouthY(s + 0.002) - mouthY(s - 0.002)) / 0.004;
        vec3 Ty = uNV * vec3(0.0, 1.0, 0.0);
        vec3 Tx = uNV * vec3(1.0, 0.0, 0.0);
        Ty -= N * dot(Ty, N);
        Tx -= N * dot(Tx, N);
        // along the body, s runs backward (-x), so d grows with x by dy/ds
        N = normalize(N - (Ty * dhd + Tx * (dhd * dyds)));
        // colour: the lips a light, warm tone of the face itself, so they
        // blend in rather than sit on it, the upper a shade richer than the
        // lower; a soft shadow tucked under the upper lip; and in the slit a
        // warm dark, at least a pixel wide so it reads at any size
        float mU = smoothstep(-0.001, 0.004, d) * (1.0 - smoothstep(tU * 0.8, tU * 1.25, d)) * run;
        float mL = (1.0 - smoothstep(-0.004, 0.001, d)) * (1.0 - smoothstep(tL * 0.8, tL * 1.3, -d)) * run;
        vec3 lipC = mix(alb, cream, 0.32) * vec3(1.08, 0.98, 0.94);
        vec3 jawC = mix(alb, cream, 0.5) * 1.05;
        alb = mix(alb, lipC, 0.25 * nearMouth * (1.0 - taper));
        alb = mix(alb, lipC, 0.85 * mU);
        alb = mix(alb, jawC, 0.75 * mL);
        alb *= 1.0 - 0.3 * exp(-pow((d + 0.004) / 0.006, 2.0)) * run;
        float slitH = 0.0018 + 0.0035 * gape;
        float pxW = max(fwidth(vRest.y), 1e-5);
        float slit = (1.0 - smoothstep(slitH, slitH + pxW * 1.2, abs(d))) * run * min(1.0, (slitH * 2.0 + pxW * 0.6) / pxW);
        alb = mix(alb, mix(vec3(0.17, 0.06, 0.035), vec3(0.06, 0.012, 0.01), gape), slit * (0.75 + 0.25 * gape));
        lipWet = max(bU, bL) * run;
        Ns = N;
    }

    // ---- wen: fine lumps over the hood, as a bump on the normal
    float wen = cap * smoothstep(0.03, 0.08, s) * smoothstep(-0.6, 0.1, yn) * (1.0 - nearMouth);
    if (wen > 0.0) {
        vec3 q = vRest * 22.0;
        vec3 bump = vec3(vn2(q.yz + 3.1), vn2(q.xz + 7.7), vn2(q.xy + 1.3)) - 0.5;
        q *= 2.3;
        bump += 0.5 * (vec3(vn2(q.yz + 5.3), vn2(q.xz + 2.2), vn2(q.xy + 9.1)) - 0.5);
        N = normalize(N + uNV * bump * 0.9 * wen);
        Ns = N;
    }

    // ---- gill cover crease
    float sg = 0.245 + 0.085 * (1.0 - yn * yn) + 0.015 * yn;
    float dg = s - sg;
    float gillMask = smoothstep(-0.9, -0.55, yn) * (1.0 - smoothstep(0.5, 0.8, yn));
    float crease = exp(-dg * dg / (0.0055 * 0.0055)) * gillMask;
    float lip = smoothstep(0.004, 0.012, dg) * (1.0 - smoothstep(0.012, 0.03, dg)) * gillMask;
    alb *= 1.0 - 0.45 * crease;

    // ---- nostril
    vec2 nd = vec2(vRest.x - (0.5 - 0.072), vRest.y - 0.075);
    alb *= 1.0 - 0.55 * (1.0 - smoothstep(0.006, 0.013, length(nd))) * step(0.3, abs(zn));

    // ---- lighting (view space). The clip's studio lights the fish from
    // above and from below; the black backdrop is in front. So the gilded
    // flank mirrors bright where it faces up or down and shows its orange
    // where it faces the camera, the matte hood is lit all round, and
    // silhouettes fall dark.
    vec3 L = normalize(uL);
    vec3 L2 = normalize(vec3(-0.1, -0.9, 0.25));
    float ndl = dot(N, L);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    // soft boxes wrap round the matte hood; the scaled flank takes them
    // more sharply
    float wr = mix(0.1, 0.65, cap);
    float d1 = max(0.0, (ndl + wr) / (1.0 + wr));
    float d2 = max(0.0, (dot(N, L2) + wr) / (1.0 + wr));
    vec3 H = normalize(L + V);
    float sheen = uLook.x;
    vec3 Rv = reflect(-V, Ns);
    float up = smoothstep(0.2, 0.95, Rv.y);
    float dn = smoothstep(0.3, 0.95, -Rv.y);
    float env = 1.7 * up * up + 1.0 * dn * dn + 0.03;
    float metal = scaleOn * (1.0 - cap) * 0.72;
    float spec = pow(max(dot(N, H), 0.0), 90.0) * 0.55 * (1.0 + 1.5 * lipWet);
    // individual scales flash as the fish turns
    float glint = pow(max(dot(Ns, H), 0.0), 240.0) * step(0.45, hs2) * 3.2 * sk;
    vec3 specC = mix(vec3(1.0, 0.93, 0.78), goldM, 0.45);
    float fres = pow(1.0 - ndv, 2.2);
    vec3 col = alb * (2.2 * d1 + 1.1 * d2 + 0.14) * (1.0 - 0.45 * metal);
    col += goldM * env * metal * 1.75 * sheen * (1.0 + 0.6 * freeRim * sk);
    col *= mix(1.0, 0.45, fres);                        // silhouettes fall away
    col += alb * capHue * fres * 0.3 * uLook.y;        // warm light through thin edges
    col += specC * (spec + glint) * 1.4 * sheen;
    col += alb * lip * 0.2;

    // ---- the cursor's lamp: a soft warm light that makes the scales
    // sparkle wherever it points
    vec3 Lp = uPL.xyz - vV;
    float lpd = dot(Lp, Lp);
    Lp *= inversesqrt(max(lpd, 1e-6));
    float att = uPL.w / (1.0 + lpd * uPLk);
    if (att > 0.002) {
        vec3 Hp = normalize(Lp + V);
        col += alb * att * max(dot(N, Lp), 0.0) * 0.9;
        col += specC * att * (pow(max(dot(Ns, Hp), 0.0), 140.0) * (1.5 + 3.0 * step(0.4, hs)) * sk + pow(max(dot(N, Hp), 0.0), 30.0) * 0.35) * sheen;
    }

    // ---- eye: glossy black pupil in a gold ring, in a domed cornea
    vec2 e = vec2(vRest.x - uEye.x, vRest.y - uEye.y);
    float re = length(e) / uEye.z;
    if (re < 1.3 && abs(zn) > 0.3) {
        float few = max(fwidth(re), 1e-3);
        float inEye = 1.0 - smoothstep(1.0 - few, 1.0 + few, re);
        vec3 ne = vec3(e / uEye.z * 0.9, side * sqrt(max(0.05, 1.0 - min(re, 1.0) * min(re, 1.0) * 0.81)));
        vec3 En = normalize(uNV * ne);
        float ang = atan(e.y, e.x);
        float fib = 0.85 + 0.15 * sin(ang * 23.0 + h21(vec2(floor(ang * 3.7), 1.0)) * 6.0);
        vec3 iris = mix(vec3(0.95, 0.62, 0.1), vec3(0.45, 0.2, 0.02), smoothstep(0.66, 0.97, re)) * fib;
        float pup = 1.0 - smoothstep(0.62 - few, 0.62 + few, re);
        vec3 ec = mix(iris, vec3(0.006, 0.006, 0.009), pup);
        ec *= 1.0 - 0.6 * smoothstep(0.86, 1.0, re);
        float ediff = max(0.0, dot(En, L)) * 1.1 + 0.45;
        vec3 Re = reflect(-V, En);
        float eg = pow(max(dot(Re, L), 0.0), 380.0) * 7.0 + pow(max(dot(Re, normalize(L + vec3(0.6, -0.3, 0.4))), 0.0), 120.0) * 1.2;
        eg += pow(max(dot(Re, Lp), 0.0), 300.0) * att * 6.0; // the lamp in its eye
        vec3 eyeCol = ec * ediff * 1.6 + vec3(eg);
        // the socket's shadow ring
        float ring = smoothstep(0.95, 1.05, re) * (1.0 - smoothstep(1.05, 1.3, re));
        col *= 1.0 - 0.35 * ring;
        col = mix(col, eyeCol, inEye);
    }
    col = max(uAdj * col, 0.0);
    o = vec4(tone(col), 1.0);
}
`

// Ray layout across a fin, shared by both stages so the pleats in the
// geometry and the rays in the shading line up.
const RAYS = /* glsl */ `
uniform vec4 uFinA; // rays, ray tone, base alpha, tip alpha
uniform vec4 uFinB; // rim, seed, glow, margin flutter
float h11(float x) {
    return fract(sin(x * 127.1) * 43758.5453);
}
float vn1(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(h11(i), h11(i + 1.0), f * f * (3.0 - 2.0 * f));
}
// Ray coordinate: integer + 0.5 on a ray, unevenly spaced as real rays are.
float rayX(float v) {
    return v * uFinA.x + 0.22 * (vn1(v * uFinA.x * 0.7 + uFinB.y) - 0.5);
}
`

const FIN_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aUV;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uVP;
uniform vec3 uB0;
uniform vec3 uB1;
uniform vec2 uS;
uniform vec3 uD0;
uniform vec3 uDm;
uniform vec3 uD1;
uniform vec3 uNf;
uniform vec4 uLenA;
uniform float uLenB;
uniform vec4 uWave;  // amp, wave number, beat share, own rate
uniform vec4 uWave2; // across-ray phase, offset, billow amp, billow rate
uniform vec4 uSway;  // in-plane sway: amp, wave number, beat share, own rate
uniform vec3 uDragB;
uniform vec3 uDragT;
uniform float uTime;
uniform float uPleat; // 1 with the fine grids, 0 with the coarse ones
${BEND}
${RAYS}
out vec2 vUV;
out vec3 vN;
out vec3 vV;
float lenAt(float v) {
    float x = v * 4.0;
    float fi = min(floor(x), 3.0);
    float f = x - fi;
    f = f * f * (3.0 - 2.0 * f);
    float a = fi < 0.5 ? uLenA.x : fi < 1.5 ? uLenA.y : fi < 2.5 ? uLenA.z : uLenA.w;
    float b = fi < 0.5 ? uLenA.y : fi < 1.5 ? uLenA.z : fi < 2.5 ? uLenA.w : uLenB;
    return mix(a, b, f);
}
void main() {
    float u = aUV.x;
    float v = aUV.y;
    vec3 base = mix(uB0, uB1, v);
    float iv = 1.0 - v;
    vec3 d = normalize(iv * iv * uD0 + 2.0 * v * iv * uDm + v * v * uD1);
    vec3 n = normalize(uNf - d * dot(uNf, d));
    float L = lenAt(v);
    // Walk the ray from its root: each step bends it out of the fin's plane
    // (a wave running to the tip, plus a slow billow) and toward the water's
    // drag (stronger at the tip), so the membrane trails and ripples. The
    // bend grows smoothly toward the tip, as a soft ray's does.
    vec3 p = base;
    const int K = 12;
    float du = u / float(K);
    for (int i = 0; i < K; i++) {
        float w = (float(i) + 0.5) * du;
        float grow = w * (0.6 + 0.4 * w);
        float ph = uBody.x * uWave.z + uTime * uWave.w - uWave.y * w + uWave2.x * v + uWave2.y;
        float kn = uWave.x * (0.2 + grow) * sin(ph) + uWave2.z * grow * sin(uTime * uWave2.w + 2.3 * v + 1.7 * w);
        // in the fin's own plane: the fan sways and opens, which is what a
        // side view sees of a beat
        float kb = uSway.x * (0.15 + grow) * sin(uBody.x * uSway.z + uTime * uSway.w - uSway.y * w + 1.3 * v + uWave2.y);
        vec3 bp = cross(n, d);
        vec3 dr = mix(uDragB, uDragT, w);
        vec3 dperp = dr - d * dot(dr, d);
        d = normalize(d + (n * kn + bp * kb + dperp * (0.35 + w)) * du);
        n = normalize(n - d * dot(n, d));
        p += d * (L * du);
    }
    // The thin oranda membrane is corrugated, ridged on each ray and dipping
    // between them (it shows edge-on as a rippled outline); every free
    // margin trembles a little, slowly.
    float xr = rayX(v);
    float pleat = uPleat * 0.016 * L * sin(6.2831853 * xr + 1.5707963) * smoothstep(0.0, 0.25, u) * (1.0 - 0.35 * u);
    float flut = 0.018 * L * u * u * u * sin(uTime * 3.77 + xr * 1.3 + uFinB.y) * uFinB.w;
    p += n * (pleat + flut);
    float sr = mix(uS.x, uS.y, v);
    vec3 sp, ex, ez;
    bendFrame(sr, sp, ex, ez);
    vec3 rel = p - vec3(0.5 - sr, 0.0, 0.0);
    vec3 P = sp + ex * rel.x + vec3(0.0, rel.y, 0.0) + ez * rel.z;
    vec3 N = ex * n.x + vec3(0.0, n.y, 0.0) + ez * n.z;
    vec4 wp = uModel * vec4(P, 1.0);
    vV = (uView * wp).xyz;
    vN = mat3(uView) * (mat3(uModel) * N);
    vUV = aUV;
    gl_Position = uVP * wp;
}
`

const FIN_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
in vec3 vN;
in vec3 vV;
uniform vec3 uColB;
uniform vec3 uColF;
uniform vec3 uColR;
uniform vec3 uL;
uniform vec4 uPL; // cursor lamp: view-space position, strength
uniform float uPLk; // its falloff
uniform mat3 uAdj; // hue, saturation and brightness, as one matrix
out vec4 o;
${TONE}
${RAYS}
void main() {
    float u = vUV.x;
    float v = vUV.y;
    vec3 N = normalize(vN);
    vec3 V = normalize(-vV);
    float facing = dot(N, V);
    if (facing < 0.0) N = -N;
    float ndv = abs(facing);
    float rayTone = uFinA.y;

    // ---- rays: thick at the root, tapering, forking once past mid-fin and
    // again near the margin, each fork at its own height
    float x = rayX(v);
    float fx = max(fwidth(x), 1e-4);
    float rayId = floor(x);
    float hw = mix(0.15, 0.045, u);
    float q = abs(fract(x) - 0.5);
    float l1 = 1.0 - smoothstep(hw - fx * 0.5, hw + fx * 0.5, q);
    float fork1 = smoothstep(0.38, 0.58, u + 0.1 * (h11(rayId + uFinB.y) - 0.5));
    float fork2 = smoothstep(0.66, 0.86, u + 0.1 * (h11(rayId * 1.7 + uFinB.y) - 0.5));
    float l2 = 1.0 - smoothstep(hw * 1.1 - fx, hw * 1.1 + fx, abs(fract(x * 2.0) - 0.5));
    float l4 = 1.0 - smoothstep(hw * 1.25 - fx * 2.0, hw * 1.25 + fx * 2.0, abs(fract(x * 4.0) - 0.5));
    float rays = mix(mix(l1, l2, fork1), l4, fork2);
    // rays too fine to resolve average into the membrane instead of shimmering
    float res = 1.0 - smoothstep(0.22, 0.5, fx * (1.0 + fork1 + 2.0 * fork2));
    rays = mix(2.0 * hw, rays, res);
    // jointed rays: fine segments across each one
    float seg = 1.0 - 0.45 * smoothstep(0.8, 0.97, fract(u * 30.0 + h11(rayId + 3.0))) * res;
    // the membrane: faint striations between rays, uneven thickness
    float stri = 0.5 + 0.5 * sin(x * 37.699 + 3.0 * vn1(u * 9.0 + rayId));
    stri = mix(0.5, stri, 1.0 - smoothstep(0.05, 0.12, fx));
    float thick = vn1(u * 6.0 + rayId * 3.1 + uFinB.y) * 0.6 + vn1(u * 17.0 - rayId * 1.3) * 0.4;

    // ---- pleats: tilt the normal across the fin (tangent from screen
    // derivatives) so each fold catches the light on one side
    vec3 dpx = dFdx(vV);
    vec3 dpy = dFdy(vV);
    vec2 dux = dFdx(vUV);
    vec2 duy = dFdy(vUV);
    float det = dux.x * duy.y - dux.y * duy.x;
    vec3 Tv = (dpy * dux.x - dpx * duy.x) * sign(det);
    float tl = length(Tv);
    if (tl > 1e-8) {
        Tv /= tl;
        Tv -= N * dot(Tv, N);
        float pleat = sin(6.2831853 * x) * (0.55 - 0.25 * u) * (1.0 - smoothstep(0.25, 0.5, fx));
        N = normalize(N + Tv * pleat);
    }

    // ---- outline: scalloped between ray tips with a few torn splits and
    // rays running a hair past the membrane
    float gapId = floor(x + 0.5);
    float gap = smoothstep(0.2, 0.5, q);
    float tear = step(0.84, h11(gapId * 3.3 + uFinB.y)) * (0.07 + 0.1 * h11(gapId + 9.0));
    float tipU = 1.0 - (0.035 * gap + tear * gap + 0.035 * vn1(v * uFinA.x * 0.9 + uFinB.y));
    float edge = 1.0 - smoothstep(tipU - 0.1, tipU, u);
    edge = max(edge, rays * res * (1.0 - smoothstep(tipU - 0.03, tipU + 0.018, u)));
    edge *= smoothstep(0.0, 0.03, v) * (1.0 - smoothstep(0.97, 1.0, v));
    if (edge <= 0.0) discard;

    float a = mix(uFinA.z, uFinA.w, smoothstep(0.0, 0.85, u));
    a *= (0.72 + 0.56 * thick) * (0.9 + 0.1 * stri);
    a = mix(a, min(1.0, a + 0.32 + 0.25 * max(-rayTone, 0.0)), rays * seg);
    // light rim along the margin and the outer rays, as the clip's fins have
    float lead = max(1.0 - smoothstep(0.0, 0.07, v), 1.0 - smoothstep(0.93, 1.0, v));
    float rim = (smoothstep(tipU - 0.14, tipU - 0.02, u) + 0.6 * lead * smoothstep(0.1, 0.5, u)) * uFinB.x;
    a = max(a, 0.45 * rim);
    // seen edge-on, a sheet is denser: folds read as bright lines
    a = 1.0 - pow(1.0 - clamp(a, 0.0, 0.98), 1.0 / max(ndv, 0.22));
    a *= edge;

    // ---- colour: the body's colour at the root bleeding out along the
    // rays, then the fin colour, deepening toward the margin
    float root = 1.0 - smoothstep(0.0, 0.32 + 0.3 * rays, u);
    vec3 c = mix(uColF, uColB, root);
    c = mix(c, uColR, rays * seg * (rayTone > 0.0 ? rayTone : -rayTone * 0.85));
    c *= 0.85 + 0.3 * thick;
    // a faint thin-film sheen on the membrane
    vec3 film = 0.5 + 0.5 * cos(6.2831853 * (ndv * 1.3 + u * 0.4 + vec3(0.0, 0.33, 0.67)));
    c = mix(c, c * (0.6 + 0.8 * film), 0.12);
    c += uColR * rim * 0.45;

    vec3 L = normalize(uL);
    float ndl = dot(N, L);
    vec3 H = normalize(L + V);
    // the cursor's lamp
    vec3 Lp = uPL.xyz - vV;
    float lpd = dot(Lp, Lp);
    Lp *= inversesqrt(max(lpd, 1e-6));
    float att = uPL.w / (1.0 + lpd * uPLk);
    // thin fins glow lit from either side; front light a little brighter
    float lit = 0.38 + 0.9 * max(ndl, 0.0) + 0.55 * max(-ndl, 0.0) * uFinB.z;
    float spec = pow(max(dot(N, H), 0.0), 36.0) * 0.18 * (1.0 - 0.5 * rays);
    lit += att * (0.3 + 0.9 * abs(dot(N, Lp))) * uFinB.z;
    spec += att * pow(max(dot(N, normalize(Lp + V)), 0.0), 40.0) * 0.35;
    vec3 col = c * lit * 1.65 + c * spec * 2.0;
    col = max(uAdj * col, 0.0);
    o = vec4(tone(col) * a, a);
}
`

// Bubbles as point sprites (POINTS draw fastest on software GL
// too). Per point: tank position + radius, then kind, alpha, seed.
const PART_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 aP;
layout(location = 1) in vec4 aQ;
uniform mat4 uVP;
uniform mat4 uView;
uniform float uPx;    // device px per tank unit at unit distance
uniform float uMaxPt; // the GPU's largest point
out vec4 vQ;
out vec3 vV;
out float vPx;
void main() {
    vec4 wp = vec4(aP.xyz, 1.0);
    vec4 cp = uVP * wp;
    vV = (uView * wp).xyz;
    float px = 2.0 * aP.w * uPx / max(cp.w, 1e-3);
    vPx = px;
    gl_PointSize = clamp(px + 1.0, 1.0, uMaxPt);
    vQ = aQ;
    // a sprite smaller than its true size gives up opacity, not size
    vQ.y *= min(1.0, px * px);
    gl_Position = cp;
}
`

const PART_FS = /* glsl */ `#version 300 es
precision highp float;
in vec4 vQ;
in vec3 vV;
in float vPx;
uniform vec3 uL;
uniform vec4 uPL;
uniform float uPLk;
out vec4 o;
${TONE}
void main() {
    vec2 pc = gl_PointCoord * 2.0 - 1.0;
    pc.y = -pc.y;
    float r2 = dot(pc, pc);
    float aa = 2.0 / max(vPx, 1.0);
    vec3 Lp = uPL.xyz - vV;
    float lamp = uPL.w / (1.0 + dot(Lp, Lp) * uPLk);
    vec3 col;
    float a;
    // a bubble: a thin bright rim, a window highlight, the far rim's glint,
    // nearly clear inside
    float rr = sqrt(r2);
    if (rr > 1.0) discard;
    float rim = smoothstep(0.62, 0.95, rr) * (1.0 - smoothstep(1.0 - aa, 1.0, rr));
    vec2 h1 = pc - vec2(-0.34, 0.4);
    vec2 h2 = pc - vec2(0.3, -0.38);
    float hl = exp(-dot(h1, h1) * 26.0) + 0.4 * exp(-dot(h2, h2) * 50.0);
    a = clamp(rim * 0.6 + 0.05 + hl, 0.0, 1.0) * vQ.y;
    col = mix(vec3(1.0, 0.9, 0.75), vec3(1.0), hl) * (1.2 + 2.0 * lamp);
    o = vec4(tone(col) * a, a);
}
`

// ---------------------------------------------------------------- component

// Each species' build and temperament: wandering pace, keenness for the
// cursor, tail-beat rate, how far it turns toward the viewer, and how fast
// its pectorals scull (Hz): the oranda drifts on slow, lazy beats. Reach is
// how far the tail runs past the peduncle, per body length, at the default
// Tail Length.
const SPECIES = {
    oranda: { shape: ORANDA, fins: buildOrandaFins(ORANDA), reach: 0.855, pace: 1, eager: 1, beat: 1, yawBias: 0.22, scull: 0.85 },
}
type Species = (typeof SPECIES)["oranda"]

interface Swimmer {
    opened: boolean
    k: number // world units per body length
    len: number // snout-to-tail length, world units
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
    yaw: number
    yawV: number
    pitch: number
    pitchV: number
    roll: number
    facing: number
    fwd: V3
    up: V3
    side: V3
    beat: number
    beatHz: number
    beatAmp: number
    bend: number
    // drag felt by the fins, in body-local units: quick at the root, slow at
    // the tips
    dbx: number
    dby: number
    dbz: number
    dtx: number
    dty: number
    dtz: number
    wx: number
    wy: number
    wz: number
    wanderUntil: number
    pauseUntil: number
    arrived: boolean
    holdUntil: number
    tx: number
    ty: number
    // nibbling at a cursor that rests at its snout
    nibble: number
    // a quick dash away from a sudden flick
    startleUntil: number
    startleCool: number
    fleeX: number
    fleeY: number
    // breathing: the mouth's phase, and gulps counted (bubbles every third)
    gulpPh: number
    gulpN: number
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function PersimmonWaft(props: PersimmonWaftProps) {
    const {
        variant = DEFAULTS.variant,
        background = DEFAULTS.background,
        bubbles = DEFAULTS.bubbles,
        size = DEFAULTS.size,
        orandaColors = {"cap":"#F5731C","body":"#DE7819","fins":"#F0A050"},
        redCapColors = {"cap":"#D8371A","body":"#F2DFC8","fins":"#F0D2B4"},
        adjust = {"hue":9,"brightness":137,"saturation":144},
        placement = {"x":0,"y":0,"tilt":0,"angle":0},
        follow = DEFAULTS.follow,
        eagerness = DEFAULTS.eagerness,
        speed = DEFAULTS.speed,
        roam = DEFAULTS.roam,
        advanced = {"lens":22,"sheen":100,"finSway":172,"beatRate":0.7,"scaleSize":100,"lightAngle":-25,"tailLength":0.9,"cursorLight":250},
        style,
    } = props
    const col =
        variant === "redcap" ? { ...DEFAULT_REDCAP_COLORS, ...redCapColors } : { ...DEFAULT_ORANDA_COLORS, ...orandaColors }
    const adj = { ...DEFAULT_ADJUST, ...adjust }
    const pl = { ...DEFAULT_PLACEMENT, ...placement }
    const adv = { ...DEFAULT_ADVANCED, ...advanced }

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wakeRef = useRef<() => void>(() => {})
    const [fallback, setFallback] = useState(false)

    const cfg = { variant, col, adj, size, bubbles, pl, adv, follow, eagerness, speed, roam }
    const live = useRef({ cfg })
    live.current.cfg = cfg

    // A prop edit wakes a stopped loop (a reduced-motion still redraws).
    useEffect(() => {
        wakeRef.current()
    })

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return

        const glOpts: WebGLContextAttributes = {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
            depth: true,
            stencil: false,
            powerPreference: "low-power",
            preserveDrawingBuffer: false,
        }
        let gl = canvas.getContext("webgl2", glOpts)
        if (!gl) {
            // Leave the Background showing.
            setFallback(true)
            return
        }

        let W = root.clientWidth || REF_W
        let H = root.clientHeight || REF_H
        const view = { shown: 1, shownDirty: true }
        const ro = new ResizeObserver((es) => {
            const r = es[0].contentRect
            if (r.width > 0 && r.height > 0) {
                W = r.width
                H = r.height
                view.shownDirty = true
                wakeRef.current()
            }
        })
        ro.observe(root)

        const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        let reduced = !!mq?.matches
        const onMq = () => {
            reduced = !!mq?.matches
            wake()
        }
        mq?.addEventListener?.("change", onMq)

        // ------------------------------------------------------ GL objects
        const body = buildBody(ORANDA)
        // Fine across the fin: the pleats need four vertices per ray. A
        // coarse set (pleats shaded only) serves small fish and slow devices.
        const gridBig = buildGrid(30, 112)
        const gridSmall = buildGrid(18, 52)
        const gridBigLo = buildGrid(20, 56)
        const gridSmallLo = buildGrid(12, 26)

        type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }
        let bodyProg: Prog | null = null
        let finProg: Prog | null = null
        let partProg: Prog | null = null
        let vaoBody: WebGLVertexArrayObject | null = null
        let vaoBig: WebGLVertexArrayObject | null = null
        let vaoSmall: WebGLVertexArrayObject | null = null
        let vaoBigLo: WebGLVertexArrayObject | null = null
        let vaoSmallLo: WebGLVertexArrayObject | null = null
        let vaoPart: WebGLVertexArrayObject | null = null
        let partBuf: WebGLBuffer | null = null
        let maxPt = 64
        const bufs: WebGLBuffer[] = []
        let lost = false

        const compile = (g: WebGL2RenderingContext, vsSrc: string, fsSrc: string, names: string[]): Prog | null => {
            const vs = g.createShader(g.VERTEX_SHADER)
            const fs = g.createShader(g.FRAGMENT_SHADER)
            const p = g.createProgram()
            if (!vs || !fs || !p) return null
            g.shaderSource(vs, vsSrc)
            g.shaderSource(fs, fsSrc)
            g.compileShader(vs)
            g.compileShader(fs)
            g.attachShader(p, vs)
            g.attachShader(p, fs)
            g.linkProgram(p)
            if (!g.getProgramParameter(p, g.LINK_STATUS)) {
                console.warn("PersimmonWaft:", g.getShaderInfoLog(vs) || g.getShaderInfoLog(fs) || g.getProgramInfoLog(p))
                return null
            }
            g.deleteShader(vs)
            g.deleteShader(fs)
            const u: Record<string, WebGLUniformLocation | null> = {}
            for (const n of names) u[n] = g.getUniformLocation(p, n)
            return { p, u }
        }

        const mkVao = (g: WebGL2RenderingContext, data: Float32Array, index: Uint16Array, layout: number[]) => {
            const vao = g.createVertexArray()
            g.bindVertexArray(vao)
            const vb = g.createBuffer()!
            g.bindBuffer(g.ARRAY_BUFFER, vb)
            g.bufferData(g.ARRAY_BUFFER, data, g.STATIC_DRAW)
            const ib = g.createBuffer()!
            g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, ib)
            g.bufferData(g.ELEMENT_ARRAY_BUFFER, index, g.STATIC_DRAW)
            const stride = layout.reduce((a, b) => a + b, 0) * 4
            let off = 0
            layout.forEach((n, i) => {
                g.enableVertexAttribArray(i)
                g.vertexAttribPointer(i, n, g.FLOAT, false, stride, off)
                off += n * 4
            })
            g.bindVertexArray(null)
            bufs.push(vb, ib)
            return vao
        }

        // ---- particles: bubbles (CPU state; one GPU array)
        const MAX_BUBBLES = 48
        const partGpu = new Float32Array(MAX_BUBBLES * 8)
        const BS = 8 // bubble stride: x y z vx vy r age seed
        const bubA = new Float64Array(MAX_BUBBLES * BS)
        let nBub = 0

        const COMMON = ["uModel", "uView", "uVP", "uBody", "uL"]
        const build = () => {
            const g = gl!
            bodyProg = compile(g, BODY_VS, BODY_FS, [...COMMON, "uCap", "uSkin", "uNV", "uLook", "uEye", "uPL", "uPLk", "uAdj"])
            finProg = compile(g, FIN_VS, FIN_FS, [
                ...COMMON,
                "uB0", "uB1", "uS", "uD0", "uDm", "uD1", "uNf", "uLenA", "uLenB", "uWave", "uWave2", "uSway",
                "uDragB", "uDragT", "uTime", "uFinA", "uFinB", "uColB", "uColF", "uColR", "uPL", "uPLk", "uPleat", "uAdj",
            ])
            partProg = compile(g, PART_VS, PART_FS, ["uVP", "uView", "uPx", "uMaxPt", "uL", "uPL", "uPLk"])
            if (!bodyProg || !finProg || !partProg) {
                lost = true
                setFallback(true)
                return
            }
            bufs.length = 0
            vaoBody = mkVao(g, body.data, body.index, [3, 3, 3])
            vaoBig = mkVao(g, gridBig.data, gridBig.index, [2])
            vaoSmall = mkVao(g, gridSmall.data, gridSmall.index, [2])
            vaoBigLo = mkVao(g, gridBigLo.data, gridBigLo.index, [2])
            vaoSmallLo = mkVao(g, gridSmallLo.data, gridSmallLo.index, [2])
            vaoPart = g.createVertexArray()
            g.bindVertexArray(vaoPart)
            partBuf = g.createBuffer()!
            g.bindBuffer(g.ARRAY_BUFFER, partBuf)
            g.bufferData(g.ARRAY_BUFFER, partGpu.byteLength, g.DYNAMIC_DRAW)
            g.enableVertexAttribArray(0)
            g.vertexAttribPointer(0, 4, g.FLOAT, false, 32, 0)
            g.enableVertexAttribArray(1)
            g.vertexAttribPointer(1, 4, g.FLOAT, false, 32, 16)
            g.bindVertexArray(null)
            bufs.push(partBuf)
            const range = g.getParameter(g.ALIASED_POINT_SIZE_RANGE) as Float32Array | null
            maxPt = range ? range[1] : 64
        }
        build()

        // ------------------------------------------------------ the fish
        const rnd = mulberry(20261026)
        const fish: Swimmer = {
            opened: false,
            k: 0.3,
            len: 0.6,
            x: 0,
            y: 0,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            yaw: Math.PI / 2,
            yawV: 0,
            pitch: 0,
            pitchV: 0,
            roll: 0,
            facing: -1,
            fwd: [1, 0, 0],
            up: [0, 1, 0],
            side: [0, 0, 1],
            beat: 0,
            beatHz: 0.7,
            beatAmp: 0.4,
            bend: 0,
            dbx: 0,
            dby: 0,
            dbz: 0,
            dtx: 0,
            dty: 0,
            dtz: 0,
            wx: 0,
            wy: 0,
            wz: 0,
            wanderUntil: 7,
            pauseUntil: 0,
            arrived: false,
            holdUntil: -1,
            tx: 0,
            ty: 0,
            nibble: 0,
            startleUntil: -1,
            startleCool: 0,
            fleeX: 0,
            fleeY: 0,
            gulpPh: 0,
            gulpN: 0,
        }
        let T = 0 // simulation clock, s
        // The cursor in the water: position, velocity, and its lamp.
        const ptw = { x: 0, y: 0, vx: 0, vy: 0, ok: false, lamp: 0 }
        const pt = { has: false, u: 0.5, v: 0.5, dirty: false, cx: 0, cy: 0, touched: false }

        // ------------------------------------------------------ matrices
        const mModel = new Float32Array(16)
        const mView = new Float32Array(16)
        const mVP = new Float32Array(16)
        const mNV = new Float32Array(9)
        const R = new Float64Array(9) // tank → view rotation (row-major)
        const cam = { D: 5, fx: 1, fy: 1, offX: 0, offY: 0 }

        const setCamera = (S: number) => {
            const c = live.current.cfg
            const p = c.pl
            const fov = (clamp(num(c.adv.lens, DEFAULT_ADVANCED.lens), 6, 70) * Math.PI) / 180
            // The reference frame's half height is one world unit; the lens
            // is set against that, so perspective is the same at any size.
            const D = 1 / Math.tan(fov / 2)
            cam.D = D
            cam.fy = (D * S) / H
            cam.fx = (D * S) / W
            cam.offX = (2 * clamp(num(p.x, 0), -50, 50)) / 100
            cam.offY = (-2 * clamp(num(p.y, 0), -50, 50)) / 100
            const tau = (-clamp(num(p.tilt, 0), -75, 75) * Math.PI) / 180
            const rho = (-num(p.angle, 0) * Math.PI) / 180
            const ct = Math.cos(tau)
            const st = Math.sin(tau)
            const cr = Math.cos(rho)
            const sr = Math.sin(rho)
            // R = Rroll · Rtilt
            R[0] = cr
            R[1] = -sr * ct
            R[2] = sr * st
            R[3] = sr
            R[4] = cr * ct
            R[5] = -cr * st
            R[6] = 0
            R[7] = st
            R[8] = ct
            mView.fill(0)
            for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) mView[k * 4 + r] = R[r * 3 + k]
            mView[14] = -D
            mView[15] = 1
            const n = Math.max(0.05, D - 4)
            const f = D + 4
            const A = -(f + n) / (f - n)
            const B = (-2 * f * n) / (f - n)
            // rows of the view matrix: (R_r0, R_r1, R_r2, t_r)
            for (let k = 0; k < 4; k++) {
                const v0 = k < 3 ? R[k] : 0
                const v1 = k < 3 ? R[3 + k] : 0
                const v2 = k < 3 ? R[6 + k] : -D
                const w = -v2
                mVP[k * 4] = cam.fx * v0 + cam.offX * w
                mVP[k * 4 + 1] = cam.fy * v1 + cam.offY * w
                mVP[k * 4 + 2] = A * v2 + (k === 3 ? B : 0)
                mVP[k * 4 + 3] = w
            }
        }

        // Pointer share of the frame → a point in the water at depth z,
        // through the same lens, roll and tilt the picture uses.
        const toTank = (u: number, v: number, z: number, out: number[]) => {
            const cx = 2 * u - 1 - cam.offX
            const cy = 1 - 2 * v - cam.offY
            const dvx = cx / cam.fx
            const dvy = cy / cam.fy
            const dvz = -1
            // tank = Rᵀ·view
            const dx = R[0] * dvx + R[3] * dvy + R[6] * dvz
            const dy = R[1] * dvx + R[4] * dvy + R[7] * dvz
            const dz = R[2] * dvx + R[5] * dvy + R[8] * dvz
            const ox = R[6] * cam.D
            const oy = R[7] * cam.D
            const oz = R[8] * cam.D
            if (Math.abs(dz) < 1e-4) return false
            const t = (z - oz) / dz
            if (t <= 0) return false
            out[0] = ox + dx * t
            out[1] = oy + dy * t
            return true
        }
        const hit = [0, 0]
        // Tank point → device px on the canvas (GL's bottom-left origin).
        const toPx = (x: number, y: number, z: number, pw: number, ph: number, out: number[]) => {
            const cx = mVP[0] * x + mVP[4] * y + mVP[8] * z + mVP[12]
            const cy = mVP[1] * x + mVP[5] * y + mVP[9] * z + mVP[13]
            const cw = mVP[3] * x + mVP[7] * y + mVP[11] * z + mVP[15]
            const w = Math.max(cw, 1e-4)
            out[0] = ((cx / w) * 0.5 + 0.5) * pw
            out[1] = ((cy / w) * 0.5 + 0.5) * ph
        }
        const pa = [0, 0]
        const pb = [0, 0]

        // ------------------------------------------------------ pointer
        const onMove = (e: PointerEvent) => {
            pt.cx = e.clientX
            pt.cy = e.clientY
            pt.has = true
            pt.dirty = true
        }
        const onLeave = () => {
            pt.has = false
        }
        const onDown = (e: PointerEvent) => {
            onMove(e)
            if (e.pointerType === "touch") pt.touched = true
        }
        const onUp = (e: PointerEvent) => {
            // Lifting a finger ends the hover; the fish still finishes its
            // dart to where the tap landed.
            if (e.pointerType === "touch") pt.has = false
        }
        const onScroll = () => {
            if (pt.has) pt.dirty = true
        }
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerup", onUp)
        root.addEventListener("pointercancel", onLeave)
        root.addEventListener("pointerleave", onLeave)
        window.addEventListener("scroll", onScroll, { passive: true, capture: true })

        // ------------------------------------------------------ simulation
        const basis = (f: Swimmer) => {
            const fwd = f.fwd
            const cp = Math.cos(f.pitch)
            const sp = Math.sin(f.pitch)
            const cy = Math.cos(f.yaw)
            const sy = Math.sin(f.yaw)
            fwd[0] = cp * cy
            fwd[1] = sp
            fwd[2] = cp * sy
            let ux = -sp * cy
            let uy = cp
            let uz = -sp * sy
            // side = fwd × up
            let sx = fwd[1] * uz - fwd[2] * uy
            let sy2 = fwd[2] * ux - fwd[0] * uz
            let sz = fwd[0] * uy - fwd[1] * ux
            // bank about the forward axis
            const cr = Math.cos(f.roll)
            const sr = Math.sin(f.roll)
            const nux = ux * cr + sx * sr
            const nuy = uy * cr + sy2 * sr
            const nuz = uz * cr + sz * sr
            sx = sx * cr - ux * sr
            sy2 = sy2 * cr - uy * sr
            sz = sz * cr - uz * sr
            ux = nux
            uy = nuy
            uz = nuz
            f.up[0] = ux
            f.up[1] = uy
            f.up[2] = uz
            f.side[0] = sx
            f.side[1] = sy2
            f.side[2] = sz
        }

        const roamShare = () => clamp(num(live.current.cfg.roam, DEFAULTS.roam), 0, 10) / 10
        // Somewhere a fair way off, so it travels rather than jitters.
        const pickWander = (f: Swimmer, Sx: number, Sy: number) => {
            const ro = roamShare()
            // at 10 it swims to within half a fish of the frame's edges
            const m = f.len * 0.45
            const rx = Math.max(0, Sx - m) * ro
            const ry = Math.max(0, Sy - m) * ro
            let bx = 0
            let by = 0
            let best = -1
            for (let i = 0; i < 4; i++) {
                const x = (rnd() * 2 - 1) * rx
                const y = (rnd() * 2 - 1) * ry
                // A fish can only pitch so far, and turns round only once a
                // target is clearly past its middle: one mostly above or below
                // it is a dead end it would hang under until the leg ran out.
                const dx = Math.abs(x - f.x)
                const dy = Math.abs(y - f.y)
                const d = Math.hypot(dx, dy) * (dx > 1.4 * dy + 0.7 * f.k ? 1 : 0.1)
                if (d > best) {
                    best = d
                    bx = x
                    by = y
                }
            }
            f.wx = bx
            f.wy = by
            f.wz = (rnd() * 2 - 1) * 0.22 * ro
            // Long enough to get there at the current Speed, then a rest.
            const spd = clamp(num(live.current.cfg.speed, DEFAULTS.speed), 0, 10)
            const v = (0.04 + 0.075 * spd) * f.k
            f.wanderUntil = T + 4 + rnd() * 4 + (1.4 * Math.hypot(bx - f.x, by - f.y)) / v
            f.arrived = false
        }

        // Opens as the clip does: facing the camera, nose a little down, then
        // turning into a side view and drifting off to the left.
        const openFish = (f: Swimmer) => {
            const ro = roamShare()
            f.x = 0
            f.y = 0.04
            f.z = 0
            f.yaw = Math.PI / 2
            f.pitch = -0.25
            f.facing = -1
            f.wx = -0.45 * (ro / 0.6) * f.k * 2.4
            f.wy = -0.12 * (ro / 0.6) * f.k * 2.4
            f.wanderUntil = 7
            basis(f)
            f.opened = true
        }

        const startle = (f: Swimmer, fromX: number, fromY: number, Sx: number, Sy: number) => {
            const k = f.k
            const ax = f.x - fromX
            const ay = f.y - fromY
            const al = Math.hypot(ax, ay) || 1
            f.fleeX = clamp(f.x + (ax / al) * 2.2 * k, -Sx + 0.4 * k, Sx - 0.4 * k)
            f.fleeY = clamp(f.y + (ay / al) * 2.2 * k, -Sy + 0.4 * k, Sy - 0.4 * k)
            f.startleUntil = T + 0.75
            f.startleCool = T + 3
            f.beatAmp = 1.3
        }

        const step = (f: Swimmer, sp: Species, dt: number, Sx: number, Sy: number) => {
            const c = live.current.cfg
            const eager = clamp(num(c.eagerness, DEFAULTS.eagerness), 0, 10) * sp.eager
            const spd = clamp(num(c.speed, DEFAULTS.speed), 0, 10) * sp.pace
            const k = f.k
            const fwd = f.fwd
            const upv = f.up
            const sdv = f.side
            // A fright first, then the cursor, then its own way.
            const startled = T < f.startleUntil
            const chasing = startled || (c.follow && (pt.has || T < f.holdUntil))
            let tx: number
            let ty: number
            let tz = f.z
            let vmax: number
            let wTurn: number
            let tauV: number
            if (chasing) {
                if (startled) {
                    tx = f.fleeX
                    ty = f.fleeY
                } else {
                    tx = f.tx
                    ty = f.ty
                    // Nibbling at a resting cursor: little pecks.
                    if (f.nibble > 0.5) {
                        const peck = 0.05 * k * Math.max(0, Math.sin(T * 4.4))
                        tx += fwd[0] * peck
                        ty += fwd[1] * peck
                    }
                }
                const burst = startled ? 2.4 : 1
                vmax = (0.9 + 0.4 * eager) * burst * k
                wTurn = (2.4 + 0.35 * eager) * (burst > 1 ? 1.4 : 1)
                tauV = startled ? 0.09 : burst > 1 ? 0.16 : 0.28
                tz = 0
            } else {
                if (T > f.wanderUntil) pickWander(f, Sx, Sy)
                tx = f.wx
                ty = f.wy
                tz = f.wz
                // cruising pace from about 0.19 to 0.79 body lengths a second;
                // 0 hangs where it is
                vmax = spd > 0 ? (0.04 + 0.075 * spd) * k : 0
                // and turns round briskly or lazily to match (1.4 at 5)
                wTurn = 0.9 + 0.1 * spd
                tauV = 0.55
            }
            // Steer the snout, not the middle, onto the target.
            const hx = f.x + fwd[0] * HEAD_OFF * k
            const hy = f.y + fwd[1] * HEAD_OFF * k
            const ox = tx - hx
            const oy = ty - hy
            const dist = Math.hypot(ox, oy)
            if (!chasing && dist < 0.25 * k) {
                // Arrived: hang there a moment, then pick somewhere new.
                // (a brisk fish rests briefly between legs, a slow one longer)
                if (!f.arrived) {
                    f.arrived = true
                    f.pauseUntil = T + (1 + rnd() * 2) * (1.4 - Math.min(spd, 10) / 10)
                } else if (T > f.pauseUntil) f.wanderUntil = T
            }
            // Turn round only when the target is clearly behind the body's
            // middle, so a hover with the snout on the target never flips.
            const cxo = tx - f.x
            const hyst = 0.6 * k
            if (cxo > hyst && f.facing < 0) f.facing = 1
            else if (cxo < -hyst && f.facing > 0) f.facing = -1
            const yawT = f.facing > 0 ? sp.yawBias : Math.PI - sp.yawBias
            const near = smooth(0, 0.6 * k, dist)
            const pitchT = clamp(Math.atan2(oy, Math.abs(ox) + 0.6 * k), -PITCH_MAX, PITCH_MAX) * near
            // Critically damped turns.
            const z = 0.9
            f.yawV += (wTurn * wTurn * (yawT - f.yaw) - 2 * z * wTurn * f.yawV) * dt
            f.yaw += f.yawV * dt
            const wp = wTurn * 1.2
            f.pitchV += (wp * wp * (pitchT - f.pitch) - 2 * z * wp * f.pitchV) * dt
            f.pitch += f.pitchV * dt
            f.roll += (clamp(f.yawV * 0.12, -0.3, 0.3) - f.roll) * (1 - Math.exp(-dt / 0.35))
            basis(f)
            // Thrust along the heading only once it points the right way, and
            // only toward a target ahead of the snout: one just behind it is
            // reached by backing up with the pectorals, not overshot.
            const align = Math.max(0, Math.cos(f.yaw - yawT))
            const ahead = dist > 1e-6 ? clamp((fwd[0] * ox + fwd[1] * oy) / dist, 0, 1) : 0
            const vstar = vmax * smooth(0.02 * k, 1.1 * k, dist) * align * align * ahead
            let dvx = fwd[0] * vstar
            let dvy = fwd[1] * vstar
            if (dist < 1.2 * k) {
                const sc = Math.min(1, (0.35 * k) / Math.max(dist, 1e-4)) * 1.4
                dvx += ox * sc
                dvy += oy * sc
            }
            const dvz = clamp((tz - f.z) * 0.6, -0.15 * k, 0.15 * k)
            const kv = 1 - Math.exp(-dt / tauV)
            const ax = (dvx - f.vx) * kv
            const ay = (dvy - f.vy) * kv
            f.vx += ax
            f.vy += ay
            f.vz += (dvz - f.vz) * kv
            f.x += f.vx * dt
            f.y += f.vy * dt
            f.z += f.vz * dt
            // Tail beat: a lazy wave at rest, quicker and wider when it works.
            const swim = Math.hypot(f.vx, f.vy) / k
            const work = clamp(swim / 1.6 + (Math.hypot(ax, ay) / dt / k) * 0.12 + Math.abs(f.yawV) * 0.25, 0, 1.4)
            // The beat quickens with effort but eases from pace to pace, so a
            // change of speed never shows as a jolt in the fins.
            const rate = clamp(num(c.adv.beatRate, DEFAULT_ADVANCED.beatRate), 0.1, 4) * sp.beat
            // It kicks up at once when it sets off (or the body would glide
            // ahead of a lazy tail and read as lag) and settles back slowly.
            const hzT = rate * (1 + 1.3 * Math.min(1, work))
            f.beatHz += (hzT - f.beatHz) * (1 - Math.exp(-dt / (hzT > f.beatHz ? 0.18 : 0.6)))
            f.beat = (f.beat + 2 * Math.PI * f.beatHz * dt) % (Math.PI * 2)
            const ampT = 0.3 + 0.6 * Math.min(1, work)
            f.beatAmp += (ampT - f.beatAmp) * (1 - Math.exp(-dt / (ampT > f.beatAmp ? 0.15 : 0.6)))
            // Turning bends it into a C.
            f.bend += (clamp(f.yawV * 0.16, -0.4, 0.4) - f.bend) * (1 - Math.exp(-dt / 0.12))
            // Water felt by the fins, in body-local axes (per body length/s):
            // the opposite of the swim, plus the sideways sweep of a turn.
            const lx = -(f.vx * fwd[0] + f.vy * fwd[1] + f.vz * fwd[2]) / k
            const ly = -(f.vx * upv[0] + f.vy * upv[1] + f.vz * upv[2]) / k
            const lz = -(f.vx * sdv[0] + f.vy * sdv[1] + f.vz * sdv[2]) / k + f.yawV * 0.7
            const kb = 1 - Math.exp(-dt / 0.12)
            const kt = 1 - Math.exp(-dt / 0.45)
            f.dbx += (lx - f.dbx) * kb
            f.dby += (ly - f.dby) * kb
            f.dbz += (lz - f.dbz) * kb
            f.dtx += (lx - f.dtx) * kt
            f.dty += (ly - f.dty) * kt
            f.dtz += (lz - f.dtz) * kt
        }

        // A still fish for reduced motion: in profile, mid-frame.
        const placeStill = (f: Swimmer, sp: Species) => {
            f.x = 0
            f.y = 0
            f.z = 0
            f.yaw = Math.PI - sp.yawBias
            f.pitch = 0
            f.roll = 0
            f.bend = 0
            f.beatAmp = 0.3
            f.dbx = f.dtx = -0.15
            f.dby = f.dty = f.dbz = f.dtz = 0
            basis(f)
        }

        // ------------------------------------------------------ colours
        // (the merged prop objects are rebuilt only when props change, so
        // comparing them by reference allocates nothing per frame)
        let colorKey: FishColors | null = null
        const cl = { cap: [0, 0, 0] as V3, body: [0, 0, 0] as V3, fins: [0, 0, 0] as V3 }
        const updateColors = () => {
            const c = live.current.cfg.col
            if (c === colorKey) return
            colorKey = c
            cl.cap = resolveRGB(root, c.cap).map(srgbToLin) as V3
            cl.body = resolveRGB(root, c.body).map(srgbToLin) as V3
            cl.fins = resolveRGB(root, c.fins).map(srgbToLin) as V3
        }

        // Hue, saturation and brightness as one colour matrix, applied to the
        // fish's final colour so its sheen, fins and eye all move together
        // (the standard luminance-preserving hue rotation and saturation).
        const adjM = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
        let adjKey: Adjust | null = null
        const setAdjust = (a: Adjust) => {
            if (a === adjKey) return
            adjKey = a
            const hue = clamp(num(a.hue, 0), -180, 180)
            const sat = clamp(num(a.saturation, 100), 0, 300) / 100
            const bri = clamp(num(a.brightness, 100), 0, 300) / 100
            const r = (hue * Math.PI) / 180
            const ca = Math.cos(r)
            const sa = Math.sin(r)
            const Hm = [
                [0.213 + 0.787 * ca - 0.213 * sa, 0.715 - 0.715 * ca - 0.715 * sa, 0.072 - 0.072 * ca + 0.928 * sa],
                [0.213 - 0.213 * ca + 0.143 * sa, 0.715 + 0.285 * ca + 0.14 * sa, 0.072 - 0.072 * ca - 0.283 * sa],
                [0.213 - 0.213 * ca - 0.787 * sa, 0.715 - 0.715 * ca + 0.715 * sa, 0.072 + 0.928 * ca + 0.072 * sa],
            ]
            const Sm = [
                [0.213 + 0.787 * sat, 0.715 - 0.715 * sat, 0.072 - 0.072 * sat],
                [0.213 - 0.213 * sat, 0.715 + 0.285 * sat, 0.072 - 0.072 * sat],
                [0.213 - 0.213 * sat, 0.715 - 0.715 * sat, 0.072 + 0.928 * sat],
            ]
            for (let row = 0; row < 3; row++)
                for (let col = 0; col < 3; col++) {
                    let v = 0
                    for (let k = 0; k < 3; k++) v += Sm[row][k] * Hm[k][col]
                    adjM[col * 3 + row] = v * bri
                }
        }

        // ------------------------------------------------------ particles
        const emitBubble = (x: number, y: number, z: number, r: number, vx: number, vy: number, delay: number) => {
            if (nBub >= MAX_BUBBLES) return
            const o = nBub * BS
            bubA[o] = x
            bubA[o + 1] = y
            bubA[o + 2] = z
            bubA[o + 3] = vx
            bubA[o + 4] = vy
            bubA[o + 5] = r
            bubA[o + 6] = -delay
            bubA[o + 7] = rnd() * 100
            nBub++
        }
        // Where the lips part, in the tank, `ahead` body lengths in front of
        // them: the body's own transform (with its bob and the head's sway)
        // applied to the mouth's rest point.
        const mouthAt = (f: Swimmer, ahead: number, out: number[]) => {
            const k = f.k
            const lx = 0.505 + ahead
            const ly = mouthY(0) - 0.003
            const lz = -0.012 * f.beatAmp * Math.sin(f.beat + 0.9) - 0.03 * f.bend
            out[0] = f.x + (f.fwd[0] * lx + f.up[0] * ly + f.side[0] * lz) * k
            out[1] = f.y + 0.012 * k * Math.sin(T * 0.8) + (f.fwd[1] * lx + f.up[1] * ly + f.side[1] * lz) * k
            out[2] = f.z + (f.fwd[2] * lx + f.up[2] * ly + f.side[2] * lz) * k
        }
        const mp = [0, 0, 0]
        // A short string of bubbles, largest first, let out as the lips part.
        const BUBBLE_R = [0.026, 0.019, 0.014]
        const breathe = (f: Swimmer) => {
            const k = f.k
            for (let i = 0; i < BUBBLE_R.length; i++) {
                const r = BUBBLE_R[i] * k
                mouthAt(f, BUBBLE_R[i], mp)
                emitBubble(mp[0], mp[1], mp[2], r, f.fwd[0] * 0.3 * k, f.fwd[1] * 0.3 * k + 0.03, i * 0.16)
            }
        }

        const updateParticles = (dt: number, Sy: number) => {
            const c = live.current.cfg
            // ---- breathing: the mouth opens and closes on a steady rhythm,
            // quicker while it nibbles; every third gulp it opens wider and
            // lets a string of bubbles out as the lips part.
            const f = fish
            const ph0 = f.gulpPh
            f.gulpPh += 2 * Math.PI * (0.5 + 0.8 * f.nibble) * dt
            if (f.gulpPh >= 2 * Math.PI) {
                f.gulpPh -= 2 * Math.PI
                f.gulpN++
            }
            if (c.bubbles && f.gulpN % 3 === 2 && ph0 < 0.9 && f.gulpPh >= 0.9) breathe(f)
            // ---- bubbles: rise at a speed set by their size, zig-zag, swell
            for (let i = 0; i < nBub; i++) {
                const o = i * BS
                bubA[o + 6] += dt
                const age = bubA[o + 6]
                if (age < 0) {
                    // still in the mouth: ride along with it
                    mouthAt(f, bubA[o + 5] / f.k, mp)
                    bubA[o] = mp[0]
                    bubA[o + 1] = mp[1]
                    bubA[o + 2] = mp[2]
                    continue
                }
                const r = bubA[o + 5]
                const vyT = 0.22 + 9 * r
                bubA[o + 4] += (vyT - bubA[o + 4]) * (1 - Math.exp(-dt / 0.35))
                bubA[o + 3] *= Math.exp(-dt / 0.3)
                bubA[o] += (bubA[o + 3] + 0.28 * vyT * Math.sin(age * 9 + bubA[o + 7])) * dt
                bubA[o + 1] += bubA[o + 4] * dt
                bubA[o + 5] = r * (1 + 0.03 * dt)
                const sc = (cam.D - bubA[o + 2]) / cam.D
                if (bubA[o + 1] > Sy * sc * 1.15 + r || age > 14) {
                    // remove: move the last one into this slot
                    nBub--
                    bubA.copyWithin(o, nBub * BS, nBub * BS + BS)
                    i--
                }
            }
        }

        // Pack the particles for the GPU, those behind the fish first (drawn
        // before it), then those in front.
        let nBehind = 0
        const packParticles = () => {
            const fz = R[6] * fish.x + R[7] * fish.y + R[8] * fish.z
            let m = 0
            const put = (x: number, y: number, z: number, r: number, kind: number, a: number, seed: number) => {
                const o = m * 8
                partGpu[o] = x
                partGpu[o + 1] = y
                partGpu[o + 2] = z
                partGpu[o + 3] = r
                partGpu[o + 4] = kind
                partGpu[o + 5] = a
                partGpu[o + 6] = seed
                partGpu[o + 7] = 0
                m++
            }
            for (let pass = 0; pass < 2; pass++) {
                if (pass === 1) nBehind = m
                for (let i = 0; i < nBub; i++) {
                    const o = i * BS
                    const front = R[6] * bubA[o] + R[7] * bubA[o + 1] + R[8] * bubA[o + 2] > fz
                    if (front !== (pass === 1)) continue
                    const age = bubA[o + 6]
                    const a = clamp((age + 0.08) / 0.15, 0, 1) * (1 - smooth(11, 14, age))
                    put(bubA[o], bubA[o + 1], bubA[o + 2], bubA[o + 5], 1, a, bubA[o + 7])
                }
            }
            return m
        }
        const drawParticles = (g: WebGL2RenderingContext, from: number, count: number) => {
            if (count <= 0 || !partProg) return
            g.useProgram(partProg.p)
            g.bindVertexArray(vaoPart)
            g.enable(g.DEPTH_TEST)
            g.depthMask(false)
            g.enable(g.BLEND)
            g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA)
            g.drawArrays(g.POINTS, from, count)
        }

        // ------------------------------------------------------ loop
        let raf = 0
        let running = false
        let visible = true
        let pageVisible = !document.hidden
        let last = 0
        let lastRaf = 0
        let tickCount = 0
        let divisor = 1
        let divVotes = 0
        let drawn = 0
        let quality = 1
        let slow = 0
        let fast = 0
        let raiseLocked = false
        let lastRaise = -1e9
        const gaps = new Float32Array(15)
        let gapN = 0
        const lates = new Float32Array(9)
        let lateN = 0
        const medTmp = new Float32Array(16)
        const median = (a: Float32Array, n: number) => {
            const m = Math.min(n, a.length)
            for (let i = 0; i < m; i++) medTmp[i] = a[i]
            for (let i = 1; i < m; i++) {
                const v = medTmp[i]
                let j = i - 1
                while (j >= 0 && medTmp[j] > v) {
                    medTmp[j + 1] = medTmp[j]
                    j--
                }
                medTmp[j + 1] = v
            }
            return medTmp[m >> 1]
        }

        function wake() {
            if (running || !visible || !pageVisible || lost) return
            running = true
            last = 0
            lastRaf = 0
            gapN = 0
            raf = requestAnimationFrame(tick)
        }
        wakeRef.current = wake
        const io = new IntersectionObserver((es) => {
            visible = es[0].isIntersecting
            if (visible) wake()
        })
        io.observe(root)
        const onVis = () => {
            pageVisible = !document.hidden
            if (pageVisible) wake()
        }
        document.addEventListener("visibilitychange", onVis)

        // Reduced motion and prop edits: a still frame needs drawing too.
        let lastCfg: string | null = null
        let lastRoam = -1

        const onLost = (e: Event) => {
            e.preventDefault()
            lost = true
            running = false
            cancelAnimationFrame(raf)
        }
        const onRestored = () => {
            gl = canvas.getContext("webgl2", glOpts)
            if (!gl) return
            lost = false
            lastCfg = null
            build()
            wake()
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        const tick = (now: number) => {
            raf = 0
            if (!running) return
            // Off screen or in a hidden tab: stop; the observers wake it.
            if (!visible || !pageVisible) {
                running = false
                return
            }
            // Pace by whole vsyncs so 120/144 Hz panels draw a steady 60 fps.
            if (lastRaf) {
                gaps[gapN % gaps.length] = now - lastRaf
                gapN++
            }
            lastRaf = now
            tickCount++
            const period = gapN >= 5 ? median(gaps, gapN) : 16.7
            // Change the divisor only once the ratio is well clear of the
            // boundary, so a jittery 120 Hz panel (ratio ≈ 2) holds 60 fps
            // instead of flipping between every and every other vsync, and a
            // ~165 Hz one (ratio ≈ 2.75) holds 82 fps. It must stay clear for
            // half a second, so noisy timestamps cannot tip it either.
            const ratio = 16.7 / Math.max(period, 1)
            if (ratio >= divisor + 0.95 || ratio < divisor - 0.4) {
                if (++divVotes > 30) {
                    divisor = Math.max(1, Math.floor(ratio + 0.1))
                    divVotes = 0
                }
            } else divVotes = 0
            if (tickCount % divisor !== 0) {
                raf = requestAnimationFrame(tick)
                return
            }
            const keep = frame(now, period * divisor)
            if (keep) raf = requestAnimationFrame(tick)
            else running = false
        }

        const finOrder: number[] = []
        const finDepth = new Float64Array(16)
        const fd0: V3 = [0, 0, 0]
        const fdm: V3 = [0, 0, 0]
        const fd1: V3 = [0, 0, 0]
        const fnf: V3 = [0, 0, 0]
        const rot = (v: V3, ax: V3, a: number, out: V3) => {
            // Rodrigues about a unit axis.
            const c = Math.cos(a)
            const s = Math.sin(a)
            const d = (v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]) * (1 - c)
            out[0] = v[0] * c + (ax[1] * v[2] - ax[2] * v[1]) * s + ax[0] * d
            out[1] = v[1] * c + (ax[2] * v[0] - ax[0] * v[2]) * s + ax[1] * d
            out[2] = v[2] * c + (ax[0] * v[1] - ax[1] * v[0]) * s + ax[2] * d
        }
        const axis: V3 = [0, 0, 0]

        const frame = (now: number, expect: number): boolean => {
            const g = gl
            if (!g || g.isContextLost() || !bodyProg || !finProg || !partProg) return false
            const c = live.current.cfg
            const a = c.adv
            const sp = SPECIES.oranda
            const rawDt = last ? (now - last) / 1000 : 1 / 60
            last = now
            // A frame that arrives on time moves the fish by exactly one frame
            // period, so the jitter in the browser's timestamps never shows
            // as uneven motion; a late one catches up with real time.
            const e = expect / 1000
            const dt = Math.min(0.1, Math.abs(rawDt - e) < 0.25 * e ? e : rawDt)

            if (view.shownDirty || drawn % 30 === 0) {
                view.shownDirty = false
                const r = root.getBoundingClientRect()
                view.shown = W > 0 ? r.width / W : 1
            }
            if (reduced) {
                // A still: draw only when something it shows has changed.
                const key = JSON.stringify([c, W, H, view.shown])
                if (key === lastCfg) return false
                lastCfg = key
            } else lastCfg = null

            const S = Math.min(H, W / REF_ASPECT)
            setCamera(S)
            const tailL = clamp(num(a.tailLength, DEFAULT_ADVANCED.tailLength), 0.3, 1.6)
            const total = 1.05 + (sp.reach * tailL) / 0.9
            const f = fish
            f.len = (clamp(num(c.size, DEFAULTS.size), 5, 90) / 100) * 2
            f.k = f.len / total
            const k = f.k
            const Sx = W / S
            const Sy = H / S
            if (!f.opened) openFish(f)
            // A new Roam takes effect now, not at the next wander.
            const roNow = roamShare()
            if (roNow !== lastRoam) {
                if (lastRoam >= 0) f.wanderUntil = T
                lastRoam = roNow
            }

            // ---- pointer → water, once per frame at most
            if (pt.dirty) {
                pt.dirty = false
                const r = root.getBoundingClientRect()
                if (r.width > 0 && r.height > 0) {
                    pt.u = (pt.cx - r.left) / r.width
                    pt.v = (pt.cy - r.top) / r.height
                }
            }
            if (pt.has && toTank(pt.u, pt.v, f.z, hit)) {
                f.tx = clamp(hit[0], -Sx * 1.5, Sx * 1.5)
                f.ty = clamp(hit[1], -Sy * 1.5, Sy * 1.5)
                // the cursor's speed (for frights) and its lamp
                const kv = 1 - Math.exp(-dt / 0.05)
                if (ptw.ok && dt > 0) {
                    ptw.vx += ((hit[0] - ptw.x) / dt - ptw.vx) * kv
                    ptw.vy += ((hit[1] - ptw.y) / dt - ptw.vy) * kv
                }
                ptw.x = hit[0]
                ptw.y = hit[1]
                ptw.ok = true
            } else {
                ptw.ok = false
                ptw.vx *= 0.8
                ptw.vy *= 0.8
            }
            ptw.lamp += ((pt.has ? 1 : 0) - ptw.lamp) * (1 - Math.exp(-dt / (pt.has ? 0.12 : 0.4)))
            if (ptw.lamp < 1e-3) ptw.lamp = 0
            // On touch there is no hover: a tap sends it to that spot, and it
            // keeps going there after the finger lifts.
            if (pt.touched) {
                pt.touched = false
                f.holdUntil = T + 2.5
            }
            if (!reduced) {
                const pspd = Math.hypot(ptw.vx, ptw.vy)
                // A sudden flick close by sends it darting away.
                if (ptw.ok && pspd > 11 * k && T > f.startleCool && Math.hypot(ptw.x - f.x, ptw.y - f.y) < 1.4 * k) startle(f, ptw.x, ptw.y, Sx, Sy)
                // Nibbles a cursor that rests at its mouth.
                const hx = f.x + f.fwd[0] * HEAD_OFF * k
                const hy = f.y + f.fwd[1] * HEAD_OFF * k
                const resting = c.follow && pt.has && pspd < 0.15 * k && Math.hypot(f.tx - hx, f.ty - hy) < 0.15 * k
                f.nibble += ((resting ? 1 : 0) - f.nibble) * (1 - Math.exp(-dt / 0.4))
            }

            if (reduced) placeStill(f, sp)
            else {
                // Equal substeps that fill the frame exactly. A fixed step left
                // a remainder that made 75/90/144/165 Hz screens advance the
                // fish one step, then two, every other frame: a visible judder.
                const nSub = Math.ceil(dt / STEP - 1e-6)
                const h = dt / nSub
                for (let i = 0; i < nSub; i++) {
                    T += h
                    step(f, sp, h, Sx, Sy)
                }
                updateParticles(dt, Sy)
            }

            // ------------------------------------------------ resolution
            const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1)
            // the fish's length in CSS px (the water plane shows S/2 px per
            // unit); from Size and the frame only, never its pose, so the
            // canvas does not flip size as it turns
            const lenCss = Math.max(1, (f.len * S) / 2)
            let scale = Math.min(MAX_DPR, dpr * clamp(view.shown, 1, 2)) * quality
            // In eighths, so dragging Size re-allocates the canvas only now
            // and then rather than every frame.
            scale = Math.min(scale, Math.max(1, Math.floor((FISH_PX_CAP / lenCss) * 8) / 8))
            scale = Math.max(Math.min(1, dpr), Math.min(scale, Math.sqrt(PIXEL_CAP / Math.max(1, W * H))))
            const pw = Math.max(1, Math.round(W * scale))
            const ph = Math.max(1, Math.round(H * scale))
            if (canvas.width !== pw || canvas.height !== ph) {
                canvas.width = pw
                canvas.height = ph
            }
            g.viewport(0, 0, pw, ph)
            g.clearColor(0, 0, 0, 0)
            g.clearDepth(1)
            g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT)

            updateColors()

            // ------------------------------------------------ light
            const t = reduced ? 0 : T
            // Key light from the upper left and toward the viewer, fixed in
            // the picture so it stays put when the water is turned.
            const la = (num(a.lightAngle, DEFAULT_ADVANCED.lightAngle) * Math.PI) / 180
            const Lx = Math.sin(la) * 0.95
            const Ly = Math.cos(la) * 0.95
            const Lz = 0.24
            // The cursor's lamp floats a little in front of the fish.
            const lampI = ptw.lamp * (clamp(num(a.cursorLight, 100), 0, 300) / 100) * 0.9
            const lz = f.z + 0.55
            const lvx = R[0] * ptw.x + R[1] * ptw.y + R[2] * lz
            const lvy = R[3] * ptw.x + R[4] * ptw.y + R[5] * lz
            const lvz = R[6] * ptw.x + R[7] * ptw.y + R[8] * lz - cam.D
            // falloff in fish lengths, so the pool of light keeps its size
            // relative to the fish
            const lampK = 0.28 / Math.max(k * k, 1e-4)
            const scaleSz = clamp(num(a.scaleSize, 100), 40, 250) / 100
            const sheen = clamp(num(a.sheen, 100), 0, 300) / 100
            const sway = (reduced ? 0.3 : 1) * (clamp(num(a.finSway, 100), 0, 300) / 100)
            const DRAG = 0.45
            const fwd = f.fwd
            const upv = f.up
            const sdv = f.side
            // The clip's own light through thin fins and edges.
            const glow = 1
            setAdjust(c.adj)

            // ---- particles behind the fish
            const nPart = packParticles()
            if (nPart) {
                g.useProgram(partProg.p)
                g.uniformMatrix4fv(partProg.u.uVP, false, mVP)
                g.uniformMatrix4fv(partProg.u.uView, false, mView)
                g.uniform1f(partProg.u.uPx, (cam.fy * ph) / 2)
                g.uniform1f(partProg.u.uMaxPt, maxPt)
                g.uniform3f(partProg.u.uL, Lx, Ly, Lz)
                g.uniform4f(partProg.u.uPL, lvx, lvy, lvz, lampI)
                g.uniform1f(partProg.u.uPLk, lampK)
                g.bindBuffer(g.ARRAY_BUFFER, partBuf)
                g.bufferSubData(g.ARRAY_BUFFER, 0, partGpu, 0, nPart * 8)
                drawParticles(g, 0, nBehind)
            }

            // Fine fin grids only where the pleats can be seen: a fish long
            // on screen, on a device keeping up.
            toPx(f.x, f.y, f.z, pw, ph, pa)
            toPx(f.x + upv[0] * f.len, f.y + upv[1] * f.len, f.z + upv[2] * f.len, pw, ph, pb)
            const lenPx = Math.hypot(pb[0] - pa[0], pb[1] - pa[1])
            const fine = lenPx > 400 && quality > 0.95

            // ---- pose
            const bob = reduced ? 0 : 0.012 * k * Math.sin(t * 0.8)
            // how far the lips are parted: slitH way on a breath, fully on the
            // gulp that lets out bubbles
            const gulp = reduced ? 0 : Math.pow(Math.max(0, Math.sin(f.gulpPh)), 2) * (f.gulpN % 3 === 2 ? 1 : 0.5)
            for (let i = 0; i < 3; i++) {
                mModel[i] = fwd[i] * k
                mModel[4 + i] = upv[i] * k
                mModel[8 + i] = sdv[i] * k
            }
            mModel[3] = mModel[7] = mModel[11] = 0
            mModel[12] = f.x
            mModel[13] = f.y + bob
            mModel[14] = f.z
            mModel[15] = 1
            // local → view rotation, for the eye and scale normals
            for (let col3 = 0; col3 < 3; col3++) {
                const b = col3 === 0 ? fwd : col3 === 1 ? upv : sdv
                for (let r = 0; r < 3; r++) mNV[col3 * 3 + r] = R[r * 3] * b[0] + R[r * 3 + 1] * b[1] + R[r * 3 + 2] * b[2]
            }
            const bA = reduced ? 0.25 : f.beatAmp
            const shape = sp.shape

            // ---- body
            g.enable(g.DEPTH_TEST)
            g.depthFunc(g.LEQUAL)
            g.depthMask(true)
            g.disable(g.BLEND)
            g.enable(g.CULL_FACE)
            g.cullFace(g.BACK)
            g.frontFace(g.CCW)
            {
                const P = bodyProg
                g.useProgram(P.p)
                g.uniformMatrix4fv(P.u.uModel, false, mModel)
                g.uniformMatrix4fv(P.u.uView, false, mView)
                g.uniformMatrix4fv(P.u.uVP, false, mVP)
                g.uniformMatrix3fv(P.u.uNV, false, mNV)
                g.uniform4f(P.u.uBody, f.beat, bA, f.bend, gulp)
                g.uniform3f(P.u.uL, Lx, Ly, Lz)
                g.uniform3f(P.u.uCap, cl.cap[0], cl.cap[1], cl.cap[2])
                g.uniform3f(P.u.uSkin, cl.body[0], cl.body[1], cl.body[2])
                g.uniform4f(P.u.uLook, sheen, glow, gulp, scaleSz)
                g.uniformMatrix3fv(P.u.uAdj, false, adjM)
                g.uniform3f(P.u.uEye, shape.eye[0], shape.eye[1], shape.eye[2])
                g.uniform4f(P.u.uPL, lvx, lvy, lvz, lampI)
                g.uniform1f(P.u.uPLk, lampK)
                g.bindVertexArray(vaoBody)
                g.drawElements(g.TRIANGLES, body.index.length, g.UNSIGNED_SHORT, 0)
            }

            // ---- fins: translucent, two-sided, depth-tested against the
            // body but not writing depth; far fins first.
            const fins = sp.fins
            g.disable(g.CULL_FACE)
            g.depthMask(false)
            g.enable(g.BLEND)
            g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA)
            finOrder.length = fins.length
            for (let i = 0; i < fins.length; i++) {
                const fn = fins[i]
                const lx = (fn.b0[0] + fn.b1[0]) / 2
                const ly = (fn.b0[1] + fn.b1[1]) / 2
                const lzz = (fn.b0[2] + fn.b1[2]) / 2 + fn.sigma * 0.1
                const wx = f.x + (fwd[0] * lx + upv[0] * ly + sdv[0] * lzz) * k
                const wy = f.y + (fwd[1] * lx + upv[1] * ly + sdv[1] * lzz) * k
                const wz = f.z + (fwd[2] * lx + upv[2] * ly + sdv[2] * lzz) * k
                finDepth[i] = R[6] * wx + R[7] * wy + R[8] * wz
                finOrder[i] = i
            }
            for (let i = 1; i < finOrder.length; i++) {
                const v = finOrder[i]
                let j = i - 1
                while (j >= 0 && finDepth[finOrder[j]] > finDepth[v]) {
                    finOrder[j + 1] = finOrder[j]
                    j--
                }
                finOrder[j + 1] = v
            }
            const P = finProg
            g.useProgram(P.p)
            g.uniformMatrix4fv(P.u.uModel, false, mModel)
            g.uniformMatrix4fv(P.u.uView, false, mView)
            g.uniformMatrix4fv(P.u.uVP, false, mVP)
            g.uniform4f(P.u.uBody, f.beat, bA, f.bend, 0)
            g.uniform3f(P.u.uL, Lx, Ly, Lz)
            g.uniform4f(P.u.uPL, lvx, lvy, lvz, lampI)
            g.uniform1f(P.u.uPLk, lampK)
            // wrapped seamlessly: every own rate has two decimals
            g.uniform1f(P.u.uTime, t % (200 * Math.PI))
            g.uniform1f(P.u.uPleat, fine ? 1 : 0)
            g.uniformMatrix3fv(P.u.uAdj, false, adjM)
            for (const i of finOrder) {
                const fn = fins[i]
                // Pectorals scull: the whole fan swings about its root.
                if (fn.flap > 0) {
                    const ax0 = fn.b1[0] - fn.b0[0]
                    const ax1 = fn.b1[1] - fn.b0[1]
                    const ax2 = fn.b1[2] - fn.b0[2]
                    const al = Math.hypot(ax0, ax1, ax2) || 1
                    axis[0] = ax0 / al
                    axis[1] = ax1 / al
                    axis[2] = ax2 / al
                    const hover = 1 - clamp(Math.hypot(f.vx, f.vy) / k / 1.5, 0, 1)
                    const ang = fn.sigma * fn.flap * (0.45 + 0.55 * hover) * sway * Math.sin(t * 2 * Math.PI * sp.scull + (fn.sigma > 0 ? 0 : 2.2))
                    rot(fn.d0, axis, ang, fd0)
                    rot(fn.dm, axis, ang, fdm)
                    rot(fn.d1, axis, ang, fd1)
                    rot(fn.nf, axis, ang, fnf)
                } else {
                    for (let j = 0; j < 3; j++) {
                        fd0[j] = fn.d0[j]
                        fdm[j] = fn.dm[j]
                        fd1[j] = fn.d1[j]
                        fnf[j] = fn.nf[j]
                    }
                }
                const ls = fn.tail ? tailL / 0.9 : 1
                g.uniform3f(P.u.uB0, fn.b0[0], fn.b0[1], fn.b0[2])
                g.uniform3f(P.u.uB1, fn.b1[0], fn.b1[1], fn.b1[2])
                g.uniform2f(P.u.uS, fn.s0, fn.s1)
                g.uniform3f(P.u.uD0, fd0[0], fd0[1], fd0[2])
                g.uniform3f(P.u.uDm, fdm[0], fdm[1], fdm[2])
                g.uniform3f(P.u.uD1, fd1[0], fd1[1], fd1[2])
                g.uniform3f(P.u.uNf, fnf[0], fnf[1], fnf[2])
                g.uniform4f(P.u.uLenA, fn.len[0] * ls, fn.len[1] * ls, fn.len[2] * ls, fn.len[3] * ls)
                g.uniform1f(P.u.uLenB, fn.len[4] * ls)
                const amp = fn.wave[0] * sway * (fn.tail ? f.beatAmp : 1)
                g.uniform4f(P.u.uWave, amp, fn.wave[1], fn.wave[2], fn.wave[3])
                g.uniform4f(P.u.uWave2, fn.wave2[0], fn.wave2[1], fn.wave2[2] * sway, fn.wave2[3])
                g.uniform4f(P.u.uSway, fn.sway[0] * sway * (fn.tail ? 0.5 + f.beatAmp : 1), fn.sway[1], fn.sway[2], fn.sway[3])
                const pk = fn.pliancy * DRAG
                g.uniform3f(P.u.uDragB, f.dbx * pk + fn.droop[0], f.dby * pk + fn.droop[1], f.dbz * pk + fn.droop[2])
                g.uniform3f(P.u.uDragT, f.dtx * pk + fn.droop[0], f.dty * pk + fn.droop[1], f.dtz * pk + fn.droop[2])
                g.uniform4f(P.u.uFinA, fn.rays, fn.tone, fn.aBase, fn.aTip)
                g.uniform4f(P.u.uFinB, fn.rim, i * 7.31, glow, sway * (0.5 + 0.6 * f.beatAmp))
                // fins rise from the hood's colour
                const cb = fn.capMix
                g.uniform3f(
                    P.u.uColB,
                    cl.fins[0] * (1 - cb) + cl.cap[0] * cb,
                    cl.fins[1] * (1 - cb) + cl.cap[1] * cb,
                    cl.fins[2] * (1 - cb) + cl.cap[2] * cb
                )
                // Out along the fin the colour deepens toward amber, as thin
                // fins over black do in the clip.
                g.uniform3f(P.u.uColF, cl.fins[0] * 0.85, cl.fins[1] * 0.62, cl.fins[2] * 0.36)
                if (fn.tone < 0) g.uniform3f(P.u.uColR, cl.fins[0] * 0.16, cl.fins[1] * 0.1, cl.fins[2] * 0.07)
                else g.uniform3f(P.u.uColR, 0.03 + cl.fins[0] * 1.08, 0.01 + cl.fins[1] * 1.0, cl.fins[2] * 0.8)
                const grid = fn.big ? (fine ? gridBig : gridBigLo) : fine ? gridSmall : gridSmallLo
                g.bindVertexArray(fn.big ? (fine ? vaoBig : vaoBigLo) : fine ? vaoSmall : vaoSmallLo)
                g.drawElements(g.TRIANGLES, grid.index.length, g.UNSIGNED_SHORT, 0)
            }
            drawParticles(g, nBehind, nPart - nBehind)
            g.bindVertexArray(null)
            g.depthMask(true)
            drawn++

            // ------------------------------------------------ quality ladder
            // Judged on the median of recent frame gaps against 60 fps, so a
            // lone stall never costs sharpness; never ping-pong.
            if (!reduced) {
                lates[lateN % lates.length] = (rawDt * 1000) / 16.7
                lateN++
                if (lateN > 30) {
                    const med = median(lates, lateN)
                    if (med > 1.55) {
                        slow++
                        fast = 0
                        if (slow > 20 && quality > QUALITY_FLOOR) {
                            quality = Math.max(QUALITY_FLOOR, quality * 0.85)
                            slow = 0
                            if (drawn - lastRaise < 120) raiseLocked = true
                        }
                    } else if (med < 1.14) {
                        fast++
                        slow = 0
                        if (fast > 120 && quality < 1 && !raiseLocked) {
                            quality = Math.min(1, quality / 0.85)
                            lastRaise = drawn
                            fast = 0
                        }
                    }
                }
            }

            return !reduced
        }

        wake()

        return () => {
            running = false
            cancelAnimationFrame(raf)
            wakeRef.current = () => {}
            ro.disconnect()
            io.disconnect()
            mq?.removeEventListener?.("change", onMq)
            document.removeEventListener("visibilitychange", onVis)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointercancel", onLeave)
            root.removeEventListener("pointerleave", onLeave)
            window.removeEventListener("scroll", onScroll, { capture: true })
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            const g = gl
            if (g && !g.isContextLost()) {
                for (const b of bufs) g.deleteBuffer(b)
                g.deleteVertexArray(vaoBody)
                g.deleteVertexArray(vaoBig)
                g.deleteVertexArray(vaoSmall)
                g.deleteVertexArray(vaoBigLo)
                g.deleteVertexArray(vaoSmallLo)
                g.deleteVertexArray(vaoPart)
                if (bodyProg) g.deleteProgram(bodyProg.p)
                if (finProg) g.deleteProgram(finProg.p)
                if (partProg) g.deleteProgram(partProg.p)
            }
        }
    }, [])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                aspectRatio: `${REF_W} / ${REF_H}`,
                overflow: "hidden",
                background,
                touchAction: "pan-y",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: fallback ? "none" : "block" }}
            />
        </div>
    )
}

// ---------------------------------------------------------------- controls

const ControlType = { Color: "Color" } as const

const colorControls = (d: FishColors, head: string) => ({
    cap: { type: ControlType.Color, title: head, defaultValue: d.cap },
    body: { type: ControlType.Color, title: "Body", defaultValue: d.body },
    fins: { type: ControlType.Color, title: "Fins", defaultValue: d.fins },
})

// Control order arranged in the builder.
