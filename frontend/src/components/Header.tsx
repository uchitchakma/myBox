import React from "react";
import { RefreshCw, Trash2, Github, CheckCircle2, AlertCircle, Rocket } from "lucide-react";
import { SystemMetrics } from "../types";

interface HeaderProps {
  currentTab: string;
  metrics: SystemMetrics | null;
  onRefresh: () => void;
  onPrune: () => void;
  onOpenLaunchModal: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  metrics,
  onRefresh,
  onPrune,
  onOpenLaunchModal,
  isRefreshing,
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
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur px-6 flex items-center justify-between select-none">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">
          {current.title}
        </h1>
        <p className="text-xs text-zinc-400">{current.desc}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Runtime Status Badge / 1-Click Engine Starter */}
        {isConnected ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{metrics?.engine_status.engine_type || "Connected"}</span>
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
            title="Click to start the native myBox hypervisor engine"
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 transition cursor-pointer shadow-sm animate-pulse"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Start Native myBox Engine</span>
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

        {/* Action Buttons */}
        <button
          onClick={onPrune}
          title="Clean up unused images & containers"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 border border-zinc-800 transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-brand-400" />
          <span>Prune</span>
        </button>

        <button
          onClick={onRefresh}
          title="Refresh metrics"
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand-400" : ""}`}
          />
        </button>

        <a
          href="https://github.com/uchitchakma/myBox"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition hover:text-white"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
