"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Selection, Select, SelectiveBloom, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { simplexNoise3D } from "@/lib/noiseGLSL";
import { introState } from "@/lib/introState";
import { scrollVelocity } from "@/lib/scrollVelocity";
import { liquidIntensity } from "@/lib/liquidIntensity";
import { sampleTextPoints } from "@/lib/sampleTextPoints";
import { isLowEndDevice } from "@/lib/deviceCapability";

// One particle identity (1800 points) carried through every shape in the
// chain: swirl -> orb -> wordmark -> helix -> vortex -> wave. Each shape is
// a UV-grid / parametric surface sampled into a position array of the same
// length — never random scatter, never a solid mesh.
const TOTAL_COUNT = 1800;
const HELIX_RADIUS = 0.65;

function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = THREE.MathUtils.clamp((v - inMin) / (inMax - inMin), 0, 1);
  return THREE.MathUtils.lerp(outMin, outMax, t);
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorphT; // 0..4 chain position: swirl->orb->wordmark->helix->vortex
  uniform float uWaveBlend; // 0..1, vortex -> wave (past all content)
  uniform float uLiquid; // 0..1, liquid/chromatic distortion intensity (Stage 2)
  uniform float uVortexSpin; // accumulated radians, scroll-velocity-driven
  uniform float uOpacity;
  uniform float uReducedMotion;
  uniform float uPixelRatio;
  uniform float uSize;

  attribute vec3 pSwirlParams; // radius, height, angleSeed
  attribute vec3 pOrb;
  attribute vec3 pWordmark;
  attribute vec3 pHelix;
  attribute vec3 pVortexParams; // radius, height, angleSeed
  attribute vec3 pWave;
  attribute vec2 aRandom;
  attribute float aT;
  attribute float aEdge;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;

  ${simplexNoise3D}

  vec3 computeSwirl() {
    float angle = pSwirlParams.z + uTime * (0.18 + aRandom.x * 0.12);
    return vec3(cos(angle) * pSwirlParams.x, pSwirlParams.y, sin(angle) * pSwirlParams.x);
  }

  vec3 computeVortex() {
    float angle = pVortexParams.z + uVortexSpin;
    return vec3(cos(angle) * pVortexParams.x, pVortexParams.y, sin(angle) * pVortexParams.x);
  }

  void main() {
    vec3 swirlPos = computeSwirl();
    vec3 vortexPos = computeVortex();

    vec3 morphed;
    if (uMorphT < 1.0) {
      morphed = mix(swirlPos, pOrb, uMorphT);
    } else if (uMorphT < 2.0) {
      morphed = mix(pOrb, pWordmark, uMorphT - 1.0);
    } else if (uMorphT < 3.0) {
      morphed = mix(pWordmark, pHelix, uMorphT - 2.0);
    } else {
      morphed = mix(pHelix, vortexPos, clamp(uMorphT - 3.0, 0.0, 1.0));
    }

    vec3 withWave = mix(morphed, pWave, uWaveBlend);

    // Liquid distortion: organic warping during Stage 2, on top of the
    // (still orb-shaped) particles.
    float liquidN = snoise(vec3(withWave.xy * 1.2, uTime * 0.4 + aRandom.x * 6.0));
    float liquidN2 = snoise(vec3(withWave.yz * 1.2 + 3.0, uTime * 0.35 + aRandom.y * 6.0));
    vec3 liquidOffset = vec3(liquidN, liquidN2, liquidN * 0.6) * uLiquid * 0.55;

    float noiseAmt = 0.1 * (1.0 - uReducedMotion * 0.85);
    float n1 = snoise(vec3(withWave.xy * 0.5, uTime * 0.15 + aRandom.x * 10.0));
    float n2 = snoise(vec3(withWave.yz * 0.5 + 5.0, uTime * 0.13 + aRandom.y * 10.0));
    vec3 displaced = withWave + liquidOffset + vec3(n1, n2 * 0.6, n1 * 0.4) * noiseAmt;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    float sizeAttenuation = uSize * uPixelRatio * (9.0 / -mvPosition.z);
    gl_PointSize = sizeAttenuation;
    gl_Position = projectionMatrix * mvPosition;

    // Crossing-point brightness only while in the helix->vortex segment.
    float radialDist = length(displaced.xz);
    float inHelixRange = step(2.5, uMorphT) * step(uMorphT, 3.5);
    float crossBoost = smoothstep(${HELIX_RADIUS.toFixed(2)} * 0.55, 0.0, radialDist) * inHelixRange;

    vColor = mix(vec3(1.0, 0.616, 0.180), vec3(0.184, 0.902, 0.820), aT);
    vColor = mix(vColor, vec3(0.85, 0.35, 0.95), uLiquid * 0.35);
    vAlpha = uOpacity;
    vEdge = clamp(aEdge + crossBoost, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.15, 0.0, d);

    // Edge particles read as the bright core row (up to full brightness);
    // interior particles stay dim but never below a 0.4 floor — clear
    // contrast, not uniform faintness.
    float brightness = mix(0.4, 1.0, vEdge);
    vec3 color = vColor * brightness + core * 0.6 * vEdge;
    float alphaFloor = mix(0.4, 1.0, vEdge);
    float alpha = glow * vAlpha * alphaFloor;

    gl_FragColor = vec4(color, alpha);
  }
`;

function generateHelix(count: number) {
  const STRANDS = 2;
  const U = 90;
  const V = 10; // 2*90*10 = 1800
  const pos = new Float32Array(count * 3);
  const aT = new Float32Array(count);
  const aEdge = new Float32Array(count);
  let idx = 0;
  for (let s = 0; s < STRANDS; s++) {
    const phase = s * Math.PI;
    for (let ui = 0; ui < U; ui++) {
      const u = ui / (U - 1);
      const angle = u * 2.5 * Math.PI * 2 + phase;
      const cx = Math.cos(angle) * HELIX_RADIUS;
      const cz = Math.sin(angle) * HELIX_RADIUS;
      const cy = (u - 0.5) * 6;
      const radialX = Math.cos(angle);
      const radialZ = Math.sin(angle);
      for (let vi = 0; vi < V; vi++) {
        const v = vi / (V - 1) - 0.5;
        pos[idx * 3] = cx + v * 0.34 * radialX;
        pos[idx * 3 + 1] = cy;
        pos[idx * 3 + 2] = cz + v * 0.34 * radialZ;
        aEdge[idx] = Math.pow(Math.abs(v) * 2, 1.3);
        aT[idx] = u;
        idx++;
      }
    }
  }
  return { pos, aT, aEdge };
}

function generateOrb(count: number) {
  const pos = new Float32Array(count * 3);
  const RADIUS = 0.55;
  const LAT = 45;
  const LON = 40; // 45*40 = 1800
  let idx = 0;
  for (let i = 0; i < LAT; i++) {
    const theta = (i / (LAT - 1)) * Math.PI;
    for (let j = 0; j < LON; j++) {
      const phi = (j / LON) * Math.PI * 2;
      pos[idx * 3] = RADIUS * Math.sin(theta) * Math.cos(phi);
      pos[idx * 3 + 1] = RADIUS * Math.cos(theta);
      pos[idx * 3 + 2] = RADIUS * Math.sin(theta) * Math.sin(phi);
      idx++;
    }
  }
  return pos;
}

function generateSwirlParams(count: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = 0.9 + Math.random() * 1.6;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 2.6;
    arr[i * 3 + 2] = Math.random() * Math.PI * 2;
  }
  return arr;
}

function generateVortexParams(count: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 0.25 + Math.pow(Math.random(), 0.6) * 2.0;
    const spiralTwist = radius * 2.2;
    arr[i * 3] = radius;
    arr[i * 3 + 1] = (radius - 1.1) * 0.5 + (Math.random() - 0.5) * 0.25;
    arr[i * 3 + 2] = Math.random() * Math.PI * 2 + spiralTwist;
  }
  return arr;
}

function generateWave(count: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 18;
    const z = (Math.random() - 0.5) * 3;
    const y = Math.sin(x * 0.4 + 1.1) * 1.0 + Math.sin(x * 0.15 - 0.6) * 0.7 + (Math.random() - 0.5) * 0.5;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
  }
  return pos;
}

function generateStarfieldPositions(count: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 30;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
  }
  return arr;
}

// Tints each star orange or cyan (the same two brand hues as the main
// particle system, via THREE.Color's built-in sRGB hex parsing) instead of
// a generic off-brand blue, with a little per-star brightness variance so
// the field doesn't read as two flat, uniform colors.
function generateStarfieldColors(count: number) {
  const orange = new THREE.Color("#f2a878");
  const cyan = new THREE.Color("#8fd4c6");
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const base = Math.random() < 0.5 ? orange : cyan;
    const shade = 0.7 + Math.random() * 0.5;
    arr[i * 3] = base.r * shade;
    arr[i * 3 + 1] = base.g * shade;
    arr[i * 3 + 2] = base.b * shade;
  }
  return arr;
}

// Computed once at module evaluation (not during render) — all pure math,
// no DOM/canvas access — sidesteps the render-purity rule around calling
// Math.random() inside component bodies.
const HELIX = generateHelix(TOTAL_COUNT);
const ORB_POS = generateOrb(TOTAL_COUNT);
const SWIRL_PARAMS = generateSwirlParams(TOTAL_COUNT);
const VORTEX_PARAMS = generateVortexParams(TOTAL_COUNT);
const WAVE_POS = generateWave(TOTAL_COUNT);
const STARFIELD_POSITIONS = generateStarfieldPositions(500);
const STARFIELD_COLORS = generateStarfieldColors(500);
// Wordmark needs canvas text sampling (client-only); starts as a copy of
// the orb so there's no flash of degenerate geometry before the real
// sample runs in an effect, well before any user could scroll that far.
const WORDMARK_POS = new Float32Array(ORB_POS);

const RANDOM = (() => {
  const arr = new Float32Array(TOTAL_COUNT * 2);
  for (let i = 0; i < TOTAL_COUNT; i++) {
    arr[i * 2] = Math.random();
    arr[i * 2 + 1] = Math.random();
  }
  return arr;
})();

function Starfield() {
  const ref = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[STARFIELD_POSITIONS, 3]} />
        <bufferAttribute attach="attributes-color" args={[STARFIELD_COLORS, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function ParticleGrid({ reducedMotion }: { reducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const wordmarkAttrRef = useRef<THREE.BufferAttribute>(null);
  const timeRef = useRef(0);
  const spinSpeedRef = useRef(0.4);
  const spinAngleRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorphT: { value: 0 },
      uWaveBlend: { value: 0 },
      uLiquid: { value: 0 },
      uVortexSpin: { value: 0 },
      uOpacity: { value: 1 },
      uReducedMotion: { value: reducedMotion ? 1 : 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1 },
      uSize: { value: 2.6 },
    }),
    [reducedMotion]
  );

  useEffect(() => {
    const points = sampleTextPoints("D.N.A.");
    if (points.length === 0 || !wordmarkAttrRef.current) return;
    const arr = wordmarkAttrRef.current.array as Float32Array;
    for (let i = 0; i < TOTAL_COUNT; i++) {
      const [x, y] = points[i % points.length];
      arr[i * 3] = x + (Math.random() - 0.5) * 0.05;
      arr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.05;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    wordmarkAttrRef.current.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const u = materialRef.current?.uniforms;
    if (!u) return;
    u.uTime.value = timeRef.current;

    if (!introState.done) {
      const p = introState.progress;
      // Stage 1 (0-12%) swirl->orb, Stage 2 (12-22%) liquid reveal holds
      // the orb shape, Stage 3 (22-38%) orb->wordmark, Stage 4 (38-52%)
      // wordmark->helix, Stage 5 (52-60%) helix collapses into the vortex,
      // then a real hold at full vortex (60-100%) — a ~40% span, well past
      // the 15-20% minimum — through the dock (Stage 7, ~86-95%) and unpin.
      let morphT: number;
      if (p < 0.12) morphT = mapRange(p, 0, 0.12, 0, 1);
      else if (p < 0.22) morphT = 1;
      else if (p < 0.38) morphT = mapRange(p, 0.22, 0.38, 1, 2);
      else if (p < 0.52) morphT = mapRange(p, 0.38, 0.52, 2, 3);
      else if (p < 0.6) morphT = mapRange(p, 0.52, 0.6, 3, 4);
      else morphT = 4;
      u.uMorphT.value = THREE.MathUtils.lerp(u.uMorphT.value, morphT, 0.25);

      const liquidCenter = 0.17;
      const liquidHalf = 0.06;
      const liquidTarget = Math.max(0, 1 - Math.abs(p - liquidCenter) / liquidHalf);
      u.uLiquid.value = THREE.MathUtils.lerp(u.uLiquid.value, liquidTarget, 0.2);
      liquidIntensity.current = u.uLiquid.value;

      u.uOpacity.value = THREE.MathUtils.lerp(u.uOpacity.value, 1, 0.2);
      u.uWaveBlend.value = 0;
    } else {
      u.uLiquid.value = THREE.MathUtils.lerp(u.uLiquid.value, 0, 0.2);
      liquidIntensity.current = u.uLiquid.value;
      u.uMorphT.value = 4;

      const totalScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight - introState.endScrollY,
        1
      );
      const rest = THREE.MathUtils.clamp((window.scrollY - introState.endScrollY) / totalScroll, 0, 1);

      const waveBlendTarget = THREE.MathUtils.smoothstep(rest, 0.9, 0.99);
      u.uWaveBlend.value = THREE.MathUtils.lerp(u.uWaveBlend.value, waveBlendTarget, 0.08);

      // Faint ambient presence during content scroll (never below the 0.4
      // floor — dim, not gone), fuller again for the closing wave in the
      // empty space past all content.
      const opacityTarget = THREE.MathUtils.lerp(0.4, 0.75, waveBlendTarget);
      u.uOpacity.value = THREE.MathUtils.lerp(u.uOpacity.value, opacityTarget, 0.1);
    }

    // Vortex spin speed follows scroll velocity in real time, damped so it
    // never snaps — fast scrolling spins it up, stopping eases it back to
    // a slow idle rather than an abrupt halt.
    const targetSpeed = reducedMotion ? 0.15 : 0.4 + Math.min(Math.abs(scrollVelocity.current) * 0.15, 3.5);
    spinSpeedRef.current = THREE.MathUtils.lerp(spinSpeedRef.current, targetSpeed, 0.05);
    spinAngleRef.current += spinSpeedRef.current * delta;
    u.uVortexSpin.value = spinAngleRef.current;
  });

  return (
    <points>
      <bufferGeometry>
        {/* Three.js needs a standard `position` attribute present to know
            the vertex count for the draw call and to compute a bounding
            sphere for frustum culling — without one, the whole object gets
            silently culled even though the shader computes real position
            entirely from the custom attributes below (this value is
            never read). */}
        <bufferAttribute attach="attributes-position" args={[HELIX.pos, 3]} />
        <bufferAttribute attach="attributes-pSwirlParams" args={[SWIRL_PARAMS, 3]} />
        <bufferAttribute attach="attributes-pOrb" args={[ORB_POS, 3]} />
        <bufferAttribute ref={wordmarkAttrRef} attach="attributes-pWordmark" args={[WORDMARK_POS, 3]} />
        <bufferAttribute attach="attributes-pHelix" args={[HELIX.pos, 3]} />
        <bufferAttribute attach="attributes-pVortexParams" args={[VORTEX_PARAMS, 3]} />
        <bufferAttribute attach="attributes-pWave" args={[WAVE_POS, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[RANDOM, 2]} />
        <bufferAttribute attach="attributes-aT" args={[HELIX.aT, 1]} />
        <bufferAttribute attach="attributes-aEdge" args={[HELIX.aEdge, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ChromaticAberrationEffect() {
  const ref = useRef<{ offset: THREE.Vector2 } | null>(null);

  useFrame(() => {
    if (!ref.current) return;
    const amt = liquidIntensity.current * 0.006;
    ref.current.offset.set(amt, amt * 0.6);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ChromaticAberration ref={ref as any} offset={[0, 0]} />;
}

function FallbackBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,112,63,0.14), transparent 60%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(47,158,143,0.14), transparent 60%), #060608",
      }}
    />
  );
}

export default function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<"loading" | "particles" | "fallback">("loading");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Stages 0-6 need the particle canvas ABOVE all page content (with an
    // opaque backdrop) so nothing else is visible during the intro; Part 2
    // needs it BEHIND content (its normal z-0 spot). Toggling z-index and
    // fading the backdrop here — reading introState directly every frame
    // via its own rAF loop — is simpler and more precise than polling from
    // a timer or threading a callback through IntroSequence.
    if (mode !== "particles") return;
    let raf = 0;
    const tick = () => {
      const p = introState.progress;
      const done = introState.done;
      // Stays fully opaque through the Stage 7 dock (ends ~95%) so page
      // content never peeks through behind the particles before the pin
      // actually releases; only fades in the last few percent.
      const backdropOpacity = done ? 0 : Math.max(0, 1 - Math.max(0, (p - 0.96) / 0.04));
      if (backdropRef.current) backdropRef.current.style.opacity = String(backdropOpacity);
      if (containerRef.current) containerRef.current.style.zIndex = done ? "0" : "200";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  useEffect(() => {
    // Deliberate: matchMedia/hardwareConcurrency only exist client-side, so
    // this can't be a lazy useState initializer without risking a
    // server/client render mismatch — "loading" (renders nothing) is the
    // correct, matching first paint on both.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(reduced);
    // Reduced motion gets the same plain fallback as a low-end device — no
    // WebGL animation at all, just the static content and a calm gradient.
    setMode(reduced || isLowEndDevice() ? "fallback" : "particles");
  }, []);

  useEffect(() => {
    // The canvas is `fixed inset-0`, so it's always geometrically within the
    // viewport — IntersectionObserver alone can't tell us anything useful.
    // What actually matters here is whether the *tab* is visible at all.
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(containerRef.current);

    const onVisibilityChange = () => {
      setVisible(document.visibilityState === "visible" && !!containerRef.current);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  if (mode === "loading") return null;

  if (mode === "fallback") {
    return (
      <>
        <FallbackBackground />
        <div className="pointer-events-none fixed inset-0 z-[5]" style={{ background: "rgba(0,0,0,0.5)" }} />
      </>
    );
  }

  return (
    <>
      <div ref={containerRef} className="pointer-events-none fixed inset-0" style={{ zIndex: 200 }}>
        <div ref={backdropRef} className="absolute inset-0" style={{ background: "#060608" }} />
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 9], fov: 55 }}
          frameloop={visible ? "always" : "never"}
        >
          <Suspense fallback={null}>
            <Selection>
              {/* Bloom + chromatic aberration are isolated to the particle
                  grid only, via Select — the starfield and all page
                  text/DOM content (outside this WebGL scene entirely) are
                  unaffected either way. */}
              <EffectComposer multisampling={0} autoClear={false}>
                <SelectiveBloom
                  intensity={0.35}
                  luminanceThreshold={0.15}
                  luminanceSmoothing={0.4}
                  mipmapBlur
                  radius={0.4}
                />
                <ChromaticAberrationEffect />
              </EffectComposer>
              <Starfield />
              <Select enabled>
                <ParticleGrid reducedMotion={reducedMotion} />
              </Select>
            </Selection>
          </Suspense>
        </Canvas>
      </div>

      {/* Scrim: keeps every headline/body/button block at strong, consistent
          contrast against the particle system behind it. */}
      <div className="pointer-events-none fixed inset-0 z-[5]" style={{ background: "rgba(0,0,0,0.5)" }} />
    </>
  );
}
