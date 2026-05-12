import { useApp } from "@context/AppContext";
import { useAuth } from "@context/AuthContext";
import { useTheme } from "@context/ThemeContext";
import { useToast } from "@context/ToastContext";
import { useConfirm } from "@context/ConfirmationContext";
import {
  BrainCircuit,
  LogOut,
  Moon,
  Sun,
  Shield,
  Palette,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { state, dispatch } = useApp();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  function handleLogout() {
    confirm({
      title: "Sign Out",
      message: "Your data is saved to the cloud. You can sign back in anytime.",
      type: "info",
      confirmText: "Sign Out",
      onConfirm: logout,
    });
  }

  function toggleAI() {
    const next = !state.aiEnabled;
    dispatch({ type: "SET_AI_ENABLED", enabled: next });
    toast(next ? "AI features enabled" : "AI features disabled", "info");
  }

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="settings-page"
    >
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Profile card */}
        <div className="settings-profile-card card">
          <div className="settings-avatar">{initials}</div>
          <div className="settings-profile-info">
            <span className="settings-profile-name">{user?.displayName || "User"}</span>
            <span className="settings-profile-email">{user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm settings-signout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        <div className="settings-grid">
          {/* Appearance */}
          <div className="card settings-section-card">
            <div className="settings-section-header">
              <span className="settings-section-icon"><Palette size={16} /></span>
              <span className="settings-section-title">Appearance</span>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Theme</div>
                <div className="settings-row-desc">
                  {theme === "dark" ? "Dark mode active" : "Light mode active"}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </button>
            </div>
          </div>

          {/* AI Features */}
          <div className="card settings-section-card">
            <div className="settings-section-header">
              <span className="settings-section-icon"><BrainCircuit size={16} /></span>
              <span className="settings-section-title">AI Features</span>
            </div>
            <div className="settings-row settings-row-toggle">
              <div>
                <div className="settings-row-label">Enable AI Assistance</div>
                <div className="settings-row-desc">
                  Story review, DSA hints, note summarizer, tag extractor — powered by Google Gemini
                </div>
              </div>
              <button
                className={`settings-toggle ${state.aiEnabled ? "on" : ""}`}
                onClick={toggleAI}
                aria-pressed={state.aiEnabled}
                title={state.aiEnabled ? "Disable AI" : "Enable AI"}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
            {state.aiEnabled && (
              <div className="settings-ai-active">
                <span className="settings-ai-dot" />
                AI assistance is active across the app
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className="card settings-section-card" style={{ gridColumn: "1 / -1" }}>
            <div className="settings-section-header">
              <span className="settings-section-icon"><Shield size={16} /></span>
              <span className="settings-section-title">Privacy</span>
            </div>
            <p className="settings-privacy-text">
              All data is stored in your private Firestore account under your Google identity.
              No data is shared with third parties. AI prompts are sent to Google Gemini only when
              AI features are enabled.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
