"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Tracks scroll progress through the tall wrapper while the hero itself
  // stays pinned (sticky) on screen — this is what drives the "reacts to
  // scroll" feel once the intro has played.
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end start"],
  });

  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const videoOpacity = useTransform(scrollYProgress, [0.55, 1], [1, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.4], [0, -40]);

  return (
    <div ref={wrapperRef} className="relative h-[220vh]">
      <section
        id="top"
        className="sticky top-0 flex h-screen items-center overflow-hidden bg-background pt-24"
      >
        <div className="bg-grid absolute inset-0 z-10" />

        {/* DNA hero video — autoplays the instant the page opens, then the
           scale/fade above ties it to scroll as the visitor scrolls past. */}
        <motion.video
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/dna-hero-poster.jpg"
          src="/dna-hero.mp4"
          style={
            prefersReducedMotion
              ? undefined
              : { scale: videoScale, opacity: videoOpacity }
          }
          className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-screen"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/20 to-background" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange/25 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-cyan/25 blur-[120px]" />

        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : { opacity: contentOpacity, y: contentY }
          }
          className="relative z-20 mx-auto flex max-w-6xl flex-col items-start px-6"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 rounded-full border border-border bg-background-alt px-4 py-1.5 text-xs font-semibold tracking-widest text-cyan-soft uppercase"
          >
            The New Youth Online Science Game Show
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display max-w-4xl text-5xl leading-[1.05] font-semibold sm:text-6xl md:text-7xl"
          >
            Where <span className="text-gradient">Curiosity</span>
            <br />
            Meets <span className="text-gradient">Motion</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-muted"
          >
            D.N.A. is a STEAM-based educational brand that merges technology,
            physical activity and creative learning — through our mobile app,
            live events and interactive workshops, families build teamwork,
            problem-solving and critical thinking skills.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#programs"
              className="glow-orange rounded-full bg-orange px-7 py-3 text-sm font-semibold text-background transition-transform hover:scale-105"
            >
              Explore Programs
            </a>
            <a
              href="#watch"
              className="rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:border-cyan hover:text-cyan-soft"
            >
              Watch the Trailer
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 grid w-full grid-cols-2 gap-8 border-t border-border pt-8 sm:grid-cols-4"
          >
            {[
              ["500+", "Kids Engaged"],
              ["40+", "Live Events"],
              ["12", "STEAM Modules"],
              ["3", "City Partnerships"],
            ].map(([stat, label]) => (
              <div key={label}>
                <p className="font-display text-3xl font-semibold text-foreground">{stat}</p>
                <p className="mt-1 text-xs text-muted uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
