"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { introState } from "@/lib/introState";

const STATS_LEFT = [
  { value: "500+", label: "Kids Engaged" },
  { value: "40+", label: "Live Events" },
];
const STATS_RIGHT = [
  { value: "12", label: "STEAM Modules" },
  { value: "3", label: "City Partnerships" },
];

// This component owns only the floating stat cards and the GSAP
// ScrollTrigger that paces the pinned intro — the particle system itself
// (swirl -> orb -> liquid -> wordmark -> helix -> vortex) is rendered by
// ParticleField (WebGL), driven entirely by the shared introState this
// writes to. There is no DOM "seed orb" and no navbar dock in this
// version — the intro ends with the vortex persisting into Part 2.
//
// Timeline positions are literal 0–1 fractions of the pin's own scroll
// range, matching spec: 0–15% converge to orb, 15–30% liquid/chromatic
// aberration, 30–45% wordmark reveal, 45–60% reform into helix, 60–75%
// helix -> vortex, 75–100% vortex holds through unpin.
//
// Triggers exactly once: onLeave latches introState.done permanently —
// there is no onEnterBack handler to re-arm it, so scrolling back up
// never replays or re-triggers any part of the sequence.
export default function IntroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardLeftRef = useRef<HTMLDivElement>(null);
  const cardRightRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = false; // TEMP-TEST-BYPASS

    if (prefersReducedMotion) {
      // Skip straight to the Stage 7 end state: content visible, no
      // animated particles. ParticleField treats reduced-motion the same
      // as a low-end device (plain fallback background, no WebGL at all).
      introState.progress = 1;
      introState.done = true;
      gsap.set(sectionRef.current, { display: "none" });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          // Generous scroll distance — Stages 1-5 (converge, liquid,
          // wordmark, helix, vortex) must not blow past in one flick.
          end: "+=400%",
          pin: true,
          scrub: true,
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
        },
      });

      // Stat cards fade in as the double-helix resolves (Stage 4, ~55-60%)
      // and fade out as it transitions into the vortex (before ~65%).
      tl.fromTo(
        [cardLeftRef.current, cardRightRef.current],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.04, stagger: 0.02 },
        0.54
      );
      tl.to([cardLeftRef.current, cardRightRef.current], { opacity: 0, duration: 0.05 }, 0.64);

      // Placeholder spanning the whole pin — the actual particle
      // choreography is driven by ParticleField reading introState.progress
      // every frame, not by tweening any DOM/values here.
      tl.to({}, { duration: 1 }, 0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="pointer-events-none relative z-[200] h-screen w-full">
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
