import React, { useState } from "react";
import { HardDrive, Search } from "lucide-react";
import { VolumeItem } from "../types";

interface VolumesViewProps {
  volumes: VolumeItem[];
}

export const VolumesView: React.FC<VolumesViewProps> = ({ volumes }) => {
  const [search, setSearch] = useState("");

  const filtered = volumes.filter((v) => {
    if (
      search &&
      !v.name.toLowerCase().includes(search.toLowerCase()) &&
      !v.mountpoint.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-4rem)]">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search persistent storage volumes..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <span className="text-xs text-zinc-400 font-medium">
          Total Volumes: {volumes.length}
        </span>
      </div>

      {/* Volumes Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <HardDrive className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-200">
              No persistent volumes active
            </p>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-md">
              In <strong className="text-brand-400 font-medium">Native Mode</strong>, sandboxes read and write directly to your project workspace files without requiring virtual storage overlays.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">VOLUME NAME</th>
                <th className="px-5 py-3.5">DRIVER</th>
                <th className="px-5 py-3.5">HOST MOUNTPOINT</th>
                <th className="px-5 py-3.5">CREATED AT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((v) => (
                <tr
                  key={v.name}
                  className="hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-bold text-zinc-100">
                    {v.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                      {v.driver}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-400 text-[11px] truncate max-w-xs">
                    {v.mountpoint}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 text-[11px]">
                    {v.created_at}
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
