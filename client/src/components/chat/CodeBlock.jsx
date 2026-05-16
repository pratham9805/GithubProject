/**
 * CodeBlock — Premium syntax-highlighted code block with copy button.
 * Used inside MessageBubble for fenced code in AI responses.
 */

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code2 } from "lucide-react";

export default function CodeBlock({ code, language = "text" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const lineCount = code.split("\n").length;

  return (
    <div style={{
      position: "relative",
      margin: "12px 0",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(0,0,0,0.4)",
      boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        background: "rgba(0,0,0,0.3)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Traffic lights decoration */}
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{
                width: 9, height: 9, borderRadius: "50%",
                background: c, opacity: 0.8,
              }} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Code2 size={11} color="rgba(255,255,255,0.3)" />
            <span style={{
              fontSize: 10, fontWeight: 600,
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
            }}>
              {language}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
          <button
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "3px 8px",
              borderRadius: 5,
              background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "var(--success)" : "rgba(255,255,255,0.4)",
              fontSize: 10, fontWeight: 500,
              cursor: "pointer",
              transition: "var(--transition)",
            }}
            onMouseEnter={e => {
              if (!copied) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              }
            }}
            onMouseLeave={e => {
              if (!copied) {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }
            }}
          >
            {copied ? (
              <><Check size={11} /> Copied!</>
            ) : (
              <><Copy size={11} /> Copy</>
            )}
          </button>
        </div>
      </div>

      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "14px 16px",
          background: "rgba(0,0,0,0.3)",
          fontSize: "0.8rem",
          lineHeight: "1.65",
          fontFamily: "var(--font-mono)",
        }}
        showLineNumbers={lineCount > 4}
        lineNumberStyle={{
          color: "rgba(255,255,255,0.14)",
          fontSize: "0.7rem",
          minWidth: "2.5em",
          paddingRight: "1em",
          userSelect: "none",
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
