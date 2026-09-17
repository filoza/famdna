"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { introState } from "@/lib/introState";

const BRAND_ORANGE = "#ff9d2e";
const BRAND_CYAN = "#2fe6d1";

const STATS_LEFT = [
  { value: "500+", label: "Kids Engaged" },
  { value: "40+", label: "Live Events" },
];
const STATS_RIGHT = [
  { value: "12", label: "STEAM Modules" },
  { value: "3", label: "City Partnerships" },
];

// This component owns the DOM "seed point", the floating stat cards, and
// the GSAP ScrollTrigger that paces the intro — the particle grid itself
// is rendered by ParticleField (WebGL), driven by the shared introState
// this writes to.
//
// Timeline positions below are literal 0–1 fractions of the pin's own
// scroll range: formation 0–55% (ParticleField reads introState.progress
// directly), landing hold 55–65%, dock 65–90%, tail 90–100%.
export default function IntroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const cardLeftRef = useRef<HTMLDivElement>(null);
  const cardRightRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Skip straight to the Stage 4 end state: logo already docked, no
      // intro overlay. ParticleField treats reduced-motion the same as a
      // low-end device (plain fallback background, no WebGL at all).
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
          duration: 0.2,
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
          end: "+=160%",
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

      // Stat cards fade in as the double-helix resolves (end of Stage 1C)
      // and through the Stage 2 landing hold, then fade out before dock.
      tl.fromTo(
        [cardLeftRef.current, cardRightRef.current],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.06, stagger: 0.02 },
        0.48
      );
      tl.to([cardLeftRef.current, cardRightRef.current], { opacity: 0, duration: 0.05 }, 0.63);

      // Stage 3 (65-90%) — dock: the WebGL grid collapses back to the seed
      // point FIRST (fast, finishes before the Flip starts), so only the
      // small orb is left to visibly travel — one coherent object
      // shrinking then moving, not two things happening at once.
      tl.to(introState, { dockFade: 0, duration: 0.13, ease: "power2.in" }, 0.65);
      if (dockTween) tl.add(dockTween, 0.76);
      tl.to(orb, { opacity: 0, duration: 0.06 }, 0.88);

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

      <div
        ref={cardLeftRef}
        className="absolute top-1/2 left-[8%] w-52 -translate-y-1/2 rounded-2xl border border-border bg-background-alt/60 p-5 opacity-0 backdrop-blur-md"
      >
        {STATS_LEFT.map((stat, i) => (
          <div key={stat.label} className={i > 0 ? "mt-3 border-t border-border pt-3" : ""}>
            <p className="font-display text-2xl font-semibold text-orange-soft">{stat.value}</p>
            <p className="font-serif text-sm text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div
        ref={cardRightRef}
        className="absolute top-1/2 right-[8%] w-52 -translate-y-1/2 rounded-2xl border border-border bg-background-alt/60 p-5 opacity-0 backdrop-blur-md"
      >
        {STATS_RIGHT.map((stat, i) => (
          <div key={stat.label} className={i > 0 ? "mt-3 border-t border-border pt-3" : ""}>
            <p className="font-display text-2xl font-semibold text-cyan-soft">{stat.value}</p>
            <p className="font-serif text-sm text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
