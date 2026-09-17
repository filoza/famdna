"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { introState } from "@/lib/introState";

const BRAND_ORANGE = "#ff9d2e";
const BRAND_CYAN = "#2fe6d1";

// This component owns only the DOM "seed point" and the GSAP ScrollTrigger
// that paces the intro — the particle column/burst itself is rendered by
// ParticleField (WebGL), driven by the shared introState this writes to.
//
// Timeline positions below are literal 0–1 fractions of the pin's own
// scroll range, matching spec 1:1: Stage 1 growth 0–40%, Stage 2 landing
// hold 40–60%, Stage 3 dock 60–90%, Stage 4 tail 90–100%.
export default function IntroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Skip straight to the Stage 4 end state: logo already docked, no
      // intro overlay. ParticleField treats reduced-motion the same as a
      // low-end device (plain fallback background, no WebGL at all), so
      // introState's values here don't matter beyond staying consistent.
      introState.progress = 1;
      introState.dockFade = 0;
      introState.done = true;
      gsap.set(sectionRef.current, { display: "none" });
      return;
    }

    gsap.registerPlugin(ScrollTrigger, Flip);

    const ctx = gsap.context(() => {
      const orb = orbRef.current;
      if (!orb) return;

      // Flip-powered dock: capture the orb's current (centered) state, jump
      // it — invisibly, Flip immediately compensates — to sit exactly over
      // the navbar logo, then let Flip.from() animate that transition.
      const navLogo = document.getElementById("nav-logo");
      let dockTween: gsap.core.Timeline | null = null;
      if (navLogo) {
        const flipState = Flip.getState(orb);
        const navRect = navLogo.getBoundingClientRect();
        gsap.set(orb, {
          position: "fixed",
          top: navRect.top,
          left: navRect.left,
          width: navRect.width,
          height: navRect.height,
          xPercent: 0,
          yPercent: 0,
        });
        dockTween = Flip.from(flipState, {
          duration: 0.22,
          ease: "power2.inOut",
          absolute: true,
          scale: true,
        });
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onRefresh: (self) => {
            introState.endScrollY = self.end;
          },
          onUpdate: (self) => {
            introState.progress = self.progress;
          },
          onLeave: () => {
            introState.done = true;
          },
          onEnterBack: () => {
            introState.done = false;
          },
        },
      });

      // Stages 1-2 (0-60%): growth + landing hold, entirely driven by
      // ParticleField reading introState.progress — this placeholder just
      // occupies that portion of the scrubbed timeline.
      tl.to({}, { duration: 0.6 });

      // Stage 3 (60-90%) — dock: the WebGL grid collapses back to the seed
      // point FIRST (fast, finishes well before the Flip starts), so only
      // the small orb is left to visibly travel — one coherent object
      // shrinking then moving, not two things happening at once.
      tl.to(introState, { dockFade: 0, duration: 0.15, ease: "power2.in" }, 0.6);
      if (dockTween) tl.add(dockTween, 0.72);
      tl.to(orb, { opacity: 0, duration: 0.08 }, 0.86);

      // Pad to exactly 100% so the stage percentages above map 1:1 to the
      // scrollTrigger's own progress.
      tl.to({}, { duration: 0.001 }, 1.0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="pointer-events-none relative z-[200] h-screen w-full">
      <div
        ref={orbRef}
        className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, #fff 0%, ${BRAND_ORANGE} 45%, ${BRAND_CYAN} 100%)`,
          boxShadow: "0 0 16px 2px rgba(47,230,209,0.35)",
        }}
      />
    </div>
  );
}
