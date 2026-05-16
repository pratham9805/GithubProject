/**
 * RepoCard — Compact card showing ingested repository metadata.
 * Displayed in the chat area after a successful ingestion.
 */

import { motion } from "framer-motion";
import { GitBranch, Star, GitFork, FileCode2, Database, ExternalLink, Zap } from "lucide-react";
import AnimatedBadge from "../ui/AnimatedBadge";

export default function RepoCard({ repo }) {
  if (!repo) return null;
  const { repoName, repoUrl, metadata, stats, summary } = repo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-[var(--border)] mb-6"
      style={{ boxShadow: "0 0 30px rgba(99,102,241,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--violet)] flex items-center justify-center flex-shrink-0">
            <GitBranch size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{repoName}</h3>
            {metadata?.language && (
              <AnimatedBadge color="blue" className="mt-1">{metadata.language}</AnimatedBadge>
            )}
          </div>
        </div>

        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface-hover)] transition-all flex-shrink-0"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Description */}
      {metadata?.description && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
          {metadata.description}
        </p>
      )}

      {/* Metadata row */}
      {metadata && (
        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)] mb-4">
          {metadata.stars != null && (
            <span className="flex items-center gap-1"><Star size={11} /> {metadata.stars.toLocaleString()}</span>
          )}
          {metadata.forks != null && (
            <span className="flex items-center gap-1"><GitFork size={11} /> {metadata.forks.toLocaleString()}</span>
          )}
        </div>
      )}

      {/* Ingestion stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: FileCode2, label: "Files",   value: stats.filesProcessed, color: "#818cf8" },
            { icon: Zap,       label: "Chunks",  value: stats.chunksCreated,  color: "#8b5cf6" },
            { icon: Database,  label: "Vectors", value: stats.vectorsStored,  color: "#06b6d4" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[var(--bg-surface)] rounded-xl p-3 text-center border border-[var(--border)]">
              <Icon size={13} className="mx-auto mb-1" style={{ color }} />
              <p className="text-sm font-bold text-white">{value?.toLocaleString() ?? "—"}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)] rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-light)] mb-1.5">
            AI Summary
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{summary}</p>
        </div>
      )}
    </motion.div>
  );
}
