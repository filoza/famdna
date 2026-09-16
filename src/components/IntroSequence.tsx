"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const BASE_SIZE = 160; // px — matches h-40/w-40 on the dock group, unscaled
const BRAND_ORANGE = "#ff9d2e";
const BRAND_CYAN = "#2fe6d1";
const PARTICLE_COUNT = 28;

export default function IntroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dockGroupRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const particlesWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    // Lock scroll for the intro's own fixed duration — regardless of how
    // fast or slow the user scrolls, they get the full sequence before
    // scrolling is handed back.
    html.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const group = dockGroupRef.current;
      const video = videoRef.current;
      const particles = particlesWrapRef.current
        ? Array.from(particlesWrapRef.current.children)
        : [];
      if (!group || !video) return;

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

      video.currentTime = 0;
      video.play().catch(() => {});

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        onComplete: () => {
          html.style.overflow = prevOverflow;
        },
      });

      // Stage 1 — swirl: small centered orb + ring, spinning/scaling up.
      tl.to(ringRef.current, { opacity: 1, rotate: 900, scale: 5.5, duration: 0.9, ease: "power1.inOut" }, 0)
        .to(orbRef.current, { scale: 6, duration: 0.9, ease: "power1.inOut" }, 0)
        .to([ringRef.current, orbRef.current], { opacity: 0, duration: 0.25 }, 0.85)

        // Stage 2 — explode: the burst video fills the whole screen, with
        // sparkle-dust particles scattering out across the full viewport.
        .fromTo(
          video,
          { opacity: 0, scale: 0.25 },
          { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" },
          0.8
        )
        .fromTo(
          particles,
          { opacity: 0, scale: 0, x: 0, y: 0 },
          {
            opacity: 1,
            scale: 1,
            x: () => gsap.utils.random(-window.innerWidth * 0.46, window.innerWidth * 0.46),
            y: () => gsap.utils.random(-window.innerHeight * 0.46, window.innerHeight * 0.46),
            duration: 0.9,
            stagger: 0.012,
            ease: "power2.out",
          },
          0.85
        )
        .to(particles, { opacity: 0, duration: 0.5 }, 1.5)

        // Stage 3 — dock: video fades, the small orb reappears and travels
        // into the exact navbar logo slot, then crossfades into it.
        .to(video, { opacity: 0, duration: 0.4 }, 1.6)
        .set(orbRef.current, { opacity: 1, scale: 1 }, 1.7)
        .to(
          group,
          {
            x: () => getDockTarget().dx,
            y: () => getDockTarget().dy,
            scale: () => getDockTarget().scale,
            duration: 0.5,
            ease: "power2.inOut",
          },
          1.75
        )
        .to(orbRef.current, { opacity: 0, duration: 0.2 }, 2.15)
        .to(backdropRef.current, { opacity: 0, duration: 0.3 }, 2.0);
    }, sectionRef);

    return () => {
      html.style.overflow = prevOverflow;
      ctx.revert();
    };
  }, []);

  const particles = Array.from({ length: PARTICLE_COUNT });

  return (
    <div ref={sectionRef} className="pointer-events-none fixed inset-0 z-[200]">
      <div ref={backdropRef} className="absolute inset-0" style={{ background: "#060608" }} />

      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        poster="/dna-hero-poster.jpg"
        src="/dna-hero.mp4"
        className="absolute inset-0 h-full w-full object-cover opacity-0"
      />

      <div ref={particlesWrapRef} className="absolute top-1/2 left-1/2">
        {particles.map((_, i) => (
          <span
            key={i}
            className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full opacity-0"
            style={{
              background: i % 2 === 0 ? BRAND_ORANGE : BRAND_CYAN,
              boxShadow: `0 0 6px 1px ${i % 2 === 0 ? BRAND_ORANGE : BRAND_CYAN}`,
            }}
          />
        ))}
      </div>

      <div
        ref={dockGroupRef}
        className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          ref={ringRef}
          className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${BRAND_ORANGE}, ${BRAND_CYAN}, ${BRAND_ORANGE})`,
            WebkitMaskImage:
              "radial-gradient(closest-side, transparent 78%, black 80%, black 100%)",
            maskImage:
              "radial-gradient(closest-side, transparent 78%, black 80%, black 100%)",
            opacity: 0,
          }}
        />
        <div
          ref={orbRef}
          className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, #fff 0%, ${BRAND_ORANGE} 45%, ${BRAND_CYAN} 100%)`,
            boxShadow: "0 0 16px 2px rgba(47,230,209,0.35)",
          }}
        />
      </div>
    </div>
  );
}
