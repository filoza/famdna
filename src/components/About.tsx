"use client";

import Reveal from "./Reveal";

export default function About() {
  return (
    <section id="about" className="relative bg-background-alt py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-widest text-orange-soft uppercase">
            Our mission
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
            Learning that moves <span className="text-gradient">every family</span>
          </h2>
          <p className="mt-6 text-lg text-muted">
            D.N.A. is a STEAM-based educational brand that merges technology,
            physical activity and creative learning. Through our mobile app,
            live events and interactive workshops, both youth and adults engage
            in science-driven challenges that build teamwork, problem-solving
            and critical thinking skills.
          </p>
          <p className="mt-4 text-lg text-muted">
            Our mission is to make learning active, accessible and exciting for
            every family — using movement and media to spark imagination and
            community engagement.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border">
            <div className="bg-grid absolute inset-0 bg-background" />
            <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-orange/30 blur-[90px]" />
            <div className="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-cyan/30 blur-[90px]" />
            <div className="relative flex h-full items-center justify-center">
              <span className="font-display text-6xl font-semibold">
                <span className="text-orange">D.</span>
                <span className="text-cyan">N.A.</span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
