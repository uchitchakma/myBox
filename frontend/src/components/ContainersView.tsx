import React, { useState } from "react";
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  FileText,
  Search,
  Box,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ContainerItem, groupContainers, ContainerGroup } from "../types";
import { api } from "../api";

interface ContainersViewProps {
  containers: ContainerItem[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onRemove: (id: string, force?: boolean) => void;
  onOpenLogs: (container: ContainerItem) => void;
}

export const ContainersView: React.FC<ContainersViewProps> = ({
  containers,
  onStart,
  onStop,
  onRestart,
  onRemove,
  onOpenLogs,
}) => {
  const [filter, setFilter] = useState<"all" | "running" | "stopped">("all");
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartGroup = (group: ContainerGroup) => {
    group.services.forEach((s) => {
      if (!s.is_running) onStart(s.id);
    });
  };

  const handleStopGroup = (group: ContainerGroup) => {
    group.services.forEach((s) => {
      if (s.is_running) onStop(s.id);
    });
  };

  const handleRestartGroup = (group: ContainerGroup) => {
    group.services.forEach((s) => onRestart(s.id));
  };

  const handleRemoveGroup = (group: ContainerGroup) => {
    group.services.forEach((s) => onRemove(s.id, true));
  };

  const allGroups = groupContainers(containers);

  const filteredGroups = allGroups.filter((g) => {
    if (filter === "running" && !g.is_running) return false;
    if (filter === "stopped" && g.is_running) return false;
    if (
      search &&
      !g.projectName.toLowerCase().includes(search.toLowerCase()) &&
      !g.image.toLowerCase().includes(search.toLowerCase()) &&
      !g.services.some((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const totalRunning = containers.filter((c) => c.is_running).length;
  const totalStopped = containers.filter((c) => !c.is_running).length;

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-4rem)] transition-colors duration-200">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search containers or stacks..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === "all"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All ({allGroups.length})
          </button>
          <button
            onClick={() => setFilter("running")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === "running"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Running ({totalRunning})
          </button>
          <button
            onClick={() => setFilter("stopped")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === "stopped"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Stopped ({totalStopped})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No containers or stacks match your criteria
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Launch a new project or adjust your filter.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">APPLICATION & SERVICES</th>
                <th className="px-5 py-3.5">STACK / IMAGE</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5">PORT MAPPINGS</th>
                <th className="px-5 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredGroups.map((g) => {
                const isExpanded = expandedGroups[g.key] ?? true;

                if (g.isGroup) {
                  return (
                    <React.Fragment key={g.key}>
                      {/* Master Project Stack Row */}
                      <tr className="bg-zinc-50/80 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/70 transition-colors duration-150 border-l-2 border-l-brand-500">
                        {/* Master Name & ID */}
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-2.5">
                            <button
                              onClick={() => toggleGroup(g.key)}
                              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                g.is_running ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"
                              }`}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-sm text-zinc-900 dark:text-white block">
                                  {g.projectName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 text-[10px] font-semibold">
                                  Stack ({g.services.length} services)
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                Unified Application Sandbox
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stack Label */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-[11px] shadow-sm">
                            {g.image}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              g.is_running
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-transparent"
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>

                        {/* Combined Ports */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {g.ports.map((p, idx) => {
                              const pNum = p.public_port || p.private_port;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => api.openBrowser(`http://localhost:${pNum}`)}
                                  title={`Open http://localhost:${pNum} in Browser`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-brand-500 dark:text-brand-400 border border-zinc-200 dark:border-zinc-800 hover:border-brand-500/40 text-[10px] font-mono transition shadow-sm"
                                >
                                  <span>:{pNum}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Master Actions (Plays/Stops all services in 1-click) */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onOpenLogs(g.services[0])}
                              title="View Application Logs"
                              className="p-2 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent transition shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {g.is_running ? (
                              <>
                                <button
                                  onClick={() => handleRestartGroup(g)}
                                  title="Restart Entire Application Stack"
                                  className="p-2 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent transition shadow-sm"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleStopGroup(g)}
                                  title="Stop Entire Application Stack"
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition"
                                >
                                  <Square className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleStartGroup(g)}
                                title="Play and Run All Services (1-Click)"
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition font-bold"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Run All</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleRemoveGroup(g)}
                              title="Remove Application Stack"
                              className="p-2 rounded-lg bg-white hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-500/20 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-200 dark:border-transparent transition shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-Service Rows (Indented) */}
                      {isExpanded &&
                        g.services.map((c) => {
                          return (
                            <tr
                              key={c.id}
                              className="bg-zinc-100/50 dark:bg-zinc-950/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/30 transition-colors duration-150"
                            >
                              <td className="px-5 py-2.5 pl-12">
                                <div className="flex items-center space-x-2.5">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      c.is_running ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                                    }`}
                                  />
                                  <div>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                                      {c.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-zinc-500">
                                      {c.short_id}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-2.5">
                                <span className="font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-[10px]">
                                  {c.image}
                                </span>
                              </td>

                              <td className="px-5 py-2.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${
                                    c.is_running
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>

                              <td className="px-5 py-2.5">
                                <div className="flex flex-wrap gap-1">
                                  {c.ports.map((p, idx) => {
                                    const pNum = p.public_port || p.private_port;
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => api.openBrowser(`http://localhost:${pNum}`)}
                                        title={`Open http://localhost:${pNum} in Browser`}
                                        className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-brand-500 dark:text-brand-400 border border-zinc-200 dark:border-zinc-800 hover:border-brand-500/40 text-[10px] font-mono transition shadow-sm"
                                      >
                                        <span>:{pNum}</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>

                              <td className="px-5 py-2.5 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => onOpenLogs(c)}
                                    title="Service Logs"
                                    className="p-1.5 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-200 dark:border-transparent transition shadow-sm"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </button>
                                  {c.is_running ? (
                                    <button
                                      onClick={() => onStop(c.id)}
                                      title="Stop Service"
                                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition"
                                    >
                                      <Square className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onStart(c.id)}
                                      title="Start Service"
                                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition"
                                    >
                                      <Play className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                }

                // Standalone Single Container Row
                const c = g.services[0];

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            c.is_running ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                          }`}
                        />
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {c.name}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                            {c.short_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        {c.image}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          c.is_running
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {c.ports.length === 0 ? (
                        <span className="text-zinc-400 dark:text-zinc-500">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {c.ports.map((p, idx) => {
                            const pNum = p.public_port || p.private_port;
                            return (
                              <button
                                key={idx}
                                onClick={() => api.openBrowser(`http://localhost:${pNum}`)}
                                title={`Open http://localhost:${pNum} in Browser`}
                                className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 hover:text-brand-500 dark:text-zinc-300 dark:hover:text-brand-400 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono transition shadow-sm"
                              >
                                <span>:{pNum}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onOpenLogs(c)}
                          title="View Logs"
                          className="p-1.5 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent transition shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {c.is_running ? (
                          <>
                            <button
                              onClick={() => onRestart(c.id)}
                              title="Restart Container"
                              className="p-1.5 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent transition shadow-sm"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onStop(c.id)}
                              title="Stop Container"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onStart(c.id)}
                            title="Start Container"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onRemove(c.id, true)}
                          title="Remove Container"
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-500/20 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-200 dark:border-transparent transition shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

