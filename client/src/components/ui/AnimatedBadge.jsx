/**
 * AnimatedBadge — Small status/label badge with optional color and pulse.
 */

import { motion } from "framer-motion";

const colorMap = {
  green:  { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#10b981" },
  red:    { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#ef4444" },
  blue:   { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  text: "#818cf8" },
  yellow: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#f59e0b" },
  cyan:   { bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.3)",   text: "#06b6d4" },
  violet: { bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.3)",  text: "#8b5cf6" },
  gray:   { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", text: "#94a3b8" },
};

export default function AnimatedBadge({
  children,
  color = "blue",
  pulse = false,
  icon: Icon,
  className = "",
}) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        rounded-full text-xs font-medium border
        ${className}
      `}
      style={{ background: c.bg, borderColor: c.border, color: c.text }}
    >
      {pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: c.text }}
        />
      )}
      {Icon && <Icon size={11} />}
      {children}
    </motion.span>
  );
}
