"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type BorderBeamProps = {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
};

export function BorderBeam({
  className,
  size = 80,
  duration = 8,
  colorFrom = "oklch(0.75 0 0)",
  colorTo = "transparent",
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      <motion.div
        className={cn("absolute top-0 h-px", className)}
        style={{
          width: size,
          background: `linear-gradient(90deg, ${colorTo}, ${colorFrom}, ${colorTo})`,
        }}
        animate={{ left: ["-20%", "120%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
