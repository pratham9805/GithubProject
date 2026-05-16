/**
 * MessageBubble — Renders a single chat message.
 * - User: right-aligned pill with gradient background
 * - AI: left-aligned clean card with markdown + streaming cursor
 */

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { User, Zap, FileCode2, Copy, Check } from "lucide-react";
import { useState } from "react";
import CodeBlock from "./CodeBlock";

export default function MessageBubble({ message }) {
  const { role, content, sources, timestamp, isStreaming, isError } = message;
  const isUser = role === "user";
  const time = timestamp ? format(new Date(timestamp), "HH:mm") : "";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 20,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser
          ? "rgba(255,255,255,0.06)"
          : "linear-gradient(135deg, #059669 0%, #14b8a6 100%)",
        border: isUser
          ? "1px solid var(--border)"
          : "none",
        boxShadow: isUser ? "none" : "0 0 14px var(--primary-glow)",
        marginTop: 2,
      }}>
        {isUser
          ? <User size={13} color="var(--text-secondary)" />
          : <Zap size={13} color="white" />
        }
      </div>

      {/* Bubble + meta */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        maxWidth: "78%",
        gap: 6,
      }}>
        {/* Label */}
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
          color: "var(--text-muted)",
          paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0,
        }}>
          {isUser ? "You" : "GitQA AI"}
        </span>

        {/* Message content */}
        <div
          style={{
            padding: isUser ? "10px 16px" : "14px 16px",
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            background: isUser
              ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
              : isError
                ? "rgba(239,68,68,0.07)"
                : "rgba(255,255,255,0.04)",
            border: isUser
              ? "none"
              : isError
                ? "1px solid rgba(239,68,68,0.2)"
                : "1px solid var(--border)",
            boxShadow: isUser
              ? "0 4px 20px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "var(--shadow-xs)",
            position: "relative",
          }}
        >
          {isUser ? (
            <p style={{
              fontSize: 14, lineHeight: 1.65,
              color: "white", fontWeight: 400,
            }}>
              {content}
            </p>
          ) : (
          <div
            className={`prose${isStreaming ? " streaming-cursor" : ""}`}
            style={{ position: "relative" }}
          >
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children).replace(/\n$/, "");
                    if (!inline && match) {
                      return <CodeBlock code={code} language={match[1]} />;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  a({ href, children }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          
          )}

          {/* Copy button for AI messages */}
          {!isUser && content && (
            <button
              onClick={handleCopy}
              title="Copy response"
              style={{
                position: "absolute",
                top: 8, right: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 26, height: 26,
                borderRadius: 7,
                background: "transparent",
                border: "none", cursor: "pointer",
                color: "var(--text-muted)",
                opacity: 0,
                transition: "var(--transition)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = "0";
                e.currentTarget.style.background = "transparent";
              }}
              className="copy-btn"
            >
              {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
            </button>
          )}
        </div>

        {/* Sources */}
        {!isUser && sources && sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 4 }}
          >
              <span style={{ fontSize: 10.5, color: "var(--text-muted)", alignSelf: "center" }}>Sources:</span>
            {sources.map((src) => (
              <span
                key={src}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: "var(--radius-full)",
                  fontSize: 10.5, fontWeight: 600,
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.22)",
                  color: "var(--primary-light)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <FileCode2 size={9} />
                {src}
              </span>
            ))}
          </motion.div>
        )}

        {/* Timestamp */}
        {time && (
          <span style={{
            fontSize: 10, color: "var(--text-muted)",
            paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0,
          }}>
            {time}
          </span>
        )}
      </div>
    </motion.div>
  );
}
