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
export default function IntroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Skip straight to the Stage 4 end state: logo already docked, no
      // intro overlay, particle system starts directly in its Part 2 state.
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

      // Stages 0-2 (column seed → growth → landing) are entirely driven by
      // ParticleField reading introState.progress — this placeholder tween
      // just occupies that portion of the scrubbed timeline.
      tl.to({}, { duration: 0.72 });

      // Stage 3 — dock: the WebGL column fades out in the same window the
      // orb Flips into the navbar, so they read as one continuous handoff.
      if (dockTween) tl.add(dockTween, 0.75);
      tl.to(introState, { dockFade: 0, duration: 0.22, ease: "power2.in" }, 0.75);
      tl.to(orb, { opacity: 0, duration: 0.1 }, 0.95);
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
