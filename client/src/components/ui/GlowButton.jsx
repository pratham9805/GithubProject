/**
 * GlowButton — Premium button. Emerald gradient primary variant.
 */
import { motion } from "framer-motion";

const variants = {
  primary: {
    background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #14b8a6 100%)",
    color: "white",
    boxShadow: "0 0 16px rgba(16,185,129,0.32), inset 0 1px 0 rgba(255,255,255,0.14)",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid rgba(255,255,255,0.11)",
  },
  danger: {
    background: "rgba(239,68,68,0.1)",
    color: "var(--error)",
    border: "1px solid rgba(239,68,68,0.28)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "none",
  },
};

const sizes = {
  sm: { padding: "6px 14px", fontSize: 13, borderRadius: 9 },
  md: { padding: "9px 20px", fontSize: 13.5, borderRadius: 11 },
  lg: { padding: "14px 28px", fontSize: 15, borderRadius: 13 },
};

export default function GlowButton({
  children, onClick, variant = "primary", size = "md",
  disabled = false, loading = false, className = "",
  type = "button", icon: Icon, iconRight: IconRight,
}) {
  const v = variants[variant];
  const s = sizes[size];

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.03, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.48 : 1,
        fontWeight: 700, letterSpacing: "-0.1px",
        transition: "box-shadow 0.2s ease",
        fontFamily: "var(--font-sans)",
        ...v, ...s,
      }}
      onMouseEnter={e => {
        if (variant === "primary" && !disabled) {
          e.currentTarget.style.boxShadow = "0 0 28px rgba(16,185,129,0.48), inset 0 1px 0 rgba(255,255,255,0.14)";
        }
        if (variant === "secondary") {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
          e.currentTarget.style.color = "white";
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }
      }}
      onMouseLeave={e => {
        if (variant === "primary" && !disabled) {
          e.currentTarget.style.boxShadow = "0 0 16px rgba(16,185,129,0.32), inset 0 1px 0 rgba(255,255,255,0.14)";
        }
        if (variant === "secondary") {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)";
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.background = "transparent";
        }
      }}
      className={className}
    >
      {loading
        ? <span style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
        : Icon ? <Icon size={15} /> : null
      }
      {children}
      {!loading && IconRight && <IconRight size={15} />}
    </motion.button>
  );
}
