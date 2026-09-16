"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const wordVariants: Variants = {
  hidden: { y: "100%" },
  show: { y: "0%", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

type RevealWordProps = {
  children: ReactNode;
  className?: string;
};

export default function RevealWord({ children, className }: RevealWordProps) {
  return (
    <span className="inline-block overflow-hidden align-bottom leading-[1.25]">
      <motion.span className={`inline-block ${className ?? ""}`} variants={wordVariants}>
        {children}
      </motion.span>
    </span>
  );
}
