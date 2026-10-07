import React, { useState } from "react";
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  FileText,
  Search,
  Box,
  Globe,
} from "lucide-react";
import { ContainerItem } from "../types";

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

  const filtered = containers.filter((c) => {
    if (filter === "running" && !c.is_running) return false;
    if (filter === "stopped" && c.is_running) return false;
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.image.toLowerCase().includes(search.toLowerCase()) &&
      !c.short_id.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-4rem)]">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search containers by name, image, or ID..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === "all"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All ({containers.length})
          </button>
          <button
            onClick={() => setFilter("running")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === "running"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Running ({containers.filter((c) => c.is_running).length})
          </button>
          <button
            onClick={() => setFilter("stopped")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === "stopped"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Stopped ({containers.filter((c) => !c.is_running).length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-300">
              No containers match your criteria
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Try adjusting your search query or launch a new container.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">NAME & ID</th>
                <th className="px-5 py-3.5">IMAGE</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5">PORT MAPPINGS</th>
                <th className="px-5 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-zinc-900/50 transition-colors duration-150"
                >
                  {/* Name & ID */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          c.is_running ? "bg-emerald-500" : "bg-zinc-600"
                        }`}
                      />
                      <div>
                        <span className="font-bold text-zinc-100 block">
                          {c.name}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {c.short_id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Image */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {c.image}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        c.is_running
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  {/* Ports */}
                  <td className="px-5 py-3.5">
                    {c.ports.length === 0 ? (
                      <span className="text-zinc-500">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.ports.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] font-mono"
                          >
                            <Globe className="w-2.5 h-2.5 text-zinc-500" />
                            <span>
                              {p.public_port
                                ? `${p.public_port}:${p.private_port}`
                                : `${p.private_port}/${p.proto}`}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onOpenLogs(c)}
                        title="View Logs"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {c.is_running ? (
                        <>
                          <button
                            onClick={() => onRestart(c.id)}
                            title="Restart Container"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onStop(c.id)}
                            title="Stop Container"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onStart(c.id)}
                          title="Start Container"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onRemove(c.id, true)}
                        title="Remove Container"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
