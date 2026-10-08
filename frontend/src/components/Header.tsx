import React from "react";
import { RefreshCw, Trash2, Github, CheckCircle2, AlertCircle, Rocket, Sun, Moon } from "lucide-react";
import { SystemMetrics } from "../types";

interface HeaderProps {
  currentTab: string;
  metrics: SystemMetrics | null;
  onRefresh: () => void;
  onPrune: () => void;
  onOpenLaunchModal: () => void;
  isRefreshing: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  metrics,
  onRefresh,
  onPrune,
  onOpenLaunchModal,
  isRefreshing,
  theme = "dark",
  onToggleTheme,
}) => {
  const titles: Record<string, { title: string; desc: string }> = {
    dashboard: {
      title: "Overview",
      desc: "Live system resources & active containers",
    },
    containers: {
      title: "Containers",
      desc: "Manage running and stopped application containers",
    },
    images: {
      title: "Images",
      desc: "Locally cached container images and layers",
    },
    volumes: {
      title: "Volumes",
      desc: "Persistent storage volumes and directory mounts",
    },
    stats: {
      title: "System Diagnostics",
      desc: "Real-time host CPU, RAM, and hardware metrics",
    },
    settings: {
      title: "Settings",
      desc: "Preferences, engine sockets, and appearance",
    },
  };

  const current = titles[currentTab] || {
    title: "myBox",
    desc: "Container Management",
  };

  const isConnected = metrics?.engine_status.connected ?? false;

  return (
    <header data-tauri-drag-region className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/60 backdrop-blur px-6 flex items-center justify-between select-none transition-colors duration-200">
      <div data-tauri-drag-region>
        <h1 data-tauri-drag-region className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
          {current.title}
        </h1>
        <p data-tauri-drag-region className="text-xs text-zinc-500 dark:text-zinc-400">{current.desc}</p>
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Runtime Status Badge */}
        {isConnected ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{metrics?.engine_status.engine_type || "Engine Ready"}</span>
          </div>
        ) : (
          <button
            onClick={async () => {
              try {
                await import("../api").then(m => m.api.startNativeEngine());
                onRefresh();
              } catch (e) {
                console.error(e);
              }
            }}
            title="Click to start the engine"
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 transition cursor-pointer shadow-sm animate-pulse"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Start Engine</span>
          </button>
        )}

        {/* Launch Project Button */}
        <button
          onClick={onOpenLaunchModal}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-md shadow-brand-500/20 transition"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Launch Project</span>
        </button>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
            )}
          </button>
        )}

        {/* Action Buttons */}
        <button
          onClick={onPrune}
          title="Clean up unused images & containers"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
          <span>Prune</span>
        </button>

        <button
          onClick={onRefresh}
          title="Refresh metrics"
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand-500 dark:text-brand-400" : ""}`}
          />
        </button>

        <a
          href="https://github.com/uchitchakma/myBox"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition hover:text-zinc-900 dark:hover:text-white"
        >
          <Github className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
