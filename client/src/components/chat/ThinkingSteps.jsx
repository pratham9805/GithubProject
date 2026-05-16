/**
 * ThinkingSteps — ChatGPT-style "thinking" indicator.
 *
 * Shows a live pipeline with three steps:
 *   1. Searching repository (hybrid retrieval)
 *   2. Ranking & filtering chunks
 *   3. Generating answer
 *
 * phase: 'retrieving' | 'reranking' | 'generating' | null
 */

import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, Sparkles, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    id: "retrieving",
    icon: Search,
    label: "Searching repository",
    sublabel: "Hybrid vector + keyword retrieval",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
    bg: "rgba(245,158,11,0.07)",
    glow: "rgba(245,158,11,0.2)",
  },
  {
    id: "reranking",
    icon: Zap,
    label: "Ranking chunks",
    sublabel: "AI reranker selecting best context",
    color: "#14b8a6",
    border: "rgba(20,184,166,0.3)",
    bg: "rgba(20,184,166,0.07)",
    glow: "rgba(20,184,166,0.2)",
  },
  {
    id: "generating",
    icon: Sparkles,
    label: "Generating answer",
    sublabel: "Streaming response from GPT",
    color: "#10b981",
    border: "rgba(16,185,129,0.3)",
    bg: "rgba(16,185,129,0.07)",
    glow: "rgba(16,185,129,0.2)",
  },
];

const PHASE_ORDER = ["retrieving", "reranking", "generating"];

export default function ThinkingSteps({ phase }) {
  if (!phase) return null;

  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <motion.div
      key="thinking-steps"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 20,
        alignItems: "flex-start",
      }}
    >
      {/* AI Avatar */}
      <div style={{
        width: 32, height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #059669, #14b8a6)",
        boxShadow: "0 0 14px rgba(16,185,129,0.4)",
        marginTop: 2,
      }}>
        <Sparkles size={13} color="white" />
      </div>

      {/* Steps card */}
      <div style={{
        flex: 1, maxWidth: 420,
        padding: "14px 16px",
        borderRadius: "4px 18px 18px 18px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 12,
        }}>
          <ThinkingDots />
          <span style={{
            fontSize: 11.5, fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            GitQA is thinking
          </span>
        </div>

        {/* Step list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STEPS.map((step, idx) => {
            const isDone    = idx < currentIdx;
            const isActive  = idx === currentIdx;
            const isPending = idx > currentIdx;

            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={false}
                animate={{ opacity: isPending ? 0.35 : 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: isActive ? step.bg : "transparent",
                  border: `1px solid ${isActive ? step.border : "transparent"}`,
                  boxShadow: isActive ? `0 0 16px ${step.glow}` : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive
                    ? step.bg
                    : isDone
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? step.border : isDone ? "rgba(16,185,129,0.25)" : "var(--border)"}`,
                }}>
                  {isDone
                    ? <CheckCircle2 size={13} color="#10b981" />
                    : <Icon size={13} color={isActive ? step.color : "var(--text-muted)"} />
                  }
                </div>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    color: isActive ? "white" : isDone ? "var(--text-secondary)" : "var(--text-muted)",
                    lineHeight: 1.3,
                  }}>
                    {step.label}
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontSize: 11, color: step.color,
                        marginTop: 2, fontWeight: 500,
                      }}
                    >
                      {step.sublabel}
                    </motion.div>
                  )}
                </div>

                {/* Active spinner / done check */}
                {isActive && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: `2px solid ${step.color}`,
                      borderTopColor: "transparent",
                      flexShrink: 0,
                    }}
                  />
                )}
                {isDone && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <CheckCircle2 size={14} color="#10b981" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Animated thinking dots ── */
function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
          style={{
            width: 5, height: 5,
            borderRadius: "50%",
            background: "var(--primary-light)",
          }}
        />
      ))}
    </div>
  );
}
