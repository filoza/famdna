"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import Reveal from "./Reveal";
import RevealGroup from "./RevealGroup";
import Counter from "./Counter";

const METRICS = [
  { value: 500, suffix: "+", label: "Kids reached" },
  { value: 40, suffix: "+", label: "Live events" },
  { value: 12, suffix: "", label: "STEAM modules" },
  { value: 98, suffix: "%", label: "Would recommend" },
];

export default function Impact() {
  const rowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rowRef, { once: true, amount: 0.2 });

  return (
    <section id="impact" className="relative py-28">
      <RevealGroup className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="font-serif text-xl text-orange-soft">our impact</p>
          <h2 className="font-display mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Numbers that move
          </h2>
        </Reveal>

        <div ref={rowRef} className="mt-16 flex flex-col sm:flex-row sm:flex-wrap">
          {METRICS.map((metric, i) => (
            <Reveal
              key={metric.label}
              className={`w-full border-t border-border py-6 first:border-t-0 sm:w-1/4 sm:border-t-0 sm:py-0 sm:pl-8 ${
                i > 0 ? "sm:border-l" : ""
              }`}
            >
              <Counter value={metric.value} suffix={metric.suffix} start={inView} />
              <p className="font-serif mt-2 text-lg text-muted">{metric.label}</p>
            </Reveal>
          ))}
        </div>
      </RevealGroup>
    </section>
  );
}
