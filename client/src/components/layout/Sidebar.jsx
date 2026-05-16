/**
 * Sidebar — Premium animated sidebar showing analyzed repos.
 * Clean, structured, no heavy glassmorphism.
 */

import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, Trash2, MessageSquare, Database, Clock,
  FolderOpen, Plus, Search, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

import { selectSidebarOpen, toggleSidebar } from "../../store/appSlice";
import { selectAnalyzedRepos, selectActiveRepo, setActiveRepo, removeRepo } from "../../store/repoSlice";
import { removeConversation, selectAllConversations } from "../../store/chatSlice";
import { deleteRepository } from "../../lib/api";

export default function Sidebar() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const analyzedRepos = useSelector(selectAnalyzedRepos);
  const activeRepo = useSelector(selectActiveRepo);
  const conversations = useSelector(selectAllConversations);

  const handleSelectRepo = (repo) => dispatch(setActiveRepo(repo));

  const handleDeleteRepo = async (e, repo) => {
    e.stopPropagation();
    try { await deleteRepository(repo.namespace); } catch {}
    dispatch(removeRepo(repo.namespace));
    dispatch(removeConversation(repo.namespace));
    toast.success(`"${repo.repoName}" removed`);
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(toggleSidebar())}
            className="sm:hidden"
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 29,
            }}
          />

          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            style={{
              position: "fixed",
              left: 0,
              top: "var(--topbar-height)",
              bottom: 0,
              width: "var(--sidebar-width)",
              zIndex: 30,
              background: "var(--sidebar-bg)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FolderOpen size={14} color="var(--text-muted)" />
                  <span style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--text-muted)",
                  }}>
                    Repositories
                  </span>
                </div>
                {analyzedRepos.length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "2px 7px", borderRadius: "var(--radius-full)",
                    background: "var(--primary-bg)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "var(--primary-light)",
                  }}>
                    {analyzedRepos.length}
                  </span>
                )}
              </div>
            </div>

            {/* Repos List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
              {analyzedRepos.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {analyzedRepos.map((repo, i) => {
                    const isActive = activeRepo?.namespace === repo.namespace;
                    const msgCount = (conversations[repo.namespace] || []).length;

                    return (
                      <motion.div
                        key={repo.namespace}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        onClick={() => handleSelectRepo(repo)}
                        style={{
                          position: "relative",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "transparent"}`,
                          background: isActive
                            ? "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(20,184,166,0.07) 100%)"
                            : "transparent",
                          transition: "var(--transition)",
                          overflow: "hidden",
                          userSelect: "none",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "var(--bg-surface-hover)";
                            e.currentTarget.style.borderColor = "var(--border)";
                          }
                          const btn = e.currentTarget.querySelector(".delete-btn");
                          if (btn) btn.style.opacity = "1";
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "transparent";
                          }
                          const btn = e.currentTarget.querySelector(".delete-btn");
                          if (btn) btn.style.opacity = "0";
                        }}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <motion.div
                            layoutId="sidebarIndicator"
                            style={{
                              position: "absolute",
                              left: 0, top: "50%",
                              transform: "translateY(-50%)",
                              width: 3, height: 28,
                              background: "linear-gradient(180deg, var(--primary), var(--teal))",
                              borderRadius: "0 3px 3px 0",
                              boxShadow: "2px 0 8px var(--primary-glow)",
                            }}
                          />
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 9, paddingLeft: isActive ? 6 : 0, transition: "padding 0.2s" }}>
                          {/* Repo icon */}
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: isActive
                              ? "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(20,184,166,0.2))"
                              : "rgba(255,255,255,0.05)",
                            border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <GitBranch size={12} color={isActive ? "var(--primary-light)" : "var(--text-muted)"} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                              color: isActive ? "white" : "var(--text-secondary)",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              lineHeight: 1.3,
                            }}>
                              {repo.repoName}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                              {msgCount > 0 && (
                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--text-muted)" }}>
                                  <MessageSquare size={8} />
                                  {msgCount}
                                </span>
                              )}
                              {repo.analyzedAt && (
                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--text-muted)" }}>
                                  <Clock size={8} />
                                  {formatDistanceToNow(new Date(repo.analyzedAt), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            className="delete-btn"
                            onClick={(e) => handleDeleteRepo(e, repo)}
                            style={{
                              opacity: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              width: 24, height: 24, borderRadius: 6,
                              background: "transparent",
                              border: "none", cursor: "pointer",
                              color: "var(--text-muted)",
                              flexShrink: 0,
                              transition: "var(--transition)",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "var(--error-bg)";
                              e.currentTarget.style.color = "var(--error)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--text-muted)";
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        {/* Stats row */}
                        {repo.stats?.vectorsStored && (
                          <div style={{
                            marginTop: 7, paddingLeft: isActive ? 6 : 0,
                            display: "flex", alignItems: "center", gap: 6,
                            transition: "padding 0.2s",
                          }}>
                            <div style={{ marginLeft: 37, display: "flex", alignItems: "center", gap: 4 }}>
                              <Database size={8} color="var(--text-muted)" />
                              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                {repo.stats.vectorsStored} vectors
                              </span>
                              {repo.stats.filesProcessed && (
                                <>
                                  <span style={{ color: "var(--border)", fontSize: 10 }}>·</span>
                                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                    {repo.stats.filesProcessed} files
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {analyzedRepos.length} / 20 repos
              </span>
              <div style={{
                height: 4, flex: 1, maxWidth: 80, marginLeft: 10,
                background: "var(--bg-elevated)", borderRadius: 99,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${(analyzedRepos.length / 20) * 100}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--violet))",
                  borderRadius: 99,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px", textAlign: "center",
      height: "100%",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(20,184,166,0.08))",
        border: "1px solid rgba(16,185,129,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        <GitBranch size={20} color="var(--primary-light)" />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
        No repositories yet
      </p>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Paste a GitHub URL to start analyzing your codebase with AI.
      </p>
    </div>
  );
}
