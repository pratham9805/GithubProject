import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GitBranch, Zap, Search, MessageSquare, ArrowRight,
  CheckCircle2, Code2, Layers, Terminal, ChevronRight,
  Star, Shield, Clock, UserCheck, Bug, BookOpen, Rocket, Users, GitPullRequest
} from "lucide-react";

/* ── animation presets ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

/* ── data ── */
const FEATURES = [
  {
    icon: Zap, color: "#f59e0b", bg: "rgba(245,158,11,0.09)", border: "rgba(245,158,11,0.2)",
    title: "Instant Indexing",
    desc: "Paste any GitHub URL. Every file gets vectorized and stored in seconds using AI embeddings.",
  },
  {
    icon: Search, color: "#10b981", bg: "rgba(16,185,129,0.09)", border: "rgba(16,185,129,0.2)",
    title: "Semantic Search",
    desc: "Find exactly what you need with natural language — not just keywords. Context-aware retrieval.",
  },
  {
    icon: MessageSquare, color: "#14b8a6", bg: "rgba(20,184,166,0.09)", border: "rgba(20,184,166,0.2)",
    title: "AI Chat Interface",
    desc: "Ask anything about the codebase. Get streamed answers with source file references.",
  },
  {
    icon: Shield, color: "#f97316", bg: "rgba(249,115,22,0.09)", border: "rgba(249,115,22,0.2)",
    title: "Private & Secure",
    desc: "Your code stays yours. Vectors are namespaced per repo and never shared across users.",
  },
];

const STEPS = [
  { num: "01", label: "Paste GitHub URL", icon: GitBranch, desc: "Any public repo — no auth needed." },
  { num: "02", label: "AI Indexes Files", icon: Layers, desc: "We clone, chunk, embed and store every file." },
  { num: "03", label: "Ask Questions", icon: MessageSquare, desc: "Chat with your codebase in plain English." },
];

const STATS = [
  { value: "< 60s", label: "Avg index time" },
  { value: "GPT-4", label: "Powered by" },
  { value: "100%", label: "File coverage" },
  { value: "Free", label: "To try" },
];

const USE_CASES = [
  {
    icon: Rocket, color: "#10b981", bg: "rgba(16,185,129,0.09)", border: "rgba(16,185,129,0.22)",
    role: "New Developer Onboarding",
    scenario: "Joined a 3-year-old codebase?",
    example: "\"Where is user authentication handled and how does the token refresh flow work?\"",
    outcome: "Understand in minutes what used to take weeks.",
  },
  {
    icon: Bug, color: "#f59e0b", bg: "rgba(245,158,11,0.09)", border: "rgba(245,158,11,0.22)",
    role: "Debugging & Root Cause Analysis",
    scenario: "Production bug, no idea where it lives?",
    example: "\"Which function processes payment webhooks and what validations does it run?\"",
    outcome: "Jump directly to the right file — no grep, no guessing.",
  },
  {
    icon: GitPullRequest, color: "#14b8a6", bg: "rgba(20,184,166,0.09)", border: "rgba(20,184,166,0.22)",
    role: "Code Review Preparation",
    scenario: "Reviewing a PR touching 30 files?",
    example: "\"What does the RateLimiter middleware do and where is it applied across the routes?\"",
    outcome: "Review with full context, not just the diff.",
  },
  {
    icon: BookOpen, color: "#f97316", bg: "rgba(249,115,22,0.09)", border: "rgba(249,115,22,0.22)",
    role: "Open Source Contribution",
    scenario: "Want to contribute to a large OSS project?",
    example: "\"How do I add a new plugin to this system? What interfaces must I implement?\"",
    outcome: "Contribute confidently without reading every file.",
  },
  {
    icon: UserCheck, color: "#a78bfa", bg: "rgba(167,139,250,0.09)", border: "rgba(167,139,250,0.22)",
    role: "Technical Due Diligence",
    scenario: "Evaluating a vendor's codebase or an acquisition?",
    example: "\"What external APIs does this service depend on and how are secrets managed?\"",
    outcome: "Surface risks in hours, not weeks of manual review.",
  },
  {
    icon: Users, color: "#34d399", bg: "rgba(52,211,153,0.09)", border: "rgba(52,211,153,0.22)",
    role: "Team Knowledge Sharing",
    scenario: "Senior dev leaving? Knowledge getting siloed?",
    example: "\"Explain how the deployment pipeline works and what each GitHub Action does.\"",
    outcome: "Institutional knowledge, always accessible.",
  },
];

/* ══════════════════════════════════════════════════════════════════════ */
export default function HeroSection({ onGetStarted }) {
  const [typed, setTyped] = useState("");
  const placeholder = "https://github.com/openai/openai-python";

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTyped(placeholder.slice(0, i + 1));
      i++;
      if (i >= placeholder.length) clearInterval(id);
    }, 42);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative", overflow: "hidden" }}>

      {/* ── ambient orbs ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          filter: "blur(100px)", top: -250, left: -150,
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
          filter: "blur(100px)", top: "30%", right: -120,
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)",
          filter: "blur(90px)", bottom: -100, left: "40%",
        }} />
        {/* subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }} />
      </div>

      {/* ── Navbar ── */}
      <Navbar onGetStarted={onGetStarted} />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        maxWidth: 900, margin: "0 auto",
      }}>
        {/* badge */}
        <motion.div {...fadeUp(0.05)}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 999,
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.22)",
            fontSize: 12.5, fontWeight: 600, color: "var(--primary-light)",
            letterSpacing: "0.02em", marginBottom: 32,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--primary)", display: "inline-block",
            }} className="pulse-dot" />
            AI-Powered Code Intelligence
          </span>
        </motion.div>

        {/* heading */}
        <motion.h1 {...fadeUp(0.12)} style={{
          fontSize: "clamp(38px, 6vw, 72px)",
          fontWeight: 900, lineHeight: 1.1,
          letterSpacing: "-2px", color: "white",
          marginBottom: 24,
        }}>
          Understand any<br />
          <span style={{
            background: "linear-gradient(135deg, #34d399 0%, #14b8a6 50%, #fbbf24 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>GitHub repo</span>
          {" "}instantly
        </motion.h1>

        {/* sub */}
        <motion.p {...fadeUp(0.2)} style={{
          fontSize: "clamp(15px, 2vw, 19px)",
          color: "var(--text-secondary)", lineHeight: 1.75,
          maxWidth: 600, marginBottom: 44,
        }}>
          Paste a GitHub URL and start asking questions in plain English.
          GitQA indexes every file with AI embeddings and streams answers back — with exact source references.
        </motion.p>

        {/* typewriter input + CTA */}
        <motion.div {...fadeUp(0.28)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 580,
        }}>
          {/* fake repo input */}
          <div style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 14, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 0 0 4px rgba(16,185,129,0.06), 0 4px 24px rgba(0,0,0,0.35)",
          }}>
            <GitBranch size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <span style={{
              flex: 1, textAlign: "left", fontSize: 13.5,
              color: "var(--text-secondary)", fontFamily: "var(--font-mono)",
              overflow: "hidden", whiteSpace: "nowrap",
            }}>
              {typed}
              <span style={{
                display: "inline-block", width: 2, height: 14,
                background: "var(--primary-light)", marginLeft: 1,
                verticalAlign: "middle",
                animation: "cursorBlink 0.7s step-end infinite",
              }} />
            </span>
          </div>

          {/* CTA button */}
          <button
            onClick={onGetStarted}
            style={{
              width: "100%", padding: "16px 32px",
              borderRadius: 14, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #14b8a6 100%)",
              color: "white", fontSize: 15.5, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 0 28px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "all 0.22s ease", letterSpacing: "-0.2px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 0 44px rgba(16,185,129,0.48), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 28px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
          >
            Analyze a Repository
            <ArrowRight size={18} />
          </button>

          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Free · No login required · Works with any public GitHub repo
          </p>
        </motion.div>

        {/* stats row */}
        <motion.div {...fadeUp(0.38)} style={{
          display: "flex", gap: 0, marginTop: 56,
          borderRadius: 16, overflow: "hidden",
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.025)",
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: "18px 32px", textAlign: "center",
              borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
      <section id="features" style={{
        position: "relative", zIndex: 1,
        padding: "80px 24px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <motion.div {...fadeUp(0)} style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel>Core Features</SectionLabel>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
            color: "white", letterSpacing: "-1px", marginTop: 12,
          }}>
            Everything you need to understand a codebase
          </h2>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp(i * 0.08)}
              whileHover={{ y: -4 }}
              style={{
                padding: "28px 24px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                cursor: "default",
                transition: "border-color 0.25s, box-shadow 0.25s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = f.border;
                e.currentTarget.style.boxShadow = `0 0 24px ${f.bg}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: f.bg, border: `1px solid ${f.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
              }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{
        position: "relative", zIndex: 1,
        padding: "80px 24px",
        maxWidth: 860, margin: "0 auto",
      }}>
        <motion.div {...fadeUp(0)} style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel>How It Works</SectionLabel>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
            color: "white", letterSpacing: "-1px", marginTop: 12,
          }}>
            Three steps to full codebase clarity
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              {...fadeUp(i * 0.1)}
              style={{
                display: "flex", alignItems: "center", gap: 24,
                padding: "24px 28px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.028)",
                border: "1px solid var(--border)",
                transition: "border-color 0.25s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              {/* step number */}
              <div style={{
                minWidth: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(20,184,166,0.08))",
                border: "1px solid rgba(16,185,129,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: "var(--primary-light)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {step.num}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <step.icon size={16} color="var(--primary)" />
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "white" }}>{step.label}</h3>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>

              {i < STEPS.length - 1 && (
                <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              )}
              {i === STEPS.length - 1 && (
                <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ USE CASES ══════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "80px 24px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <motion.div {...fadeUp(0)} style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel>Real World Use Cases</SectionLabel>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
            color: "white", letterSpacing: "-1px", marginTop: 12, marginBottom: 14,
          }}>
            Built for every developer workflow
          </h2>
          <p style={{
            fontSize: 15.5, color: "var(--text-secondary)", lineHeight: 1.7,
            maxWidth: 540, margin: "0 auto",
          }}>
            From debugging to onboarding — GitQA replaces hours of manual code exploration.
          </p>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: 20,
        }}>
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.role}
              {...fadeUp(i * 0.07)}
              whileHover={{ y: -5 }}
              style={{
                padding: "28px 26px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.028)",
                border: "1px solid var(--border)",
                cursor: "default",
                transition: "border-color 0.25s, box-shadow 0.25s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = uc.border;
                e.currentTarget.style.boxShadow = `0 0 32px ${uc.bg}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* icon + role */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                  background: uc.bg, border: `1px solid ${uc.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <uc.icon size={19} color={uc.color} />
                </div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "white", lineHeight: 1.3 }}>
                  {uc.role}
                </h3>
              </div>

              {/* scenario */}
              <p style={{
                fontSize: 13, color: uc.color, fontWeight: 600,
                marginBottom: 10, lineHeight: 1.4,
              }}>
                {uc.scenario}
              </p>

              {/* example question */}
              <div style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                marginBottom: 14,
              }}>
                <p style={{
                  fontSize: 12.5, color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)", lineHeight: 1.6, margin: 0,
                }}>
                  {uc.example}
                </p>
              </div>

              {/* outcome */}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <CheckCircle2 size={13} color={uc.color} style={{ flexShrink: 0 }} />
                <p style={{
                  fontSize: 12.5, color: "var(--text-secondary)",
                  fontWeight: 500, lineHeight: 1.5, margin: 0,
                }}>
                  {uc.outcome}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "40px 24px 100px",
        maxWidth: 780, margin: "0 auto", textAlign: "center",
      }}>
        <motion.div
          {...fadeUp(0)}
          style={{
            padding: "52px 40px",
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(20,184,166,0.05) 50%, rgba(245,158,11,0.05) 100%)",
            border: "1px solid rgba(16,185,129,0.18)",
            boxShadow: "0 0 60px rgba(16,185,129,0.06)",
          }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 999,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)",
            fontSize: 12, fontWeight: 600, color: "var(--accent-light)",
            marginBottom: 22,
          }}>
            <Star size={11} fill="currentColor" />
            Start for free — no account needed
          </div>

          <h2 style={{
            fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800,
            color: "white", letterSpacing: "-1px", marginBottom: 14,
          }}>
            Ready to explore your codebase?
          </h2>
          <p style={{
            fontSize: 15.5, color: "var(--text-secondary)",
            lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px",
          }}>
            Drop a GitHub URL and get AI-powered answers about any repository in under a minute.
          </p>

          <button
            onClick={onGetStarted}
            style={{
              padding: "15px 40px",
              borderRadius: 13, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "white", fontSize: 15, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 10,
              boxShadow: "0 0 28px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "all 0.22s ease", letterSpacing: "-0.2px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 0 44px rgba(16,185,129,0.52), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 28px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
          >
            Get Started Now <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{
        position: "relative", zIndex: 1,
        borderTop: "1px solid var(--border)",
        padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #059669, #14b8a6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GitBranch size={13} color="white" />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "white" }}>GitQA</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· AI-Powered Code Intelligence</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          © 2025 GitQA. Built with GPT-4 + Pinecone.
        </p>
      </footer>
    </div>
  );
}

/* ── Navbar ── */
function Navbar({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 32px",
        height: 62,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(6,10,7,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "linear-gradient(135deg, #059669, #14b8a6)",
          boxShadow: "0 0 16px rgba(16,185,129,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GitBranch size={15} color="white" />
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.4px" }}>
          GitQA
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[
          { label: "Features", id: "features" },
          { label: "How it works", id: "how-it-works" }
        ].map(link => (
          <button key={link.id} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13.5, fontWeight: 500, color: "var(--text-secondary)",
            padding: "6px 12px", borderRadius: 8, transition: "var(--transition)",
          }}
            onClick={() => {
              document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" });
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "none"; }}
          >
            {link.label}
          </button>
        ))}

        <button
          onClick={onGetStarted}
          style={{
            marginLeft: 8, padding: "8px 20px",
            borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #059669, #10b981)",
            color: "white", fontSize: 13.5, fontWeight: 700,
            boxShadow: "0 0 14px rgba(16,185,129,0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 24px rgba(16,185,129,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 14px rgba(16,185,129,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Try it free →
        </button>
      </div>
    </motion.nav>
  );
}

/* ── Section label chip ── */
function SectionLabel({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 14px", borderRadius: 999,
      background: "rgba(16,185,129,0.07)",
      border: "1px solid rgba(16,185,129,0.18)",
      fontSize: 11.5, fontWeight: 700, color: "var(--primary-light)",
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}
