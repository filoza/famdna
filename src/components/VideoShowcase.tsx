"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";
import RevealGroup from "./RevealGroup";

export default function VideoShowcase() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="watch" className="relative bg-background-alt py-28">
      <RevealGroup className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <p className="font-serif text-xl text-orange-soft">see it in motion</p>
          <h2 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            See what all the <span className="text-gradient-shimmer">buzz</span> is about
          </h2>
        </Reveal>

        <Reveal className="mt-12">
          <div className="bg-noise glow-cyan relative aspect-video overflow-hidden rounded-3xl border border-border bg-black">
            <div className="bg-grid absolute inset-0 opacity-40" />
            <AnimatePresence>
              {!playing && (
                <motion.button
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setPlaying(true)}
                  aria-label="Play video"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                >
                  <motion.span
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange to-cyan shadow-[0_0_60px_rgba(47,158,143,0.35)]"
                  >
                    <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-background">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </motion.span>
                  <span className="font-serif text-lg text-muted">Play Video</span>
                </motion.button>
              )}
            </AnimatePresence>

            {playing && (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                Video player goes here
              </div>
            )}
          </div>
        </Reveal>
      </RevealGroup>
    </section>
  );
}
