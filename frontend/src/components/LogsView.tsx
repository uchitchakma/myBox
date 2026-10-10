import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Terminal,
  FolderOpen,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Search,
  ArrowDownCircle,
  Play,
  Square,
  Layers,
  Activity,
} from "lucide-react";
import { ContainerItem, ContainerLogs } from "../types";
import { api } from "../api";

interface LogsViewProps {
  containers: ContainerItem[];
  onStart: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onRestart: (id: string) => Promise<void>;
}

export const LogsView: React.FC<LogsViewProps> = ({
  containers,
  onStart,
  onStop,
  onRestart,
}) => {
  // Selected process: "all" or specific container ID
  const [selectedId, setSelectedId] = useState<string>("all");
  const [logsData, setLogsData] = useState<ContainerLogs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tailLines, setTailLines] = useState<number>(500);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<"all" | "errors" | "server">("all");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPathCopied, setIsPathCopied] = useState<boolean>(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // If initial selected process is not set or invalid, select "all" or first container
  const activeContainer = useMemo(() => {
    if (selectedId === "all") return null;
    return containers.find((c) => c.id === selectedId) || null;
  }, [selectedId, containers]);

  // Fetch logs for currently selected process
  const fetchLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.getContainerLogs(selectedId, tailLines);
      setLogsData(data);
    } catch (err) {
      console.warn("Could not load logs for", selectedId, err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Poll logs live every 1500ms
  useEffect(() => {
    fetchLogs(false);
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 1500);
    return () => clearInterval(interval);
  }, [selectedId, tailLines]);

  // Auto-scroll to bottom if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logsData?.lines, autoScroll]);

  // Filter log lines based on search query and level filter
  const filteredLines = useMemo(() => {
    if (!logsData?.lines) return [];
    return logsData.lines.filter((line) => {
      const lower = line.toLowerCase();
      // Level filter
      if (levelFilter === "errors") {
        const isErr =
          lower.includes("[stderr]") ||
          lower.includes("error") ||
          lower.includes("err:") ||
          lower.includes("failed") ||
          lower.includes("⨯") ||
          lower.includes("exception");
        if (!isErr) return false;
      } else if (levelFilter === "server") {
        const isServer =
          lower.includes("ready") ||
          lower.includes("starting") ||
          lower.includes("http") ||
          lower.includes("200") ||
          lower.includes("port") ||
          lower.includes("compiled") ||
          lower.includes("✓");
        if (!isServer) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        return lower.includes(searchQuery.toLowerCase().trim());
      }

      return true;
    });
  }, [logsData?.lines, levelFilter, searchQuery]);

  // Copy all visible lines
  const handleCopyLogs = () => {
    if (filteredLines.length > 0) {
      navigator.clipboard.writeText(filteredLines.join("\n"));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Copy on-disk log file path
  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setIsPathCopied(true);
    setTimeout(() => setIsPathCopied(false), 2000);
  };

  // Clear logs
  const handleClearLogs = async () => {
    try {
      await api.clearContainerLogs(selectedId);
      setLogsData((prev) => (prev ? { ...prev, lines: [] } : null));
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  // Open log folder in Finder
  const handleOpenFolder = async () => {
    try {
      await api.openLogsFolder();
    } catch (err) {
      console.error("Failed to open logs folder:", err);
    }
  };

  // Line formatting and colorizer helper
  const renderLine = (line: string, index: number) => {
    const lower = line.toLowerCase();
    const isError =
      lower.includes("[stderr]") ||
      lower.includes("error") ||
      lower.includes("err:") ||
      lower.includes("failed") ||
      lower.includes("⨯");
    const isWarn = lower.includes("warn") || lower.includes("▲");
    const isSuccess =
      lower.includes("✓") ||
      lower.includes("ready") ||
      lower.includes("200") ||
      lower.includes("success");
    const isUrl = lower.includes("http://") || lower.includes("https://");

    return (
      <div
        key={index}
        className={`flex items-start py-0.5 px-2 rounded hover:bg-zinc-800/60 font-mono text-[11px] leading-relaxed transition-colors ${
          isError
            ? "text-rose-400 bg-rose-950/20"
            : isWarn
            ? "text-amber-300"
            : isSuccess
            ? "text-emerald-300"
            : isUrl
            ? "text-cyan-300"
            : "text-zinc-300"
        }`}
      >
        <span className="w-10 select-none text-zinc-600 text-right pr-3 shrink-0 font-mono text-[10px]">
          {index + 1}
        </span>
        <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
      </div>
    );
  };

  const currentLogPath = logsData?.log_file_path || `~/.mybox/logs/${selectedId}.log`;

  return (
    <div className="flex h-[calc(100vh-4rem)] p-4 gap-4 overflow-hidden select-none animate-fade-in">
      {/* LEFT SIDEBAR: Process List */}
      <div className="w-72 shrink-0 flex flex-col bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Processes & Services
            </span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20">
            {containers.length} Total
          </span>
        </div>

        {/* Process List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {/* 1. All Processes Aggregated Option */}
          <button
            onClick={() => setSelectedId("all")}
            className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border ${
              selectedId === "all"
                ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20 font-semibold"
                : "bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800/80"
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`p-1.5 rounded-lg ${
                  selectedId === "all"
                    ? "bg-white/20 text-white"
                    : "bg-brand-500/10 text-brand-500 dark:text-brand-400"
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold block truncate">All Processes</span>
                <span
                  className={`text-[10px] block truncate ${
                    selectedId === "all" ? "text-white/80" : "text-zinc-500"
                  }`}
                >
                  Aggregated Stream
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                selectedId === "all"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              All
            </span>
          </button>

          {/* 2. Individual Container / Process Items */}
          {containers.map((c) => {
            const isSelected = selectedId === c.id;
            const port = c.ports[0]?.public_port || c.ports[0]?.private_port;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`group p-2.5 rounded-xl border transition cursor-pointer flex flex-col space-y-2 ${
                  isSelected
                    ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                    : "bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        c.is_running
                          ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse"
                          : isSelected
                          ? "bg-white/40"
                          : "bg-zinc-400 dark:bg-zinc-600"
                      }`}
                    />
                    <span className="text-xs font-bold truncate block">{c.name}</span>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {c.short_id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-1.5">
                    {port && (
                      <span
                        className={`font-mono px-1 rounded ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-brand-500/10 text-brand-500 dark:text-brand-400"
                        }`}
                      >
                        :{port}
                      </span>
                    )}
                    <span
                      className={`truncate max-w-[90px] ${
                        isSelected ? "text-white/80" : "text-zinc-500"
                      }`}
                    >
                      {c.image.replace("native:", "")}
                    </span>
                  </div>

                  {/* Quick process controls */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {c.is_running ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestart(c.id);
                          }}
                          title="Restart Process"
                          className={`p-1 rounded transition ${
                            isSelected
                              ? "hover:bg-white/20 text-white"
                              : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStop(c.id);
                          }}
                          title="Stop Process"
                          className={`p-1 rounded transition ${
                            isSelected
                              ? "hover:bg-white/20 text-white"
                              : "hover:bg-red-500/20 text-red-500"
                          }`}
                        >
                          <Square className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStart(c.id);
                        }}
                        title="Start Process"
                        className={`p-1 rounded transition ${
                          isSelected
                            ? "hover:bg-white/20 text-white"
                            : "hover:bg-emerald-500/20 text-emerald-500"
                        }`}
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Open logs folder */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          <button
            onClick={handleOpenFolder}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-medium text-xs transition shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5 text-brand-500" />
            <span>Open ~/.mybox/logs</span>
          </button>
        </div>
      </div>

      {/* RIGHT MAIN PANEL: Console Terminal & Controls */}
      <div className="flex-1 flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Top Console Bar */}
        <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {/* Active Target Header */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-brand-400" />
              <span className="font-bold text-xs text-white">
                {selectedId === "all"
                  ? "All Processes Combined"
                  : activeContainer?.name || selectedId}
              </span>

              {activeContainer && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    activeContainer.is_running
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {activeContainer.status}
                </span>
              )}
            </div>
          </div>

          {/* Actions & Filters */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter logs..."
                className="pl-8 pr-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-500 w-36 transition"
              />
            </div>

            {/* Level Filter Pills */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setLevelFilter("all")}
                className={`px-2 py-0.5 rounded ${
                  levelFilter === "all"
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLevelFilter("errors")}
                className={`px-2 py-0.5 rounded ${
                  levelFilter === "errors"
                    ? "bg-rose-500/20 text-rose-300 font-semibold"
                    : "text-zinc-400 hover:text-rose-400"
                }`}
              >
                Errors
              </button>
              <button
                onClick={() => setLevelFilter("server")}
                className={`px-2 py-0.5 rounded ${
                  levelFilter === "server"
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                    : "text-zinc-400 hover:text-emerald-400"
                }`}
              >
                Server
              </button>
            </div>

            {/* Tail lines selector */}
            <select
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-brand-500"
            >
              <option value={100}>100 lines</option>
              <option value={250}>250 lines</option>
              <option value={500}>500 lines</option>
              <option value={1000}>1000 lines</option>
            </select>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? "Auto-scroll Enabled" : "Auto-scroll Paused"}
              className={`p-1.5 rounded-lg border text-xs transition flex items-center space-x-1 ${
                autoScroll
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300"
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Auto-scroll</span>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopyLogs}
              title="Copy visible log output to clipboard"
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition flex items-center space-x-1"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied" : "Copy"}</span>
            </button>

            {/* Clear logs button */}
            <button
              onClick={handleClearLogs}
              title="Clear logs for this process"
              className="p-1.5 bg-zinc-950 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Refresh button */}
            <button
              onClick={() => fetchLogs(false)}
              title="Refresh logs"
              disabled={isLoading}
              className="p-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Persistent Disk File Banner */}
        <div className="px-4 py-1.5 bg-black/50 border-b border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-zinc-500 font-mono">📁 File:</span>
            <code className="font-mono text-emerald-400 truncate select-all">{currentLogPath}</code>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleCopyPath(currentLogPath)}
              className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition flex items-center space-x-1"
            >
              {isPathCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{isPathCopied ? "Path Copied" : "Copy Path"}</span>
            </button>
            <span className="text-zinc-600">|</span>
            <span className="text-[10px] text-zinc-500">{filteredLines.length} lines</span>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="flex-1 p-3 overflow-y-auto bg-black font-mono select-text">
          {filteredLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 py-16">
              <Terminal className="w-8 h-8 text-zinc-700 animate-pulse" />
              <p className="text-xs font-semibold text-zinc-400">
                {searchQuery || levelFilter !== "all"
                  ? "No log entries match your current search/filter."
                  : "No output received yet for this process."}
              </p>
              <p className="text-[11px] text-zinc-600 max-w-sm text-center">
                Logs stream live as requests arrive. You can also inspect the physical file at{" "}
                <code className="text-zinc-400 select-all">{currentLogPath}</code>.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredLines.map((line, idx) => renderLine(line, idx))}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
