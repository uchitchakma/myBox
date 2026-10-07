import React, { useState } from "react";
import { X, Sparkles, Folder, Rocket, CheckCircle2, AlertCircle, Database, Code, Globe, Layers } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchSuccess: () => void;
  onLaunch: (path: string, type: string, port: number) => Promise<string>;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onLaunchSuccess,
  onLaunch,
}) => {
  const [projectPath, setProjectPath] = useState("");
  const [projectType, setProjectType] = useState("fullstack");
  const [port, setPort] = useState(3000);
  const [isLaunching, setIsLaunching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      id: "fullstack",
      title: "Fullstack + Database",
      desc: "Node.js app + PostgreSQL 16 DB with persistent storage",
      icon: Database,
      defaultPort: 3000,
      badge: "Popular",
    },
    {
      id: "node",
      title: "Node.js / React / Next",
      desc: "Ultra-lightweight Node.js (Alpine) runtime",
      icon: Code,
      defaultPort: 3000,
    },
    {
      id: "python",
      title: "Python / FastAPI / Django",
      desc: "Python 3.12 (Slim) with pip requirements auto-install",
      icon: Layers,
      defaultPort: 8000,
    },
    {
      id: "php",
      title: "PHP / WordPress / Laravel",
      desc: "PHP 8.3 + Apache web server container",
      icon: Globe,
      defaultPort: 8080,
    },
  ];

  const handleSelectPreset = (id: string, defaultPort: number) => {
    setProjectType(id);
    setPort(defaultPort);
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectPath.trim()) {
      setStatusMessage("Please provide your project folder path.");
      setIsError(true);
      return;
    }

    setIsLaunching(true);
    setStatusMessage("⚡ Auto-configuring container & launching project...");
    setIsError(false);

    try {
      const msg = await onLaunch(projectPath.trim(), projectType, port);
      setStatusMessage(msg || "✓ Project launched successfully in myBox!");
      setIsError(false);
      setTimeout(() => {
        setIsLaunching(false);
        onLaunchSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setIsError(true);
      setStatusMessage(
        err instanceof Error ? err.message : String(err) || "Failed to launch project."
      );
      setIsLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Launch & Containerize Project
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  1-Click
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Auto-generates myBox configuration and runs isolated containers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLaunch} className="p-6 space-y-5 text-xs text-zinc-300">
          {/* Folder Path */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-zinc-200">
              Project Folder Path
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="/Users/uchitchakma/Projects/my-app"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Select your local project directory. If no <code>mybox.yml</code> or <code>Dockerfile</code> is found, myBox creates it automatically.
            </p>
          </div>

          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="block font-semibold text-zinc-200">
              Tech Stack Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = projectType === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id, preset.defaultPort)}
                    className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between ${
                      isSelected
                        ? "bg-brand-500/10 border-brand-500 text-white shadow-sm shadow-brand-500/20"
                        : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-brand-400" : "text-zinc-400"}`} />
                        <span className="font-bold text-xs">{preset.title}</span>
                      </div>
                      {preset.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500 text-white font-bold">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Port Config */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-zinc-200">
              Application Port
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 3000)}
              className="w-32 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500 font-mono transition"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-medium border ${
                isError
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-brand-500/10 text-brand-300 border-brand-500/20"
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-400 animate-pulse" />
              )}
              <span className="truncate">{statusMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLaunching}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/30 transition disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isLaunching ? "animate-spin" : ""}`} />
              <span>{isLaunching ? "Launching..." : "Launch in myBox"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
