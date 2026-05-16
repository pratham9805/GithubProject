/**
 * AnalyticsPanel — Slide-in drawer showing repo + usage stats.
 */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { X, Database, FileCode2, Zap, Clock, GitBranch, BarChart3, Layers } from "lucide-react";
import { closeAnalytics, selectAnalyticsOpen } from "../../store/appSlice";
import { selectActiveRepo, selectAnalyzedRepos } from "../../store/repoSlice";
import { selectAllConversations } from "../../store/chatSlice";
import { getRepoStats } from "../../lib/api";
import { StatCardSkeleton } from "../ui/LoadingSkeleton";

function StatCard({ icon: Icon, label, value, color = "blue", sub }) {
  const colorMap = {
    blue:   { bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)",  text: "#818cf8" },
    green:  { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  text: "#10b981" },
    violet: { bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)",  text: "#8b5cf6" },
    cyan:   { bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)",   text: "#06b6d4" },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 border"
      style={{ borderColor: c.border, background: c.bg }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: c.text }} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      {sub && <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function AnalyticsPanel() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectAnalyticsOpen);
  const activeRepo = useSelector(selectActiveRepo);
  const analyzedRepos = useSelector(selectAnalyzedRepos);
  const conversations = useSelector(selectAllConversations);

  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch live Pinecone vector count when panel opens
  useEffect(() => {
    if (isOpen && activeRepo?.namespace) {
      setLoading(true);
      getRepoStats(activeRepo.namespace)
        .then(setLiveStats)
        .catch(() => setLiveStats(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, activeRepo?.namespace]);

  // Compute aggregate totals across all repos
  const totalVectors = analyzedRepos.reduce((s, r) => s + (r.stats?.vectorsStored || 0), 0);
  const totalFiles = analyzedRepos.reduce((s, r) => s + (r.stats?.filesProcessed || 0), 0);
  const totalChunks = analyzedRepos.reduce((s, r) => s + (r.stats?.chunksCreated || 0), 0);
  const totalMessages = Object.values(conversations).reduce((s, msgs) => s + msgs.length, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeAnalytics())}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 glass border-l border-[var(--border)] flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--primary-light)]" />
                <h2 className="font-semibold text-white">Analytics</h2>
              </div>
              <button
                onClick={() => dispatch(closeAnalytics())}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface-hover)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 px-5 py-5 space-y-6">
              {/* Active Repo Section */}
              {activeRepo ? (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch size={13} className="text-[var(--text-muted)]" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Active Repository
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-white mb-1">{activeRepo.repoName}</p>
                    {activeRepo.metadata?.description && (
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {activeRepo.metadata.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-[var(--text-muted)]">
                      {activeRepo.metadata?.language && <span>⬡ {activeRepo.metadata.language}</span>}
                      {activeRepo.metadata?.stars != null && <span>★ {activeRepo.metadata.stars}</span>}
                      {activeRepo.metadata?.forks != null && <span>⑂ {activeRepo.metadata.forks}</span>}
                    </div>
                  </div>

                  {/* Live Pinecone stats */}
                  {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        icon={Database}
                        label="Vectors (Live)"
                        value={liveStats?.vectorCount ?? activeRepo.stats?.vectorsStored}
                        color="blue"
                        sub="Stored in Pinecone"
                      />
                      <StatCard
                        icon={FileCode2}
                        label="Files Indexed"
                        value={activeRepo.stats?.filesProcessed}
                        color="green"
                        sub="Across all types"
                      />
                      <StatCard
                        icon={Layers}
                        label="Text Chunks"
                        value={activeRepo.stats?.chunksCreated}
                        color="violet"
                        sub="Semantic segments"
                      />
                      <StatCard
                        icon={Zap}
                        label="Questions Asked"
                        value={(conversations[activeRepo.namespace] || [])
                          .filter(m => m.role === "user").length}
                        color="cyan"
                        sub="In this session"
                      />
                    </div>
                  )}
                </section>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                  Select a repository to see analytics
                </div>
              )}

              {/* Global Totals */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  All-time Totals
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={GitBranch}   label="Repos"    value={analyzedRepos.length} color="blue" />
                  <StatCard icon={Database} label="Vectors"  value={totalVectors}          color="violet" />
                  <StatCard icon={FileCode2} label="Files"   value={totalFiles}            color="green" />
                  <StatCard icon={Zap}      label="Messages" value={totalMessages}          color="cyan" />
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
