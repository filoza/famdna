"use client";

import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Magnetic from "./Magnetic";
import SweepButton from "./SweepButton";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "0.5 start"] });
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useLayoutEffect(() => {
    if (!headlineRef.current) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const ctx = gsap.context(() => {
      // Word-level (not char-level) splitting: splitting the gradient words
      // into individual characters breaks their background-clip:text
      // gradient (each char becomes its own box, fragmenting the gradient).
      // Word-level keeps each gradient word's text run intact.
      const split = SplitText.create(headlineRef.current, {
        type: "words",
        wordsClass: "inline-block will-change-transform",
      });

      // The gradient class has to live on the SAME element SplitText gives
      // the word's text to — applying it to an outer wrapper instead left
      // the actual text in a plain child div with no background to clip to.
      split.words.forEach((word) => {
        if (word.textContent === "Curiosity" || word.textContent === "Motion.") {
          word.classList.add("text-gradient-shimmer");
        }
      });

      gsap.set(split.words, { opacity: 0, y: 20 });
      gsap.to(split.words, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headlineRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={ref} className="relative flex min-h-screen items-center pt-24">
      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="flex flex-col items-start"
        >
          <motion.p variants={fadeUp} className="font-serif mb-6 text-xl text-cyan-soft">
            the new youth online science game show
          </motion.p>

          <h1
            ref={headlineRef}
            className="font-display max-w-4xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl md:text-7xl"
          >
            Where Curiosity
            <br />
            Meets Motion.
          </h1>

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
