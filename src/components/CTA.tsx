"use client";

import Reveal from "./Reveal";

export default function CTA() {
  return (
    <section id="contact" className="relative overflow-hidden bg-background py-28">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange/20 to-cyan/20 blur-[100px]" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">
            Ready to join the <span className="text-gradient">adventure</span>?
          </h2>
          <p className="mt-5 text-lg text-muted">
            Bring D.N.A. to your school, camp or community event and watch curiosity
            turn into motion.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:hello@famdna.com"
              className="glow-cyan rounded-full bg-cyan px-8 py-3 text-sm font-semibold text-background transition-transform hover:scale-105"
            >
              Get in Touch
            </a>
            <a
              href="#programs"
              className="rounded-full border border-border px-8 py-3 text-sm font-semibold text-foreground transition-colors hover:border-orange hover:text-orange-soft"
            >
              View Packages
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
