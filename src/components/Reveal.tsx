"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const itemVariants: Variants = {
  hidden: { y: 36 },
  show: { y: 0, transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] } },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
};

export default function Reveal({ children, className }: RevealProps) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div variants={itemVariants}>{children}</motion.div>
    </div>
  );
}
