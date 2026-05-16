/**
 * RepoInputPanel — Repository URL input with validation and ingestion progress.
 * Shown as a modal/overlay when user clicks "Analyze a Repo".
 */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, X, ArrowRight, AlertCircle, CheckCircle2, FileCode2, Database, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { analyzeRepository } from "../../lib/api";
import {
  startIngestion, updateIngestion, completeIngestion,
  failIngestion, addAnalyzedRepo, selectIngestion,
  resetIngestion, selectAnalyzedRepos, setActiveRepo
} from "../../store/repoSlice";
import { enterApp } from "../../store/appSlice";
import GlowButton from "../ui/GlowButton";

const GITHUB_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

export default function RepoInputPanel({ onClose }) {
  const dispatch = useDispatch();
  const ingestion = useSelector(selectIngestion);
  const analyzedRepos = useSelector(selectAnalyzedRepos);

  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const isRunning = ingestion.status === "running";
  const isComplete = ingestion.status === "complete";
  const isError = ingestion.status === "error";

  // Auto-reset state after 3 seconds on success/error
  useEffect(() => {
    let timeout;
    if (isComplete || isError) {
      timeout = setTimeout(() => {
        dispatch(resetIngestion());
        if (isComplete) {
          setRepoUrl("");
        }
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isComplete, isError, dispatch]);

  const validateUrl = (url) => {
    if (!url.trim()) return "Please enter a GitHub URL";
    if (!GITHUB_REGEX.test(url.trim())) return "Invalid format. Expected: https://github.com/owner/repo";
    return "";
  };

  const handleAnalyze = async () => {
    const error = validateUrl(repoUrl);
    if (error) { setUrlError(error); return; }
    setUrlError("");

    // Fast-path: Check if already indexed in frontend state
    const existingRepo = analyzedRepos.find(
      (r) => r.repoUrl.toLowerCase() === repoUrl.trim().toLowerCase() ||
             r.repoUrl.toLowerCase() + '/' === repoUrl.trim().toLowerCase() ||
             r.repoUrl.toLowerCase() === repoUrl.trim().toLowerCase() + '/'
    );

    if (existingRepo) {
      toast.success("Repo already fetched! Attaching context...");
      dispatch(setActiveRepo(existingRepo));
      dispatch(enterApp());
      setTimeout(() => onClose?.(), 300);
      return;
    }

    dispatch(startIngestion());

    let repoName = "";
    let namespace = "";
    let metadata = null;
    let summary = "";

    try {
      await analyzeRepository(repoUrl, {
        onStatus: ({ message }) => {
          dispatch(updateIngestion({ message }));
        },
        onStart: (data) => {
          repoName = data.repoName;
          namespace = data.namespace;
          metadata = data.metadata;
          dispatch(updateIngestion({ message: `Indexing ${data.repoName}...` }));
        },
        onFilesFound: ({ count }) => {
          dispatch(updateIngestion({ filesFound: count, totalFiles: count }));
        },
        onFile: ({ filesProcessed, totalFiles, chunksCreated: fc }) => {
          const progress = totalFiles > 0
            ? Math.round((filesProcessed / totalFiles) * 85)
            : 0;
          dispatch(updateIngestion({
            filesProcessed,
            totalFiles,
            progress,
            message: `Processing files... (${filesProcessed}/${totalFiles})`,
          }));
        },
        onVectorsUpserted: ({ vectorsStored }) => {
          dispatch(updateIngestion({ vectorsStored }));
        },
        onSummary: ({ summary: s }) => {
          summary = s;
          dispatch(updateIngestion({ progress: 95, message: "Finalizing..." }));
        },
        onComplete: (data) => {
          dispatch(completeIngestion());
          dispatch(addAnalyzedRepo({
            namespace: data.namespace,
            repoUrl,
            repoName: data.repoName,
            metadata: data.metadata,
            stats: data.stats,
            summary: data.summary,
            analyzedAt: new Date().toISOString(),
          }));
          dispatch(enterApp());
          
          if (data.status === "existing") {
            toast.success("Repo already indexed. Context attached!");
            setTimeout(() => onClose?.(), 300);
          } else {
            toast.success(`${data.repoName} indexed successfully!`);
          }
        },
        onError: ({ message }) => {
          dispatch(failIngestion(message));
          toast.error(message || "Ingestion failed");
        },
      });
    } catch (err) {
      dispatch(failIngestion(err.message));
      toast.error(err.message || "Something went wrong");
    }
  };

  const progress = ingestion.progress || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!isRunning ? onClose : undefined}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative w-full max-w-lg glass rounded-2xl p-6 border border-[var(--border)]"
        style={{ boxShadow: "0 0 60px rgba(99,102,241,0.15)" }}
      >
        {/* Close */}
        {!isRunning && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface-hover)] transition-all"
          >
            <X size={16} />
          </button>
        )}

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--violet)] flex items-center justify-center">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Analyze Repository</h2>
            <p className="text-xs text-[var(--text-muted)]">Index any public GitHub repository</p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
            GitHub Repository URL
          </label>
          <div className="relative">
            <GitBranch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              className="input-base pl-10 pr-4"
              placeholder="https://github.com/facebook/react"
              value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); setUrlError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !isRunning && handleAnalyze()}
              disabled={isRunning}
            />
          </div>
          {urlError && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--error)] mt-2">
              <AlertCircle size={12} /> {urlError}
            </p>
          )}
        </div>

        {/* Progress section — shown during/after ingestion */}
        <AnimatePresence>
          {ingestion.status !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              {/* Status message */}
              <div className="flex items-center gap-2 mb-3">
                {isRunning && <Loader2 size={14} className="text-[var(--primary)] animate-spin" />}
                {isComplete && <CheckCircle2 size={14} className="text-[var(--success)]" />}
                {isError && <AlertCircle size={14} className="text-[var(--error)]" />}
                <span className={`text-sm ${isError ? "text-[var(--error)]" : "text-[var(--text-secondary)]"}`}>
                  {ingestion.message}
                </span>
              </div>

              {/* Progress Bar */}
              {(isRunning || isComplete) && (
                <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden mb-3">
                  <div className="progress-bar-fill h-full rounded-full" style={{ width: `${progress}%` }} />
                </div>
              )}

              {/* Stats grid */}
              {(ingestion.filesFound > 0 || ingestion.vectorsStored > 0) && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: FileCode2, label: "Files", value: `${ingestion.filesProcessed}/${ingestion.filesFound}` },
                    { icon: Database, label: "Chunks", value: ingestion.chunksCreated || "—" },
                    { icon: Database, label: "Vectors", value: ingestion.vectorsStored || "—" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 text-center">
                      <Icon size={14} className="text-[var(--primary-light)] mx-auto mb-1" />
                      <p className="text-sm font-semibold text-white">{value}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <GlowButton
          onClick={handleAnalyze}
          loading={isRunning}
          disabled={isRunning || isComplete}
          className="w-full justify-center"
          size="lg"
          iconRight={!isRunning && !isComplete ? ArrowRight : undefined}
        >
          {isComplete ? "Indexed Successfully!" : isRunning ? "Indexing..." : "Analyze Repository"}
        </GlowButton>

        {/* Analyzed Repos List (Bonus) */}
        {analyzedRepos.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">
              Indexed in this Session
            </p>
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
              {analyzedRepos.map((repo) => (
                <div key={repo.namespace} className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border)]">
                  <GitBranch size={14} className="text-[var(--primary)]" />
                  <span className="truncate flex-1 font-medium">{repo.repoName}</span>
                  <CheckCircle2 size={14} className="text-[var(--success)] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
