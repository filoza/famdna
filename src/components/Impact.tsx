"use client";

import Reveal from "./Reveal";
import Counter from "./Counter";

const METRICS = [
  { value: 500, suffix: "+", label: "Kids reached" },
  { value: 40, suffix: "+", label: "Live events" },
  { value: 12, suffix: "", label: "STEAM modules" },
  { value: 98, suffix: "%", label: "Would recommend" },
];

export default function Impact() {
  return (
    <section id="impact" className="relative bg-background py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-widest text-cyan-soft uppercase">
            Our impact
          </p>
          <h2 className="font-display mt-4 text-center text-4xl font-semibold sm:text-5xl">
            Numbers that <span className="text-gradient">move</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {METRICS.map((metric, i) => (
            <Reveal key={metric.label} delay={i * 0.1} className="text-center">
              <Counter value={metric.value} suffix={metric.suffix} />
              <p className="mt-2 text-sm text-muted uppercase tracking-wide">{metric.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
