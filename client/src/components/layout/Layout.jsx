/**
 * Layout — Main app shell with sidebar + topbar + content area.
 * Smooth spring animation when sidebar opens/closes.
 */

import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import { selectSidebarOpen } from "../../store/appSlice";

export default function Layout({ children, onNewRepo }) {
  const sidebarOpen = useSelector(selectSidebarOpen);

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
    }} className="animated-bg grid-bg">

      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Top Bar */}
      <TopBar onNewRepo={onNewRepo} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <motion.main
        animate={{ marginLeft: sidebarOpen ? "var(--sidebar-width)" : "0px" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        style={{
          paddingTop: "var(--topbar-height)",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </motion.main>
    </div>
  );
}
