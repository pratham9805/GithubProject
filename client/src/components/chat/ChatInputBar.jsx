/**
 * ChatInputBar — Premium fixed bottom input bar.
 * Auto-growing textarea with animated send button.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Paperclip, Keyboard } from "lucide-react";

export default function ChatInputBar({ onSend, disabled = false, isStreaming = false }) {
  const [question, setQuestion] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || disabled || isStreaming) return;
    onSend(q);
    setQuestion("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    setQuestion(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const canSend = question.trim().length > 0 && !disabled && !isStreaming;

  return (
    <div style={{
      position: "sticky", bottom: 0,
      background: "linear-gradient(to top, var(--bg-base) 60%, transparent 100%)",
      padding: "12px 20px 20px",
      flexShrink: 0,
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Input container */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          background: focused
            ? "rgba(255,255,255,0.055)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${focused
            ? "rgba(16,185,129,0.45)"
            : "rgba(255,255,255,0.09)"}`,
          borderRadius: "var(--radius-xl)",
          padding: "10px 12px 10px 16px",
          boxShadow: focused
            ? "0 0 0 3px rgba(16,185,129,0.1), 0 4px 24px rgba(0,0,0,0.3)"
            : "0 2px 12px rgba(0,0,0,0.25)",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={question}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={
              disabled
                ? "Select a repository to start chatting..."
                : isStreaming
                  ? "AI is responding..."
                  : "Ask anything about the codebase..."
            }
            disabled={disabled || isStreaming}
            style={{
              flex: 1,
              background: "transparent",
              border: "none", outline: "none",
              resize: "none",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.65,
              fontFamily: "var(--font-sans)",
              minHeight: 24, maxHeight: 160,
              paddingRight: 4,
              opacity: (disabled || isStreaming) ? 0.55 : 1,
            }}
          />

          {/* Send / Stop button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!canSend && !isStreaming}
            whileHover={canSend ? { scale: 1.06 } : undefined}
            whileTap={canSend ? { scale: 0.94 } : undefined}
            animate={{
              background: canSend
                ? ["linear-gradient(135deg,#059669,#10b981)", "linear-gradient(135deg,#10b981,#14b8a6)"]
                : undefined,
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            style={{
              width: 36, height: 36,
              borderRadius: 12,
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: canSend ? "pointer" : "not-allowed",
              background: canSend
                ? "linear-gradient(135deg, #059669, #10b981)"
                : isStreaming
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(255,255,255,0.05)",
              boxShadow: canSend
                ? "0 0 16px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.15)"
                : "none",
              transition: "background 0.25s, box-shadow 0.25s",
              color: canSend ? "white" : isStreaming ? "var(--error)" : "var(--text-muted)",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isStreaming ? (
                <motion.div
                  key="stop"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  <Square size={13} fill="currentColor" />
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  <Send size={14} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Footer hint */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: 8,
        }}>
          <Keyboard size={10} color="var(--text-muted)" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
            <kbd style={{
              padding: "1px 5px",
              borderRadius: 4, fontSize: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}>Enter</kbd>
            {" "}to send · {" "}
            <kbd style={{
              padding: "1px 5px",
              borderRadius: 4, fontSize: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}>Shift+Enter</kbd>
            {" "}for new line
          </p>
        </div>
      </div>
    </div>
  );
}
