"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { scrollProgress } from "@/lib/scrollProgress";

const BRAND_ORANGE = "#ff9d2e";
const BRAND_CYAN = "#2fe6d1";
const VB_W = 400;
const VB_H = 800;
const SAMPLES = 60;

function buildStrandPath(t01: number, strandOffset: number) {
  // t01 = 0 → tight double-helix, t01 = 1 → loose, wide flowing wave.
  const frequency = gsap.utils.interpolate(7, 1.4, t01);
  const amplitude = gsap.utils.interpolate(55, 130, t01);
  const centerX = VB_W / 2;
  let d = "";
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const y = t * VB_H;
    const x = centerX + amplitude * Math.sin(frequency * t * Math.PI * 2 + strandOffset);
    d += i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : ` L${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d;
}

const HELIX_A = buildStrandPath(0, 0);
const HELIX_B = buildStrandPath(0, Math.PI);
const WAVE_A = buildStrandPath(1, 0);
const WAVE_B = buildStrandPath(1, Math.PI);

export default function HelixWaveBackground() {
  const strandARef = useRef<SVGPathElement>(null);
  const strandBRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin);

    strandARef.current?.setAttribute("d", HELIX_A);
    strandBRef.current?.setAttribute("d", HELIX_B);

    const ctx = gsap.context(() => {
      // Paused tweens whose progress we drive directly from Lenis's scroll
      // progress each frame — a continuous liquid morph, not a hard cut.
      const morphA = gsap.to(strandARef.current, {
        morphSVG: WAVE_A,
        duration: 1,
        ease: "none",
        paused: true,
      });
      const morphB = gsap.to(strandBRef.current, {
        morphSVG: WAVE_B,
        duration: 1,
        ease: "none",
        paused: true,
      });

      gsap.set([strandARef.current, strandBRef.current], { drawSVG: "0%" });

      let raf = 0;
      const tick = () => {
        const progress = scrollProgress.current;

        morphA.progress(progress);
        morphB.progress(progress);

        // Draws the strands on-screen over the first slice of scroll — i.e.
        // right as the intro sequence unpins and the hero comes into view.
        const drawPercent = gsap.utils.clamp(0, 100, (progress / 0.06) * 100);
        gsap.set(strandARef.current, { drawSVG: `0% ${drawPercent}%` });
        gsap.set(strandBRef.current, { drawSVG: `0% ${drawPercent}%` });

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="helix-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={BRAND_ORANGE} />
              <stop offset="100%" stopColor={BRAND_CYAN} />
            </linearGradient>
            <linearGradient id="helix-grad-b" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={BRAND_CYAN} />
              <stop offset="100%" stopColor={BRAND_ORANGE} />
            </linearGradient>
          </defs>
          <path ref={strandARef} fill="none" stroke="url(#helix-grad-a)" strokeWidth="1.5" strokeOpacity="0.55" />
          <path ref={strandBRef} fill="none" stroke="url(#helix-grad-b)" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* Scrim: keeps every headline/body/button block at strong, consistent
          contrast against the morphing background behind it. */}
      <div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />
    </>
  );
}
