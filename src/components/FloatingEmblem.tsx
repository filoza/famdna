"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const PHONE_DISPLAY = "555-0142";
const PHONE_HREF = "tel:5550142";
const EMAIL = "hello@famdna.com";

export default function FloatingEmblem() {
  const [open, setOpen] = useState(false);
  const [zapping, setZapping] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleClick() {
    setZapping(true);
    setOpen((v) => !v);
    window.setTimeout(() => setZapping(false), 450);
  }

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="fixed right-6 bottom-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="absolute right-0 bottom-[calc(100%+16px)] w-60 overflow-hidden rounded-2xl border border-border bg-background-alt shadow-xl"
          >
            <a
              href={PHONE_HREF}
              className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-background"
            >
              <span className="font-display text-sm font-semibold text-orange-soft">Call</span>
              <span className="text-sm text-foreground">{PHONE_DISPLAY}</span>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background"
            >
              <span className="font-display text-sm font-semibold text-cyan-soft">Email</span>
              <span className="text-sm text-foreground">{EMAIL}</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-[70px] w-[70px]">
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
          aria-label="Contact us"
          aria-expanded={open}
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
    </div>
  );
}
