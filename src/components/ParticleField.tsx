"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Selection, Select, SelectiveBloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { simplexNoise3D } from "@/lib/noiseGLSL";
import { introState } from "@/lib/introState";
import { isLowEndDevice } from "@/lib/deviceCapability";

// A UV grid mapped onto a double-helix surface — U runs along its length,
// V runs across each strand's own width. One fixed geometry throughout;
// "sparse cloud" vs "condensing column" vs "resolved helix" vs "wide flow
// further down the page" are all the SAME grid at different `spread`
// values, not different techniques or a position-morph between shapes.
const STRAND_COUNT = 2;
const U_DIVISIONS = 90;
const V_DIVISIONS = 10;

const COLUMN_HEIGHT = 6;
const HELIX_TWISTS = 2.5;
const HELIX_RADIUS = 0.65;
const RIBBON_WIDTH = 0.34;

const VORTEX_CENTER = 0.55;
const VORTEX_WIDTH = 0.06;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpread;
  uniform float uVortex;
  uniform float uDockFade;
  uniform float uGrowth;
  uniform float uReducedMotion;
  uniform float uPixelRatio;
  uniform float uSize;

  attribute vec2 aRandom;
  attribute float aT;
  attribute float aEdge;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;

  ${simplexNoise3D}

  void main() {
    vec3 basePos = position;

    // Fixed per-particle scatter direction/magnitude (from the same random
    // seed every frame, so particles converge along a consistent path
    // rather than jittering to new random spots each frame).
    vec2 scatterDir = normalize(aRandom - 0.5);
    float scatterMag = 0.7 + aRandom.x * 1.6;
    // Wider at the top than the bottom, matching the reference's tapered
    // cone silhouette during the sparse/condensing stages.
    float taper = mix(0.35, 1.5, aT);
    vec3 scattered = basePos + vec3(scatterDir.x, (aRandom.y - 0.5) * 1.2, scatterDir.y) * scatterMag * taper * uSpread;

    float noiseAmt = 0.14 * (1.0 - uReducedMotion * 0.85);
    float n1 = snoise(vec3(scattered.xy * 0.5, uTime * 0.15 + aRandom.x * 10.0));
    float n2 = snoise(vec3(scattered.yz * 0.5 + 5.0, uTime * 0.13 + aRandom.y * 10.0));
    vec3 displaced = scattered + vec3(n1, n2 * 0.6, n1 * 0.4) * noiseAmt;

    // Growth and dock-fade share one mechanic: expand from / collapse to
    // the exact same origin point (screen center, matching the seed orb),
    // so formation and dock read as one coherent object.
    float scale = uGrowth * uDockFade;
    displaced = mix(vec3(0.0), displaced, scale);

    // Vortex: pull toward center + spiral rotation (Part 2 only).
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

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    // Calibrated so a point at the camera's look-at distance (~9 units)
    // renders at roughly uSize pixels.
    float sizeAttenuation = uSize * uPixelRatio * (9.0 / -mvPosition.z);
    gl_PointSize = sizeAttenuation;
    gl_Position = projectionMatrix * mvPosition;

    // Crossing-point brightness: boosts near where a strand swings close
    // to the central axis — where the two strands visually intersect.
    float radialDist = length(displaced.xz);
    float crossBoost = smoothstep(HELIX_RADIUS_JS * 0.55, 0.0, radialDist) * (1.0 - uSpread);

    vColor = mix(vec3(1.0, 0.616, 0.180), vec3(0.184, 0.902, 0.820), aT);
    vAlpha = scale;
    vEdge = clamp(aEdge + crossBoost, 0.0, 1.0);
  }
`.replace("HELIX_RADIUS_JS", String(HELIX_RADIUS));

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

    float brightness = mix(0.32, 1.0, vEdge);
    vec3 color = vColor * brightness + core * 0.5 * vEdge;
    float alpha = glow * vAlpha * mix(0.35, 1.0, vEdge);

    gl_FragColor = vec4(color, alpha);
  }
`;

function generateGridData() {
  const count = STRAND_COUNT * U_DIVISIONS * V_DIVISIONS;
  const positions = new Float32Array(count * 3);
  const aEdge = new Float32Array(count);
  const aT = new Float32Array(count);
  const aRandom = new Float32Array(count * 2);

  let idx = 0;
  for (let s = 0; s < STRAND_COUNT; s++) {
    const strandPhase = s * Math.PI; // two strands, 180° apart

    for (let ui = 0; ui < U_DIVISIONS; ui++) {
      const u = ui / (U_DIVISIONS - 1);

      const helixAngle = u * HELIX_TWISTS * Math.PI * 2 + strandPhase;
      const ccx = Math.cos(helixAngle) * HELIX_RADIUS;
      const ccz = Math.sin(helixAngle) * HELIX_RADIUS;
      const ccy = (u - 0.5) * COLUMN_HEIGHT;
      const radialX = Math.cos(helixAngle);
      const radialZ = Math.sin(helixAngle);

      for (let vi = 0; vi < V_DIVISIONS; vi++) {
        const v = vi / (V_DIVISIONS - 1) - 0.5;

        positions[idx * 3] = ccx + v * RIBBON_WIDTH * radialX;
        positions[idx * 3 + 1] = ccy;
        positions[idx * 3 + 2] = ccz + v * RIBBON_WIDTH * radialZ;

        aEdge[idx] = Math.pow(Math.abs(v) * 2.0, 1.3);
        aT[idx] = u;
        aRandom[idx * 2] = Math.random();
        aRandom[idx * 2 + 1] = Math.random();

        idx++;
      }
    }
  }

  return { positions, aEdge, aT, aRandom, count };
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
const GRID_DATA = generateGridData();
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
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpread: { value: 1.4 },
      uVortex: { value: 0 },
      uDockFade: { value: 1 },
      uGrowth: { value: 0 },
      uReducedMotion: { value: reducedMotion ? 1 : 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1 },
      uSize: { value: 2.0 },
    }),
    [reducedMotion]
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const u = materialRef.current?.uniforms;
    if (!u) return;
    u.uTime.value = timeRef.current;

    if (!introState.done) {
      // 0-8%: quick pop-in from the seed point.
      // 8-55%: sparse wide cone (1A) -> condensing (1B) -> resolved double
      // helix (1C) — one continuous spread interpolation, not discrete
      // stage jumps.
      // 55-65%: landing hold, fully resolved.
      const p = introState.progress;
      const growthTarget = THREE.MathUtils.smoothstep(p, 0, 0.08);
      const spreadTarget = THREE.MathUtils.lerp(1.4, 0, THREE.MathUtils.smoothstep(p, 0.08, 0.55));
      u.uGrowth.value = THREE.MathUtils.lerp(u.uGrowth.value, growthTarget, 0.18);
      u.uSpread.value = THREE.MathUtils.lerp(u.uSpread.value, spreadTarget, 0.1);
      u.uDockFade.value = THREE.MathUtils.lerp(u.uDockFade.value, introState.dockFade, 0.22);
      u.uVortex.value = 0;
    } else {
      // Part 2: driven by actual scroll position past the pin's own
      // measured end (ScrollTrigger's real self.end) — no drift/jump at
      // the Stage 3->4 handoff.
      const totalScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight - introState.endScrollY,
        1
      );
      const rest = THREE.MathUtils.clamp((window.scrollY - introState.endScrollY) / totalScroll, 0, 1);

      // Re-diverges from the resolved helix into a wide, dense sparkle
      // cone/flow, then stays there for the remainder of the page.
      const spreadTarget = THREE.MathUtils.lerp(0, 2.0, THREE.MathUtils.smoothstep(rest, 0.0, 0.22));
      u.uGrowth.value = 1;
      u.uDockFade.value = THREE.MathUtils.lerp(u.uDockFade.value, 1, 0.15);
      u.uSpread.value = THREE.MathUtils.lerp(u.uSpread.value, spreadTarget, 0.06);

      const dist = Math.abs(rest - VORTEX_CENTER);
      const vortexTarget = reducedMotion ? 0 : Math.max(0, 1 - dist / VORTEX_WIDTH);
      u.uVortex.value = THREE.MathUtils.lerp(u.uVortex.value, vortexTarget, 0.08);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[GRID_DATA.positions, 3]} />
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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(reduced);
    // Reduced motion gets the same plain fallback as a low-end device — no
    // WebGL animation at all, just the static docked logo and a calm
    // gradient. The one unambiguous reading of "skip to the end state."
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
                  the starfield and all page text/DOM content (outside
                  this WebGL scene entirely) are unaffected either way. */}
              <EffectComposer multisampling={0} autoClear={false}>
                <SelectiveBloom
                  intensity={0.35}
                  luminanceThreshold={0.15}
                  luminanceSmoothing={0.4}
                  mipmapBlur
                  radius={0.4}
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
