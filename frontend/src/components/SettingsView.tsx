import React, { useState } from "react";
import { Settings, Save, Palette, Sun, Moon } from "lucide-react";
import { AppConfig } from "../types";

interface SettingsViewProps {
  config: AppConfig | null;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onSaveConfig: (config: AppConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  theme = "dark",
  onToggleTheme,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<AppConfig>(
    config || {
      auto_refresh_interval_secs: 3,
      enable_notifications: true,
      primary_color: "#C5453E",
      dark_mode: true,
      log_tail_lines: 100,
    }
  );
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] max-w-3xl transition-colors duration-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Engine Sockets */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-brand-500 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Engine Configuration</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Custom Socket Path (Optional override)
              </label>
              <input
                type="text"
                value={formData.custom_socket_path || ""}
                onChange={(e) =>
                  setFormData({ ...formData, custom_socket_path: e.target.value })
                }
                placeholder="unix:///var/run/mybox.sock or custom socket"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-mono placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition shadow-sm"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Leave empty for automatic auto-detection of local myBox Hypervisor & container sockets.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Auto-Refresh Interval (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.auto_refresh_interval_secs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    auto_refresh_interval_secs: parseInt(e.target.value) || 3,
                  })
                }
                className="w-32 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand-500 transition shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Appearance & Branding */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-brand-500 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Appearance & Theme</h3>
          </div>

          <div className="space-y-4">
            {/* Dark/Light Mode Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Interface Color Theme
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== "light" && onToggleTheme) onToggleTheme();
                  }}
                  className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border text-xs font-semibold transition ${
                    theme === "light"
                      ? "bg-brand-500/10 border-brand-500 text-brand-600 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (theme !== "dark" && onToggleTheme) onToggleTheme();
                  }}
                  className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border text-xs font-semibold transition ${
                    theme === "dark"
                      ? "bg-brand-500/10 border-brand-500 text-brand-400 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Primary Brand Color
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-7 h-7 rounded-lg border border-zinc-300 dark:border-zinc-700 shadow-sm"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_color: e.target.value })
                  }
                  className="w-36 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-brand-500 transition shadow-sm"
                />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  (Default: #C5453E - Official UCDREAMS Crimson)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center space-x-3">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/25 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? "Settings Saved!" : "Save Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
