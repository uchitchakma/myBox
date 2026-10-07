import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  Folder,
  FolderOpen,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Database,
  Code,
  Globe,
  Layers,
  FileCode2,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Terminal,
  Trash2,
} from "lucide-react";
import { api } from "../api";
import { DetectedProject } from "../types";

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
  const [projectType, setProjectType] = useState("auto");
  const [port, setPort] = useState(3000);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isUnboxing, setIsUnboxing] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedProject, setDetectedProject] = useState<DetectedProject | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [activeView, setActiveView] = useState<"auto" | "presets" | "yaml">("auto");
  const [yamlContent, setYamlContent] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUnboxConfirm, setShowUnboxConfirm] = useState(false);

  // Manual fallback presets
  const presets = [
    {
      id: "fullstack",
      title: "Fullstack + PostgreSQL",
      desc: "Node.js / Next.js app + PostgreSQL 16 DB with persistent storage",
      icon: Database,
      defaultPort: 3000,
      badge: "Popular",
    },
    {
      id: "node",
      title: "Node.js / React / Next",
      desc: "Ultra-lightweight Node.js 20 (Alpine) runtime",
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
    {
      id: "rust",
      title: "Rust / Axum / Actix",
      desc: "Rust 1.77 Alpine high-performance native binary runtime",
      icon: Terminal,
      defaultPort: 8080,
    },
    {
      id: "go",
      title: "Go (Golang) Microservice",
      desc: "Golang 1.22 Alpine microservice sandbox",
      icon: Code,
      defaultPort: 8080,
    },
  ];

  // Auto-Detect project whenever path changes
  const runDetection = useCallback(async (path: string) => {
    if (!path.trim()) {
      setDetectedProject(null);
      return;
    }
    setIsDetecting(true);
    try {
      const detected = await api.detectProject(path.trim());
      setDetectedProject(detected);
      setPort(detected.default_port);
      setYamlContent(detected.generated_yaml);
      setProjectType("auto");
      setActiveView("auto");
    } catch (err) {
      console.warn("Detection error:", err);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  useEffect(() => {
    if (projectPath) {
      const timeout = setTimeout(() => {
        runDetection(projectPath);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [projectPath, runDetection]);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    try {
      setIsBrowsing(true);
      const selected = await api.selectFolder();
      if (selected) {
        setProjectPath(selected);
        runDetection(selected);
      }
    } catch (err) {
      console.error("Failed to open directory dialog:", err);
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleResetDetection = () => {
    setShowResetConfirm(false);
    if (projectPath) {
      runDetection(projectPath);
      setStatusMessage("🔄 Re-scanned and reset project configuration.");
      setIsError(false);
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleUnbox = async () => {
    if (!projectPath.trim()) {
      setStatusMessage("Please select a project folder to unbox.");
      setIsError(true);
      return;
    }

    setIsUnboxing(true);
    setStatusMessage("🗑 De-containerizing project, stopping containers & removing mybox.yaml...");
    setIsError(false);

    try {
      const res = await api.removeProject(projectPath.trim(), true);
      setStatusMessage(res || "✓ De-containerized successfully and removed mybox.yaml.");
      setShowUnboxConfirm(false);
      setTimeout(() => {
        setIsUnboxing(false);
        onLaunchSuccess();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setIsError(true);
      setStatusMessage(
        err instanceof Error ? err.message : String(err) || "Failed to de-containerize project."
      );
      setIsUnboxing(false);
      setShowUnboxConfirm(false);
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectPath.trim()) {
      setStatusMessage("Please select or enter your project folder path.");
      setIsError(true);
      return;
    }

    setIsLaunching(true);
    setStatusMessage("⚡ Auto-configuring sandbox & launching project in myBox...");
    setIsError(false);

    try {
      // If user modified YAML, save it first
      if (yamlContent.trim()) {
        try {
          await api.saveProjectYaml(projectPath.trim(), yamlContent);
        } catch {
          // fallback if direct write
        }
      }

      const launchType = activeView === "presets" ? projectType : (detectedProject?.framework_id || "fullstack");
      const msg = await onLaunch(projectPath.trim(), launchType, port);
      setStatusMessage(msg || "✓ Project launched successfully in myBox!");
      setIsError(false);
      setTimeout(() => {
        setIsLaunching(false);
        onLaunchSuccess();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setIsError(true);
      setStatusMessage(
        err instanceof Error ? err.message : String(err) || "Failed to launch project."
      );
      setIsLaunching(false);
    }
  };

  const hasExistingConfig =
    detectedProject?.framework_id === "custom_mybox" ||
    detectedProject?.detected_files.some(f => f.includes("mybox"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Launch & Containerize Project
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  Auto-Detect Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Supports Next.js, Django, FastAPI, React, Laravel, Rust, Go, Flutter, .NET, Spring & more
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

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 pt-3 border-b border-zinc-800/60 bg-zinc-950 text-xs">
          <button
            type="button"
            onClick={() => setActiveView("auto")}
            className={`px-3.5 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeView === "auto"
                ? "border-brand-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Auto-Detected Stack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("presets")}
            className={`px-3.5 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeView === "presets"
                ? "border-brand-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("yaml")}
            className={`px-3.5 py-2 font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeView === "yaml"
                ? "border-brand-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Inspect & Edit mybox.yaml</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLaunch} className="p-6 space-y-5 text-xs text-zinc-300 overflow-y-auto flex-1">
          {/* Folder Path Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-zinc-200">
                Project Folder Path
              </label>
              <div className="flex items-center space-x-2">
                {projectPath && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 text-[11px] transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isDetecting ? "animate-spin text-brand-400" : ""}`} />
                      <span>Re-Scan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUnboxConfirm(true)}
                      className="flex items-center space-x-1 text-red-400 hover:text-red-300 text-[11px] transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Unbox Project</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  disabled={isBrowsing}
                  className="flex items-center space-x-1 text-brand-400 hover:text-brand-300 text-[11px] font-medium transition cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>{isBrowsing ? "Opening Finder..." : "Browse Finder..."}</span>
                </button>
              </div>
            </div>
            <div className="relative flex items-center">
              <Folder className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="/Users/uchitchakma/Projects/my-app"
                className="w-full pl-9 pr-28 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition font-mono"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                disabled={isBrowsing}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 text-[11px] font-medium transition flex items-center space-x-1.5 shadow-sm"
              >
                <FolderOpen className="w-3.5 h-3.5 text-brand-400" />
                <span>Select</span>
              </button>
            </div>
          </div>

          {/* View 1: Auto-Detected Stack */}
          {activeView === "auto" && (
            <div className="space-y-3">
              {isDetecting ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col items-center justify-center space-y-2 text-center animate-pulse">
                  <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
                  <p className="text-xs font-semibold text-zinc-200">
                    Scanning project structure & package manifests...
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Identifying frameworks, ports, multi-tier services, and database dependencies
                  </p>
                </div>
              ) : detectedProject ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 via-zinc-900/60 to-zinc-900/40 border border-brand-500/30 shadow-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-500/30">
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-white">
                            {detectedProject.name}
                          </h3>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold">
                            Auto-Detected
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {detectedProject.description}
                        </p>
                      </div>
                    </div>

                    {hasExistingConfig && (
                      <button
                        type="button"
                        onClick={() => setShowUnboxConfirm(true)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[11px] font-semibold flex items-center space-x-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>De-containerize</span>
                      </button>
                    )}
                  </div>

                  {/* Detected Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800/60 text-[11px]">
                    <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                      <span className="text-zinc-500 block text-[10px]">Category</span>
                      <span className="font-semibold text-zinc-200">{detectedProject.category}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                      <span className="text-zinc-500 block text-[10px]">Container Image</span>
                      <span className="font-mono text-zinc-200 truncate block">{detectedProject.runtime_image}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                      <span className="text-zinc-500 block text-[10px]">Start Command</span>
                      <span className="font-mono text-brand-300 truncate block">{detectedProject.start_command}</span>
                    </div>
                  </div>

                  {/* Services breakdown if multi-service */}
                  {detectedProject.services && detectedProject.services.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Orchestrated Services ({detectedProject.services.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detectedProject.services.map((svc) => (
                          <div key={svc.name} className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-zinc-200 block">{svc.name}</span>
                              <span className="text-[10px] text-zinc-500">{svc.role}</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              Port {svc.port}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-1.5">
                  <Sparkles className="w-5 h-5 text-zinc-500 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-300">
                    Select a project directory above
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    myBox will automatically detect whether it's Next.js, Django, FastAPI, React, Laravel, Rails, Rust, etc.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* View 2: Manual Presets */}
          {activeView === "presets" && (
            <div className="space-y-2">
              <label className="block font-semibold text-zinc-200">
                Choose Manual Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = projectType === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => {
                        setProjectType(preset.id);
                        setPort(preset.defaultPort);
                      }}
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
          )}

          {/* View 3: Inspect & Edit YAML */}
          {activeView === "yaml" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-zinc-200">
                  mybox.yaml Configuration Editor
                </label>
                <span className="text-[10px] text-zinc-500">
                  Direct live edit of sandbox container config
                </span>
              </div>
              <textarea
                rows={10}
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                placeholder="# Generated mybox.yaml configuration"
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-brand-500 leading-relaxed resize-y"
              />
            </div>
          )}

          {/* Port Config */}
          <div className="flex items-center space-x-4 pt-1">
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-200">
                Host Listening Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 3000)}
                className="w-32 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500 font-mono transition"
              />
            </div>
            <div className="pt-5 text-[11px] text-zinc-500">
              Access your container at <code className="text-brand-400">http://localhost:{port}</code>
            </div>
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

          {/* Reset Confirmation Overlay */}
          {showResetConfirm && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Re-scan directory and reset all customizations?</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDetection}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-semibold"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}

          {/* Unbox / De-containerize Confirmation Overlay */}
          {showUnboxConfirm && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-red-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-red-400">
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Stop all containers and delete mybox.yaml?</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUnboxConfirm(false)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUnbox}
                  disabled={isUnboxing}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 font-semibold"
                >
                  {isUnboxing ? "Unboxing..." : "Confirm Unbox"}
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
            <a
              href="https://github.com/uchitchakma/myBox/blob/main/docs/HOW_IT_WORKS.md"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-[11px] text-zinc-500 hover:text-brand-400 transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Framework Support Docs</span>
            </a>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLaunching || isUnboxing}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/30 transition disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isLaunching ? "animate-spin" : ""}`} />
                <span>{isLaunching ? "Launching..." : "Launch in myBox"}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
