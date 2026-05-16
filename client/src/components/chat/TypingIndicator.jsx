/**
 * TypingIndicator — Premium animated "AI is thinking" indicator.
 */

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25 }}
      style={{
        display: "flex", gap: 12, marginBottom: 20,
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #059669, #14b8a6)",
        boxShadow: "0 0 14px var(--primary-glow)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 2,
      }}>
        <Zap size={13} color="white" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", paddingLeft: 4 }}>
          GitQA AI
        </span>

        {/* Thinking bubble */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "12px 16px",
          borderRadius: "4px 18px 18px 18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xs)",
        }}>
          {/* Animated dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="typing-dot"
                style={{
                  width: 7, height: 7,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary-light), var(--violet))",
                  display: "block",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 2 }}>
            Thinking…
          </span>
        </div>
      </div>
    </motion.div>
  );
}
