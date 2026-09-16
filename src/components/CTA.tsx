"use client";

import Reveal from "./Reveal";
import RevealGroup from "./RevealGroup";
import Magnetic from "./Magnetic";
import SweepButton from "./SweepButton";

export default function CTA() {
  return (
    <section id="contact" className="bg-noise relative overflow-hidden bg-background py-28">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange/15 to-cyan/15 blur-[100px]" />

      <RevealGroup className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Ready to join the <span className="text-gradient-shimmer">adventure</span>?
          </h2>
          <p className="font-serif mt-5 text-xl text-muted">
            Bring D.N.A. to your school, camp or community event and watch curiosity
            turn into motion.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Magnetic>
              <SweepButton href="mailto:hello@famdna.com" accent="cyan">
                Get in Touch
              </SweepButton>
            </Magnetic>
            <Magnetic>
              <SweepButton href="#programs" accent="orange">
                View Packages
              </SweepButton>
            </Magnetic>
          </div>
        </Reveal>
      </RevealGroup>
    </section>
  );
}
