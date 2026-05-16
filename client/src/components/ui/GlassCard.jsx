/**
 * GlassCard — Glassmorphism container card.
 * Used throughout the app for panels, info cards, and sections.
 */

import { motion } from "framer-motion";

export default function GlassCard({
  children,
  className = "",
  hover = false,
  onClick,
  padding = "p-5",
  animate = true,
}) {
  const base = `
    glass rounded-2xl ${padding}
    ${hover ? "cursor-pointer hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.06)] transition-all duration-200" : ""}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={hover ? { y: -2 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} onClick={onClick}>
      {children}
    </div>
  );
}
