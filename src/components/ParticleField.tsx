"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Selection, Select, SelectiveBloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { simplexNoise3D } from "@/lib/noiseGLSL";
import { scrollProgress } from "@/lib/scrollProgress";
import { introState } from "@/lib/introState";
import { isLowEndDevice } from "@/lib/deviceCapability";

// A UV grid mapped onto a curved surface — U runs along the shape's length,
// V runs around its circumference/width. Each fixed-V row, sampled densely
// along U, reads as one continuous wavy strand; the full grid together
// reads as a woven mesh, not a scattered cloud.
const U_DIVISIONS = 90;
const V_DIVISIONS = 14;

const COLUMN_HEIGHT = 6;
const HELIX_TWISTS = 3;
const HELIX_RADIUS = 0.55;
const TUBE_RADIUS = 0.14;

const WAVE_WIDTH = 16;
const WAVE_TUBE_RADIUS = 0.16;

const VORTEX_CENTER = 0.5;
const VORTEX_WIDTH = 0.06;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uVortex;
  uniform float uDockFade;
  uniform float uGrowth;
  uniform float uReducedMotion;
  uniform float uPixelRatio;
  uniform float uSize;

  attribute vec3 aWavePos;
  attribute vec2 aRandom;
  attribute float aT;
  attribute float aEdge;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;

  ${simplexNoise3D}

  void main() {
    vec3 columnPos = position;
    vec3 wavePos = aWavePos;
    vec3 basePos = mix(columnPos, wavePos, uMorph);

    // Kept gentle relative to the grid spacing so rows ripple like flowing
    // silk without breaking apart into noise — the row structure is the
    // whole point, unlike the earlier random-scatter cloud.
    float noiseAmt = 0.18 * (1.0 - uReducedMotion * 0.85);
    float n1 = snoise(vec3(basePos.xy * 0.5, uTime * 0.15 + aRandom.x * 10.0));
    float n2 = snoise(vec3(basePos.yz * 0.5 + 5.0, uTime * 0.13 + aRandom.y * 10.0));
    vec3 displaced = basePos + vec3(n1, n2 * 0.6, n1 * 0.4) * noiseAmt;

    // Column growth: particles rise into place during Stage 1.
    displaced.y = mix(basePos.y - 4.0, displaced.y, uGrowth);

    // Vortex: pull toward center + spiral rotation.
    if (uVortex > 0.001) {
      vec2 offs = displaced.xy;
      float dist = length(offs);
      float pull = uVortex * smoothstep(5.0, 0.0, dist);
      float angle = uVortex * 2.4 * (1.0 - dist / 5.0);
      float ca = cos(angle);
      float sa = sin(angle);
      vec2 rotated = mat2(ca, -sa, sa, ca) * offs;
      displaced.xy = mix(offs, rotated * (1.0 - pull * 0.6), uVortex);
    }

    // Dock fade: collapse the whole grid toward the origin point.
    displaced = mix(vec3(0.0), displaced, uDockFade);

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    float sizeAttenuation = uSize * uPixelRatio * (200.0 / -mvPosition.z);
    gl_PointSize = sizeAttenuation * mix(1.0, 0.15, 1.0 - uDockFade) * mix(0.05, 1.0, uGrowth);
    gl_Position = projectionMatrix * mvPosition;

    vColor = mix(vec3(1.0, 0.616, 0.180), vec3(0.184, 0.902, 0.820), aT);
    vAlpha = uDockFade * uGrowth;
    vEdge = aEdge;
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

    // Edge-bright, interior-fade: particles at the tube's silhouette edge
    // (vEdge near 1) read as the bright core strand; interior particles
    // (vEdge near 0) stay dim and diffuse.
    float brightness = mix(0.35, 1.0, vEdge);
    vec3 color = vColor * brightness + core * 0.5 * vEdge;
    float alpha = glow * vAlpha * mix(0.4, 1.0, vEdge);

    gl_FragColor = vec4(color, alpha);
  }
`;

function generateGridData(uDiv: number, vDiv: number) {
  const count = uDiv * vDiv;
  const columnPos = new Float32Array(count * 3);
  const wavePos = new Float32Array(count * 3);
  const aEdge = new Float32Array(count);
  const aT = new Float32Array(count);
  const aRandom = new Float32Array(count * 2);

  let idx = 0;
  for (let ui = 0; ui < uDiv; ui++) {
    const u = ui / (uDiv - 1);

    // Column: a single tube spiraling around the vertical axis. Its own
    // left/right silhouette edges (see aEdge below) are what read as a
    // "double helix" as it twists, rather than two separately-tracked
    // strands — matching a UV-parameterized tube/curve surface.
    const helixAngle = u * HELIX_TWISTS * Math.PI * 2;
    const ccx = Math.cos(helixAngle) * HELIX_RADIUS;
    const ccz = Math.sin(helixAngle) * HELIX_RADIUS;
    const ccy = (u - 0.5) * COLUMN_HEIGHT;

    // Wave: the same grid identity (same u, v per particle), remapped onto
    // a wide horizontal undulating band for Part 2.
    const wx = (u - 0.5) * WAVE_WIDTH;
    const wy = Math.sin(wx * 0.5 + 1.2) * 1.1 + Math.sin(wx * 0.17 - 0.4) * 0.6;

    for (let vi = 0; vi < vDiv; vi++) {
      const v = vi / (vDiv - 1);
      const crossAngle = v * Math.PI * 2;
      const cosC = Math.cos(crossAngle);
      const sinC = Math.sin(crossAngle);

      const colOx = TUBE_RADIUS * cosC * Math.cos(helixAngle);
      const colOz = TUBE_RADIUS * cosC * Math.sin(helixAngle);
      const colOy = TUBE_RADIUS * sinC;

      columnPos[idx * 3] = ccx + colOx;
      columnPos[idx * 3 + 1] = ccy + colOy;
      columnPos[idx * 3 + 2] = ccz + colOz;

      const waveOy = WAVE_TUBE_RADIUS * sinC;
      const waveOz = WAVE_TUBE_RADIUS * cosC;

      wavePos[idx * 3] = wx;
      wavePos[idx * 3 + 1] = wy + waveOy;
      wavePos[idx * 3 + 2] = waveOz;

      // Peaks at crossAngle 0/π (the tube's leftmost/rightmost points as
      // seen from a front-on camera) — its silhouette edge.
      aEdge[idx] = Math.pow(Math.abs(cosC), 1.4);
      aT[idx] = u;
      aRandom[idx * 2] = Math.random();
      aRandom[idx * 2 + 1] = Math.random();

      idx++;
    }
  }

  return { columnPos, wavePos, aEdge, aT, aRandom, count };
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

// Computed once at module evaluation (not during render) — the geometry is
// randomized but static for the page's lifetime, so this sidesteps the
// render-purity rule around calling Math.random() inside component bodies.
const GRID_DATA = generateGridData(U_DIVISIONS, V_DIVISIONS);
const STARFIELD_POSITIONS = generateStarfieldPositions(500);

function Starfield() {
  const ref = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[STARFIELD_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#9fd6ff"
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
  const introEndFractionRef = useRef(0.15);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uVortex: { value: 0 },
      uDockFade: { value: 1 },
      uGrowth: { value: 0 },
      uReducedMotion: { value: reducedMotion ? 1 : 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1 },
      uSize: { value: 2.1 },
    }),
    [reducedMotion]
  );

  useEffect(() => {
    // Measure how much of the total page scroll the pinned intro consumes,
    // so Part 2's progress can be remapped to start fresh right after it.
    const measure = () => {
      const doc = document.documentElement;
      const totalScroll = doc.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const spacer = document.querySelector(".pin-spacer");
        const introHeight = spacer ? spacer.getBoundingClientRect().height : totalScroll * 0.15;
        introEndFractionRef.current = Math.min(Math.max(introHeight / totalScroll, 0.03), 0.4);
      }
    };
    const t = window.setTimeout(measure, 600);
    return () => window.clearTimeout(t);
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const u = materialRef.current?.uniforms;
    if (!u) return;
    u.uTime.value = timeRef.current;

    if (!introState.done) {
      const p = introState.progress;
      const growthTarget = THREE.MathUtils.smoothstep(p, 0, 0.55);
      u.uGrowth.value = THREE.MathUtils.lerp(u.uGrowth.value, growthTarget, 0.12);
      u.uMorph.value = THREE.MathUtils.lerp(u.uMorph.value, 0, 0.12);
      u.uDockFade.value = THREE.MathUtils.lerp(u.uDockFade.value, introState.dockFade, 0.18);
      u.uVortex.value = THREE.MathUtils.lerp(u.uVortex.value, 0, 0.1);
    } else {
      const introFraction = introEndFractionRef.current;
      const rest = THREE.MathUtils.clamp(
        (scrollProgress.current - introFraction) / Math.max(1 - introFraction, 0.01),
        0,
        1
      );
      const morphTarget = THREE.MathUtils.smoothstep(rest, 0.0, 0.22);
      u.uGrowth.value = 1;
      u.uDockFade.value = THREE.MathUtils.lerp(u.uDockFade.value, 1, 0.15);
      u.uMorph.value = THREE.MathUtils.lerp(u.uMorph.value, morphTarget, 0.06);

      const dist = Math.abs(rest - VORTEX_CENTER);
      const vortexTarget = reducedMotion ? 0 : Math.max(0, 1 - dist / VORTEX_WIDTH);
      u.uVortex.value = THREE.MathUtils.lerp(u.uVortex.value, vortexTarget, 0.08);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[GRID_DATA.columnPos, 3]} />
        <bufferAttribute attach="attributes-aWavePos" args={[GRID_DATA.wavePos, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[GRID_DATA.aRandom, 2]} />
        <bufferAttribute attach="attributes-aT" args={[GRID_DATA.aT, 1]} />
        <bufferAttribute attach="attributes-aEdge" args={[GRID_DATA.aEdge, 1]} />
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
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<"loading" | "particles" | "fallback">("loading");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Deliberate: matchMedia/hardwareConcurrency only exist client-side, so
    // this can't be a lazy useState initializer without risking a
    // server/client render mismatch — "loading" (renders nothing) is the
    // correct, matching first paint on both.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMode(isLowEndDevice() ? "fallback" : "particles");
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
      <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 9], fov: 55 }}
          frameloop={visible ? "always" : "never"}
        >
          <Suspense fallback={null}>
            <Selection>
              {/* Bloom is isolated to the particle grid only, via Select —
                  the starfield and (obviously) all page text/DOM content
                  sit outside this WebGL scene entirely and are unaffected. */}
              <EffectComposer multisampling={0} autoClear={false}>
                <SelectiveBloom
                  intensity={0.45}
                  luminanceThreshold={0.15}
                  luminanceSmoothing={0.4}
                  mipmapBlur
                  radius={0.5}
                />
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
