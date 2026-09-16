"use client";

import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import RevealWord from "./RevealWord";
import Magnetic from "./Magnetic";
import SweepButton from "./SweepButton";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};

const headline: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "0.5 start"] });
  const blobOrangeY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const blobCyanY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="bg-noise relative flex min-h-screen items-center overflow-hidden bg-background pt-24"
    >
      <div className="bg-grid absolute inset-0" />
      <motion.div
        style={{ y: blobOrangeY }}
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange/20 blur-[120px]"
      />
      <motion.div
        style={{ y: blobCyanY }}
        className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-cyan/20 blur-[120px]"
      />

      <motion.div style={{ opacity: fade }} className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="flex flex-col items-start"
        >
          <motion.p variants={fadeUp} className="font-serif mb-6 text-xl text-cyan-soft">
            the new youth online science game show
          </motion.p>

          <motion.h1
            variants={headline}
            className="font-display max-w-4xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl md:text-7xl"
          >
            <RevealWord>Where</RevealWord> <RevealWord className="text-gradient-shimmer">Curiosity</RevealWord>
            <br />
            <RevealWord>Meets</RevealWord> <RevealWord className="text-gradient-shimmer">Motion</RevealWord>
            <RevealWord>.</RevealWord>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg text-muted">
            D.N.A. is a STEAM-based educational brand that merges technology,
            physical activity and creative learning — through our mobile app,
            live events and interactive workshops, families build teamwork,
            problem-solving and critical thinking skills.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
            <Magnetic>
              <SweepButton href="#programs" accent="orange">
                Explore Programs
              </SweepButton>
            </Magnetic>
            <Magnetic>
              <SweepButton href="#watch" accent="cyan">
                Watch the Trailer
              </SweepButton>
            </Magnetic>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-20 flex w-full flex-wrap gap-x-10 gap-y-6 border-t border-border pt-8"
          >
            {[
              ["500+", "Kids Engaged"],
              ["40+", "Live Events"],
              ["12", "STEAM Modules"],
              ["3", "City Partnerships"],
            ].map(([stat, label], i) => (
              <div key={label} className={i > 0 ? "border-l border-border pl-10" : ""}>
                <p className="font-display text-3xl font-semibold text-foreground">{stat}</p>
                <p className="font-serif mt-1 text-base text-muted">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
