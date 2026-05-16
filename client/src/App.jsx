/**
 * App.jsx — Root component.
 * Manages routing between Landing and App views.
 * Wires all panels, modals, and layout together.
 */

import { useState } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";

// Store selectors
import { selectView } from "./store/appSlice";

// Layout
import Layout from "./components/layout/Layout";

// Landing
import HeroSection from "./components/landing/HeroSection";

// Repo
import RepoInputPanel from "./components/repo/RepoInputPanel";

// Chat
import ChatInterface from "./components/chat/ChatInterface";

// Panels (always rendered, controlled by store)
import AnalyticsPanel from "./components/dashboard/AnalyticsPanel";
import SettingsPanel from "./components/settings/SettingsPanel";

export default function App() {
  const view = useSelector(selectView);

  // Controls the "Analyze Repo" modal
  const [showRepoModal, setShowRepoModal] = useState(false);

  return (
    <>
      <AnimatePresence mode="wait">
        {/* ── LANDING VIEW ─────────────────────────────────────── */}
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
          >
            <HeroSection onGetStarted={() => setShowRepoModal(true)} />
          </motion.div>
        )}

        {/* ── APP VIEW ─────────────────────────────────────────── */}
        {view === "app" && (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Layout onNewRepo={() => setShowRepoModal(true)}>
              <ChatInterface />
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GLOBAL PANELS (always mounted) ───────────────────── */}
      <AnalyticsPanel />
      <SettingsPanel />

      {/* ── REPO INPUT MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showRepoModal && (
          <RepoInputPanel onClose={() => setShowRepoModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}