import React from "react";
import { Server, ShieldCheck, Zap } from "lucide-react";
import { SystemMetrics } from "../types";

interface StatsViewProps {
  metrics: SystemMetrics | null;
}

export const StatsView: React.FC<StatsViewProps> = ({ metrics }) => {
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] transition-colors duration-200">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Zero-Idle Resource Footprint
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              myBox utilizes native hypervisors and releases memory back to the host when idle.
            </p>
          </div>
        </div>
      </div>

      {/* Hardware & Runtime Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Host Machine Diagnostics */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-brand-500 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Host Machine Specifications</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Operating System</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {metrics?.host_os || "macOS / Linux / Windows"}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Architecture</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {metrics?.host_arch || "aarch64 / x86_64"}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">CPU Hardware Cores</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {metrics?.cpu_cores || 8} Active Cores
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Host RAM Capacity</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {metrics?.total_memory_mb || 16384} MB
              </span>
            </div>
          </div>
        </div>

        {/* Runtime Engine Details */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Container Runtime Diagnostics</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Connected Runtime</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {metrics?.engine_status.engine_type || "myBox Native Engine"}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Server Engine Version</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {metrics?.engine_status.server_version || "0.1.0"}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">API Standard Version</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {metrics?.engine_status.api_version || "1.47"}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">Socket Endpoint</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[10px] truncate max-w-xs">
                {metrics?.engine_status.socket_path || "unix:///var/run/mybox.sock"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
