/**
 * TopBar — Fixed header bar for the app view.
 * Premium design with gradient logo, repo status chip, and polished actions.
 */

import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Menu, Settings, BarChart3, Plus, GitBranch, Zap, X
} from "lucide-react";
import { toggleSidebar, openSettings, openAnalytics, selectSidebarOpen } from "../../store/appSlice";
import { selectActiveRepo } from "../../store/repoSlice";
import GlowButton from "../ui/GlowButton";

export default function TopBar({ onNewRepo }) {
  const dispatch = useDispatch();
  const activeRepo = useSelector(selectActiveRepo);
  const sidebarOpen = useSelector(selectSidebarOpen);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 40,
        height: "var(--topbar-height)",
        background: "var(--topbar-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
      }}
    >
      {/* Sidebar Toggle */}
      <motion.button
        onClick={() => dispatch(toggleSidebar())}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: 10,
          background: sidebarOpen ? "rgba(16,185,129,0.1)" : "transparent",
          border: sidebarOpen ? "1px solid rgba(16,185,129,0.25)" : "1px solid transparent",
          color: sidebarOpen ? "var(--primary-light)" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "var(--transition)",
          flexShrink: 0,
        }}
      >
        <Menu size={17} />
      </motion.button>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 6 }}>
        <div style={{
          width: 30, height: 30,
          borderRadius: 9,
          background: "linear-gradient(135deg, #059669 0%, #14b8a6 100%)",
          boxShadow: "0 0 16px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <GitBranch size={14} color="white" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 1 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: "white", letterSpacing: "-0.3px",
          }} className="hidden sm:block">GitQA</span>
          <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.05em", fontWeight: 500 }}
            className="hidden sm:block">AI · BETA</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "var(--border)", flexShrink: 0 }} className="hidden sm:block" />

      {/* Active Repo Chip */}
      {activeRepo ? (
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 12px",
            borderRadius: "var(--radius-full)",
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.22)",
            maxWidth: 220,
            overflow: "hidden",
          }}
        >
          <span style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: "var(--success)",
            boxShadow: "0 0 6px var(--emerald-glow)",
            flexShrink: 0,
          }} className="pulse-dot" />
          <span style={{
            fontSize: 12, fontWeight: 500, color: "var(--text-primary)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {activeRepo.repoName}
          </span>
        </motion.div>
      ) : (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }} className="hidden md:block">
          No repo selected
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IconBtn onClick={() => dispatch(openAnalytics())} title="Analytics">
          <BarChart3 size={16} />
        </IconBtn>

        <IconBtn onClick={() => dispatch(openSettings())} title="Settings">
          <Settings size={16} />
        </IconBtn>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

        <GlowButton size="sm" onClick={onNewRepo} icon={Plus}>
          <span className="hidden sm:inline">New Repo</span>
          <span className="sm:hidden">+</span>
        </GlowButton>
      </div>
    </motion.header>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 10,
        background: "transparent",
        border: "1px solid transparent",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "var(--transition)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--bg-surface-hover)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "white";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      {children}
    </motion.button>
  );
}
