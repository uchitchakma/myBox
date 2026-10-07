import React from "react";
import {
  Cpu,
  HardDrive,
  Box,
  Layers,
  Play,
  Square,
  FileText,
  Terminal,
  Rocket,
  Globe,
  ExternalLink,
} from "lucide-react";
import { ContainerItem, SystemMetrics, groupContainers } from "../types";
import { api } from "../api";

interface DashboardProps {
  metrics: SystemMetrics | null;
  containers: ContainerItem[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onOpenLogs: (container: ContainerItem) => void;
  onNavigateTab: (tab: string) => void;
  onOpenLaunchModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  containers,
  onStart,
  onStop,
  onOpenLogs,
  onNavigateTab,
  onOpenLaunchModal,
}) => {
  const cpuPercent = metrics?.cpu_usage_percent ?? 0;
  const ramPercent = metrics?.memory_usage_percent ?? 0;
  const activeCount = metrics?.active_containers ?? 0;
  const totalCount = metrics?.total_containers ?? 0;
  const totalImages = metrics?.total_images ?? 0;
  const totalVolumes = metrics?.total_volumes ?? 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">HOST CPU</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{cpuPercent}%</span>
            <span className="text-xs text-zinc-400">
              {metrics?.cpu_cores || 4} cores
            </span>
          </div>
          <div className="mt-3 w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(cpuPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory Card */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">HOST MEMORY</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{ramPercent}%</span>
            <span className="text-xs text-zinc-400">
              {metrics?.used_memory_mb || 0} / {metrics?.total_memory_mb || 0} MB
            </span>
          </div>
          <div className="mt-3 w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(ramPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Containers Card */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">CONTAINERS</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">{activeCount}</span>
            <span className="text-xs text-zinc-400">active / {totalCount} total</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Stopped: {totalCount - activeCount}</span>
            <button
              onClick={() => onNavigateTab("containers")}
              className="text-brand-400 hover:text-brand-300 font-semibold"
            >
              View all →
            </button>
          </div>
        </div>

        {/* Images & Storage Card */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">STORAGE & IMAGES</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{totalImages}</span>
            <span className="text-xs text-zinc-400">images • {totalVolumes} volumes</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Zero-bloat caching</span>
            <button
              onClick={() => onNavigateTab("images")}
              className="text-brand-400 hover:text-brand-300 font-semibold"
            >
              Inspect →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launch & Active Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Container Status List (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Active & Recent Containers
              </h2>
              <p className="text-xs text-zinc-400">Instant lifecycle control</p>
            </div>
            <button
              onClick={() => onNavigateTab("containers")}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              See all ({containers.length})
            </button>
          </div>

          {containers.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/10">
                <Rocket className="w-6 h-6 text-brand-400" />
              </div>
              <p className="text-sm font-bold text-white">No containers running</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Containerize and run any project folder with 1-click presets or standard mybox.yaml.
              </p>
              <button
                onClick={onOpenLaunchModal}
                className="mt-4 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/30 transition transform hover:-translate-y-0.5"
              >
                <Rocket className="w-4 h-4" />
                <span>Launch & Containerize Project</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {groupContainers(containers).slice(0, 5).map((g) => {
                const isRunning = g.is_running;
                const primaryService = g.services[0];

                const handlePlay = () => {
                  g.services.forEach((s) => {
                    if (!s.is_running) onStart(s.id);
                  });
                };

                const handleStop = () => {
                  g.services.forEach((s) => {
                    if (s.is_running) onStop(s.id);
                  });
                };

                const webPort =
                  g.ports.find((p) => (p.public_port || p.private_port) === 3000) ||
                  g.ports.find((p) => (p.public_port || p.private_port) === 5173) ||
                  g.ports.find((p) => (p.public_port || p.private_port) === 80) ||
                  g.ports.find((p) => (p.public_port || p.private_port) === 8000) ||
                  g.ports.find((p) => (p.public_port || p.private_port) === 8080) ||
                  g.ports[0];
                const targetUrl = webPort
                  ? `http://localhost:${webPort.public_port || webPort.private_port}`
                  : null;

                return (
                  <div
                    key={g.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 transition gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          isRunning ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-zinc-600"
                        }`}
                      />
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {g.projectName}
                          </span>
                          {g.isGroup ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
                              Stack ({g.services.length} services)
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                              {primaryService.short_id}
                            </span>
                          )}

                          {/* Quick clickable port pills */}
                          {isRunning &&
                            g.ports.map((p, idx) => {
                              const portNum = p.public_port || p.private_port;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => api.openBrowser(`http://localhost:${portNum}`)}
                                  title={`Open http://localhost:${portNum} in Browser`}
                                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700/60 text-[10px] font-mono transition"
                                >
                                  <span>:{portNum}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </button>
                              );
                            })}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{g.image}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <span className="text-[11px] text-zinc-400 mr-2 hidden md:inline">
                        {g.status}
                      </span>

                      {/* Prominent Open Website Button */}
                      {isRunning && targetUrl && (
                        <button
                          onClick={() => api.openBrowser(targetUrl)}
                          title={`Open ${targetUrl} in Browser`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition transform hover:-translate-y-0.5"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Open Website</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenLogs(primaryService)}
                        title="View logs"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {isRunning ? (
                        <button
                          onClick={handleStop}
                          title={g.isGroup ? "Stop entire stack" : "Stop container"}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={handlePlay}
                          title={g.isGroup ? "Play & Run entire stack" : "Start container"}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition font-bold text-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {g.isGroup && <span>Run All</span>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* System & CLI Helper (1 col) */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Terminal className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">myBox CLI Shortcuts</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Headless server and terminal commands:
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex justify-between">
                <span>mybox init</span>
                <span className="text-zinc-500"># auto-detect</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex justify-between">
                <span>mybox up</span>
                <span className="text-zinc-500"># start sandbox</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex justify-between">
                <span>mybox unbox</span>
                <span className="text-zinc-500"># stop & remove</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex justify-between">
                <span>mybox ps</span>
                <span className="text-zinc-500"># list active</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Host Machine:</span>
              <span className="text-zinc-200 font-semibold">
                {metrics?.host_os || "Linux/Mac"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
              <span>Socket:</span>
              <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[140px]">
                {metrics?.engine_status.socket_path || "Default"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
