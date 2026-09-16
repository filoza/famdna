"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const BASE_SIZE = 160; // px — matches h-40/w-40 on the dock group, unscaled

export default function IntroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dockGroupRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(sectionRef.current, { display: "none" });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const group = dockGroupRef.current;
      const video = videoRef.current;
      if (!group || !video) return;

      let videoStarted = false;

      // Uses the group's CURRENT rendered center (scale-invariant, since
      // transform-origin is center) but the CONSTANT unscaled base size —
      // reading the live (possibly already-scaled) rect for the scale ratio
      // would compound with whatever scale is already applied.
      const getDockTarget = () => {
        const navLogo = document.getElementById("nav-logo");
        if (!navLogo) return { dx: 0, dy: 0, scale: 0.2 };
        const groupRect = group.getBoundingClientRect();
        const navRect = navLogo.getBoundingClientRect();
        const centerX = groupRect.left + groupRect.width / 2;
        const centerY = groupRect.top + groupRect.height / 2;
        const dx = navRect.left + navRect.width / 2 - centerX;
        const dy = navRect.top + navRect.height / 2 - centerY;
        const scale = Math.max(navRect.height / BASE_SIZE, 0.05);
        return { dx, dy, scale };
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Stage 1 — swirl: continuous rotation + scale-up with a gradient trail
      // that fades in from nothing (Stage 0 shows only the bare orb).
      tl.to(ringRef.current, { opacity: 1, rotate: 900, scale: 5.5, duration: 0.4 }, 0)
        .to(orbRef.current, { scale: 6 }, 0)
        .to([ringRef.current, orbRef.current], { opacity: 0, duration: 0.12 }, 0.5)

        // Stage 2 — landing: the burst video snaps to full size.
        .call(
          () => {
            if (!videoStarted) {
              videoStarted = true;
              video.currentTime = 0;
              video.play().catch(() => {});
            }
          },
          [],
          0.48
        )
        .to(group, { scale: 3.4, duration: 0.24 }, 0.48)
        .fromTo(video, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.48)

        // Stage 3 — dock: travel + shrink into the navbar logo slot, then
        // crossfade into the real static logo sitting underneath.
        .to(
          group,
          {
            x: () => getDockTarget().dx,
            y: () => getDockTarget().dy,
            scale: () => getDockTarget().scale,
            duration: 0.28,
            ease: "power2.inOut",
          },
          0.72
        )
        .to(video, { opacity: 0, duration: 0.15 }, 0.85)
        .to(backdropRef.current, { opacity: 0, duration: 0.15 }, 0.82);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="pointer-events-none relative h-screen w-full">
      <div ref={backdropRef} className="absolute inset-0 z-[100] bg-background" />

      <div
        ref={dockGroupRef}
        className="absolute top-1/2 left-1/2 z-[101] h-40 w-40 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          ref={ringRef}
          className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, #e8703f, #2f9e8f, #e8703f)",
            WebkitMaskImage:
              "radial-gradient(closest-side, transparent 62%, black 64%, black 100%)",
            maskImage:
              "radial-gradient(closest-side, transparent 62%, black 64%, black 100%)",
            opacity: 0,
          }}
        />
        <div
          ref={orbRef}
          className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, #fff 0%, #e8703f 45%, #2f9e8f 100%)",
            boxShadow: "0 0 40px 10px rgba(47,158,143,0.45)",
          }}
        />
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster="/dna-hero-poster.jpg"
          src="/dna-hero.mp4"
          className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-0"
        />
      </div>
    </div>
  );
}
