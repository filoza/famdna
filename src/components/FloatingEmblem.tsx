"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export default function FloatingEmblem() {
  const [zapping, setZapping] = useState(false);

  function handleClick() {
    setZapping(true);
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => setZapping(false), 450);
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 h-[70px] w-[70px]">
      <AnimatePresence>
        {zapping && (
          <motion.span
            initial={{ opacity: 0.9, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-orange to-cyan"
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleClick}
        aria-label="Back to top"
        className="animate-emblem-dance glow-cyan relative block h-full w-full rounded-full"
      >
        <Image
          src="/dna-emblem.png"
          alt="D.N.A. emblem"
          width={140}
          height={140}
          priority
          className="h-full w-full rounded-full object-cover"
        />
      </button>
    </div>
  );
}
