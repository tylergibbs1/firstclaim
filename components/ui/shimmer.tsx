"use client";

import { memo, type ElementType, type ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";

interface ShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

export const Shimmer = memo(function Shimmer({
  children,
  as: Component = "p",
  className = "",
  duration = 2,
  spread = 2,
}: ShimmerProps) {
  const MotionComponent = motion.create(
    Component as keyof HTMLElementTagNameMap
  );

  const spreadCalc = children.length * spread;

  return (
    <MotionComponent
      className={`inline-block bg-[length:250%_100%] bg-clip-text text-transparent ${className}`}
      initial={{ backgroundPosition: "200% center" }}
      animate={{ backgroundPosition: "-200% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={{
        backgroundImage: `linear-gradient(
          90deg,
          var(--color-muted-foreground) 0%,
          var(--color-muted-foreground) ${40 - spreadCalc}%,
          var(--color-foreground) 50%,
          var(--color-muted-foreground) ${60 + spreadCalc}%,
          var(--color-muted-foreground) 100%
        )`,
      }}
    >
      {children}
    </MotionComponent>
  );
});
