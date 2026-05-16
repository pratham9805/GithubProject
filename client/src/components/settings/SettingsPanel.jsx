/**
 * SettingsPanel — Slide-in drawer for AI model settings and service health.
 */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Cpu, Thermometer, Search, CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import { closeSettings, selectSettingsOpen } from "../../store/appSlice";
import { selectChatSettings, updateSettings, resetSettings } from "../../store/chatSlice";
import { checkHealth } from "../../lib/api";
import GlowButton from "../ui/GlowButton";

const MODELS = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", desc: "Fast · Affordable · Default" },
  { id: "gpt-4o-mini",  label: "GPT-4o Mini",  desc: "Efficient · Balanced" },
  { id: "gpt-4o",       label: "GPT-4o",        desc: "Most capable · Slower" },
];

function ServiceStatus({ name, status }) {
  const isOk = status === "ok";
  const isLoading = status === "checking";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{name}</span>
      <span className={`flex items-center gap-1.5 text-xs font-medium
        ${isOk ? "text-[var(--success)]" : isLoading ? "text-[var(--text-muted)]" : "text-[var(--error)]"}`}>
        {isLoading
          ? <Loader2 size={12} className="animate-spin" />
          : isOk
            ? <CheckCircle2 size={12} />
            : <XCircle size={12} />
        }
        {isLoading ? "Checking..." : isOk ? "Connected" : "Error"}
      </span>
    </div>
  );
}

function SliderRow({ label, icon: Icon, value, min, max, step, onChange, format }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        </div>
        <span className="text-sm font-semibold text-white">{format ? format(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--text-muted)]">{min}</span>
        <span className="text-[10px] text-[var(--text-muted)]">{max}</span>
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectSettingsOpen);
  const settings = useSelector(selectChatSettings);

  const [health, setHealth] = useState({ openai: "checking", pinecone: "checking", github: "checking" });

  useEffect(() => {
    if (isOpen) {
      setHealth({ openai: "checking", pinecone: "checking", github: "checking" });
      checkHealth()
        .then((data) => setHealth(data.services))
        .catch(() => setHealth({ openai: "error", pinecone: "error", github: "error" }));
    }
  }, [isOpen]);

  const set = (key, val) => dispatch(updateSettings({ [key]: val }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeSettings())}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 glass border-l border-[var(--border)] flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[var(--primary-light)]" />
                <h2 className="font-semibold text-white">Settings</h2>
              </div>
              <button
                onClick={() => dispatch(closeSettings())}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface-hover)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 px-5 py-5 space-y-6">
              {/* Model Selector */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={14} className="text-[var(--text-muted)]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">AI Model</p>
                </div>
                <div className="space-y-2">
                  {MODELS.map((m) => {
                    const active = settings.model === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => set("model", m.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                          active
                            ? "border-[var(--primary)] bg-[rgba(99,102,241,0.1)]"
                            : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${active ? "text-white" : "text-[var(--text-secondary)]"}`}>
                            {m.label}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.desc}</p>
                        </div>
                        {active && (
                          <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Sliders */}
              <section className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Generation</p>

                <SliderRow
                  label="Temperature"
                  icon={Thermometer}
                  value={settings.temperature}
                  min={0} max={1} step={0.05}
                  onChange={(v) => set("temperature", v)}
                  format={(v) => v.toFixed(2)}
                />

                <SliderRow
                  label="Sources (Top-K)"
                  icon={Search}
                  value={settings.topK}
                  min={1} max={10} step={1}
                  onChange={(v) => set("topK", v)}
                />

                <SliderRow
                  label="Max Tokens"
                  icon={Cpu}
                  value={settings.maxTokens}
                  min={300} max={3000} step={100}
                  onChange={(v) => set("maxTokens", v)}
                />
              </section>

              {/* Service Health */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Service Status</p>
                <div className="glass rounded-xl px-4">
                  <ServiceStatus name="OpenAI API"  status={health.openai}   />
                  <ServiceStatus name="Pinecone DB"  status={health.pinecone} />
                  <ServiceStatus name="GitHub API"   status={health.github}   />
                </div>
              </section>

              {/* Reset */}
              <GlowButton
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => dispatch(resetSettings())}
                className="w-full justify-center"
              >
                Reset to Defaults
              </GlowButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
