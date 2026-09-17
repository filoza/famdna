"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";

const BRAND_ORANGE = "#ff9d2e";
const BRAND_CYAN = "#2fe6d1";
const PARTICLE_COUNT = 28;

function wavyCirclePath(radius: number, waves: number, amplitude: number, phase: number) {
  const points = 64;
  const c = 80; // center, matches the 0 0 160 160 viewBox
  let d = "";
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + amplitude * Math.sin(waves * angle + phase);
    const x = c + r * Math.cos(angle);
    const y = c + r * Math.sin(angle);
    d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  }
  return d + " Z";
}

export default function IntroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dockGroupRef = useRef<HTMLDivElement>(null);
  const waveGroupRef = useRef<SVGSVGElement>(null);
  const wavePathRef = useRef<SVGPathElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const particlesWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // The wave path's `d` is set here (client-only, post-mount) rather than
    // computed inline in JSX, so the server-rendered markup never has to
    // match a computed floating-point string against the client's.
    wavePathRef.current?.setAttribute("d", wavyCirclePath(60, 8, 4, 0));

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Skip straight to the Stage 4 end state: no intro overlay, just the
      // static navbar logo (already rendered by Navbar) sitting in place.
      gsap.set(sectionRef.current, { display: "none" });
      return;
    }

    gsap.registerPlugin(ScrollTrigger, Flip);

    const ctx = gsap.context(() => {
      const group = dockGroupRef.current;
      const video = videoRef.current;
      const particles = particlesWrapRef.current
        ? Array.from(particlesWrapRef.current.children)
        : [];
      if (!group || !video) return;

      let videoStarted = false;

      // Continuous wave undulation on the ring's outline — runs forever,
      // independent of and in addition to the rotate/scale below.
      const waveTween = gsap.to(wavePathRef.current, {
        attr: { d: wavyCirclePath(60, 8, 10, Math.PI) },
        duration: 1.3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Flip-powered dock: capture the group's current (centered) state,
      // jump it — invisibly, Flip immediately compensates — to sit exactly
      // over the navbar logo, then let Flip.from() animate that transition.
      // Built once, added into the scrubbed master timeline like any tween.
      const navLogo = document.getElementById("nav-logo");
      let dockTween: gsap.core.Timeline | null = null;
      if (navLogo) {
        const flipState = Flip.getState(group);
        const navRect = navLogo.getBoundingClientRect();
        gsap.set(group, {
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
          end: "+=180%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Stage 1 — swirl: wave ring + orb spin/scale up together.
      tl.to(waveGroupRef.current, { opacity: 1, rotate: 900, scale: 5.5, duration: 0.4 }, 0)
        .to(orbRef.current, { scale: 6 }, 0)
        .to([waveGroupRef.current, orbRef.current], { opacity: 0, duration: 0.12 }, 0.5)

        // Stage 2 — landing: the burst video fills the whole screen, with
        // sparkle-dust particles scattering across the full viewport while
        // the backdrop is still fully opaque behind them.
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
        .fromTo(video, { opacity: 0, scale: 0.25 }, { opacity: 1, scale: 1, duration: 0.22 }, 0.48)
        .fromTo(
          particles,
          { opacity: 0, scale: 0, x: 0, y: 0 },
          {
            opacity: 1,
            scale: 1,
            x: () => gsap.utils.random(-window.innerWidth * 0.46, window.innerWidth * 0.46),
            y: () => gsap.utils.random(-window.innerHeight * 0.46, window.innerHeight * 0.46),
            duration: 0.24,
            stagger: 0.003,
            ease: "power2.out",
          },
          0.5
        )
        .to(particles, { opacity: 0, duration: 0.12 }, 0.68)

        // Stage 3 — dock: video fades, the small orb reappears and travels
        // into the exact navbar logo slot, then crossfades into it.
        .to(video, { opacity: 0, duration: 0.1 }, 0.72)
        .set(orbRef.current, { opacity: 1, scale: 1 }, 0.74);

      if (dockTween) tl.add(dockTween, 0.75);

      tl.to(orbRef.current, { opacity: 0, duration: 0.08 }, 0.95)
        .to(backdropRef.current, { opacity: 0, duration: 0.1 }, 0.9);

      return () => {
        waveTween.kill();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const particles = Array.from({ length: PARTICLE_COUNT });

  return (
    <div ref={sectionRef} className="pointer-events-none relative z-[200] h-screen w-full">
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
        <svg
          ref={waveGroupRef}
          viewBox="0 0 160 160"
          className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: 0 }}
        >
          <defs>
            <linearGradient id="intro-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={BRAND_ORANGE} />
              <stop offset="100%" stopColor={BRAND_CYAN} />
            </linearGradient>
          </defs>
          <path
            ref={wavePathRef}
            fill="none"
            stroke="url(#intro-ring-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
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
