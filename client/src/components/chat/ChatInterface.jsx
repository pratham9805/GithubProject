/**
 * ChatInterface — Premium streaming chat UI with thinking steps.
 *
 * Pipeline:
 *   send → phase:'retrieving' → phase:'reranking' → first chunk → phase:'generating'
 *        → tokens stream in → done → phase:null
 *
 * The ThinkingSteps component renders the live pipeline indicator.
 * MessageBubble renders streamed content with a blinking cursor.
 */

import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, Sparkles, Database, FileCode2,
  MessageSquare, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import { askQuestion } from "../../lib/api";
import {
  addMessage, updateLastMessage,
  startStreaming, appendStreamChunk, stopStreaming, setThinkingPhase,
  selectConversation, selectIsStreaming, selectStreamingContent,
  selectThinkingPhase, selectChatSettings,
} from "../../store/chatSlice";
import { selectActiveRepo } from "../../store/repoSlice";
import MessageBubble from "./MessageBubble";
import ThinkingSteps from "./ThinkingSteps";
import ChatInputBar from "./ChatInputBar";

// ── Suggestion prompts ────────────────────────────────────────────────────────
const PROMPTS = [
  { icon: "🎯", text: "What is the main purpose of this project?" },
  { icon: "🛠️", text: "What technologies and frameworks are used?" },
  { icon: "🗂️", text: "How is the project structured?" },
  { icon: "📌", text: "What are the key entry point files?" },
];

// ── Timing for simulated retrieval phases ────────────────────────────────────
// Backend doesn't emit intermediate SSE events for retrieval/reranking,
// so we drive the UI phases with realistic timers.
const RERANK_DELAY_MS = 900;  // show "retrieving" for ~900ms
const GEN_DELAY_MS    = 1800; // show "reranking" for ~900ms more

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatInterface() {
  const dispatch      = useDispatch();
  const activeRepo    = useSelector(selectActiveRepo);
  const namespace     = activeRepo?.namespace;

  const messages       = useSelector(selectConversation(namespace || ""));
  const isStreaming    = useSelector(selectIsStreaming);
  const streamingContent = useSelector(selectStreamingContent);
  const thinkingPhase  = useSelector(selectThinkingPhase);
  const settings       = useSelector(selectChatSettings);

  const bottomRef  = useRef(null);
  const phaseTimer = useRef(null);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  // Cleanup timers on unmount
  useEffect(() => () => clearTimeout(phaseTimer.current), []);

  const handleSend = useCallback(async (question) => {
    if (!namespace) {
      toast.error("Please select a repository first");
      return;
    }

    // Add user message + empty AI placeholder
    dispatch(addMessage({ namespace, message: { role: "user", content: question } }));
    dispatch(addMessage({ namespace, message: { role: "assistant", content: "", isStreaming: true } }));
    dispatch(startStreaming()); // sets thinkingPhase → 'retrieving'

    // Drive thinking phases on a timer (retrieval → reranking)
    // Phase transitions to 'generating' automatically when first chunk arrives
    phaseTimer.current = setTimeout(() => {
      dispatch(setThinkingPhase("reranking"));
    }, RERANK_DELAY_MS);

    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    let fullAnswer = "";
    let firstChunk = true;

    try {
      await askQuestion(
        {
          question,
          namespace,
          repoName: activeRepo?.repoName || "",
          conversationHistory: history,
          settings,
        },
        {
          onChunk: ({ content }) => {
            // On first chunk: advance to 'generating' immediately
            if (firstChunk) {
              clearTimeout(phaseTimer.current);
              firstChunk = false;
              dispatch(setThinkingPhase("generating"));
            }
            fullAnswer += content;
            dispatch(appendStreamChunk(content));
            dispatch(updateLastMessage({ namespace, updates: { content: fullAnswer } }));
          },

          onDone: (data) => {
            dispatch(updateLastMessage({
              namespace,
              updates: {
                content:    data.fullAnswer || fullAnswer,
                sources:    data.sources || [],
                isStreaming: false,
              },
            }));
            dispatch(stopStreaming()); // clears thinkingPhase
          },

          onThinking: ({ phase: serverPhase }) => {
            clearTimeout(phaseTimer.current);
            dispatch(setThinkingPhase(serverPhase));
          },

          onError: ({ message: errMsg }) => {
            clearTimeout(phaseTimer.current);
            dispatch(updateLastMessage({
              namespace,
              updates: { content: errMsg, isStreaming: false, isError: true },
            }));
            dispatch(stopStreaming());
            toast.error(errMsg);
          },
        }
      );
    } catch (err) {
      clearTimeout(phaseTimer.current);
      dispatch(updateLastMessage({
        namespace,
        updates: { content: err.message, isStreaming: false, isError: true },
      }));
      dispatch(stopStreaming());
      toast.error(err.message || "Something went wrong");
    }
  }, [namespace, messages, settings, activeRepo, dispatch]);

  // ── No repo selected ──────────────────────────────────────────────────────
  if (!activeRepo) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        height: `calc(100vh - var(--topbar-height))`,
      }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "32px 24px",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ textAlign: "center", maxWidth: 400 }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(20,184,166,0.08))",
              border: "1px solid rgba(16,185,129,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 0 40px rgba(16,185,129,0.1)",
            }}>
              <GitBranch size={30} color="var(--primary-light)" />
            </div>

            <h2 style={{
              fontSize: 22, fontWeight: 700, color: "white",
              letterSpacing: "-0.4px", marginBottom: 10,
            }}>
              No repository selected
            </h2>
            <p style={{
              fontSize: 14, color: "var(--text-secondary)",
              lineHeight: 1.7, maxWidth: 300, margin: "0 auto 28px",
            }}>
              Select an analyzed repo from the sidebar, or paste a GitHub URL to index a new one.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["Analyze code", "Find bugs", "Explain architecture"].map((tag) => (
                <span key={tag} style={{
                  padding: "5px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 12, fontWeight: 500,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
        <ChatInputBar onSend={() => {}} disabled />
      </div>
    );
  }

  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: `calc(100vh - var(--topbar-height))`,
    }}>

      {/* ── Repo context header ─────────────────────────────────────── */}
      <div style={{
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(255,255,255,0.015)",
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #059669, #14b8a6)",
          boxShadow: "0 0 16px var(--primary-glow)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GitBranch size={15} color="white" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "white", letterSpacing: "-0.2px" }}>
              {activeRepo.repoName}
            </h2>
            {/* Live indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: 10,
              fontWeight: 600,
              background: isStreaming ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.08)",
              border: isStreaming ? "1px solid rgba(245,158,11,0.22)" : "1px solid rgba(16,185,129,0.2)",
              color: isStreaming ? "var(--accent-light)" : "var(--success)",
              transition: "all 0.4s ease",
            }}>
              <motion.div
                animate={isStreaming
                  ? { opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }
                  : { opacity: 1 }
                }
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: isStreaming ? "var(--accent-light)" : "var(--success)",
                }}
              />
              {isStreaming ? "Thinking..." : "Ready"}
            </div>
          </div>

          {activeRepo.stats && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
              <StatChip icon={<FileCode2 size={9} />} label={`${activeRepo.stats.filesProcessed} files`} />
              <StatChip icon={<Database size={9} />}   label={`${activeRepo.stats.vectorsStored} vectors`} />
              {messages.length > 0 && (
                <StatChip icon={<MessageSquare size={9} />} label={`${messages.length} messages`} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Messages area ───────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "24px 20px 8px",
        scrollBehavior: "smooth",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* ── Welcome state ── */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45 }}
                style={{ textAlign: "center", paddingBottom: 24 }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: "linear-gradient(135deg, #059669, #14b8a6)",
                  boxShadow: "0 0 36px var(--primary-glow)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                }}>
                  <Sparkles size={24} color="white" />
                </div>

                <h3 style={{
                  fontSize: 20, fontWeight: 700, color: "white",
                  letterSpacing: "-0.4px", marginBottom: 8,
                }}>
                  Start exploring{" "}
                  <span className="gradient-text">{activeRepo.repoName}</span>
                </h3>

                <p style={{
                  fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75,
                  maxWidth: 420, margin: "0 auto 28px",
                }}>
                  {activeRepo.summary || "Ask me anything about this codebase — architecture, functions, bugs, and more."}
                </p>

                {/* Suggestion chips */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 10, maxWidth: 520, margin: "0 auto",
                  textAlign: "left",
                }}>
                  {PROMPTS.map((p) => (
                    <motion.button
                      key={p.text}
                      onClick={() => handleSend(p.text)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        cursor: "pointer", textAlign: "left",
                        transition: "var(--transition)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(16,185,129,0.35)";
                        e.currentTarget.style.background = "rgba(16,185,129,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.background = "var(--bg-surface)";
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
                      <span style={{
                        fontSize: 12.5, color: "var(--text-secondary)",
                        lineHeight: 1.5, fontWeight: 500,
                      }}>
                        {p.text}
                      </span>
                      <ChevronRight size={13} color="var(--text-muted)"
                        style={{ marginLeft: "auto", flexShrink: 0, marginTop: 3 }} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Message list ── */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* ── Thinking steps overlay ── */}
          <AnimatePresence>
            {thinkingPhase && thinkingPhase !== "generating" && (
              <ThinkingSteps key="thinking" phase={thinkingPhase} />
            )}
          </AnimatePresence>

          <div ref={bottomRef} style={{ height: 8 }} />
        </div>
      </div>

      {/* ── Input bar ───────────────────────────────────────────────── */}
      <ChatInputBar
        onSend={handleSend}
        disabled={false}
        isStreaming={isStreaming}
      />
    </div>
  );
}

// ── Micro component ───────────────────────────────────────────────────────────
function StatChip({ icon, label }) {
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 4,
      fontSize: 11, color: "var(--text-muted)",
    }}>
      {icon}
      {label}
    </span>
  );
}
