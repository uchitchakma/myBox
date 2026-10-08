import React, { useState } from "react";
import { Layers, Trash2, Search } from "lucide-react";
import { ImageItem } from "../types";

interface ImagesViewProps {
  images: ImageItem[];
  onRemove: (id: string, force?: boolean) => void;
}

export const ImagesView: React.FC<ImagesViewProps> = ({ images, onRemove }) => {
  const [search, setSearch] = useState("");

  const filtered = images.filter((img) => {
    if (
      search &&
      !img.repository.toLowerCase().includes(search.toLowerCase()) &&
      !img.tag.toLowerCase().includes(search.toLowerCase()) &&
      !img.short_id.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-4rem)] transition-colors duration-200">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images by repository or tag..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition shadow-sm"
          />
        </div>

        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Total Images: {images.length}
        </span>
      </div>

      {/* Images Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No container images found
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-md">
              Runtime images and cached container layers will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">REPOSITORY & TAG</th>
                <th className="px-5 py-3.5">IMAGE ID</th>
                <th className="px-5 py-3.5">SIZE</th>
                <th className="px-5 py-3.5">CONTAINERS</th>
                <th className="px-5 py-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filtered.map((img) => (
                <tr
                  key={img.id}
                  className="hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {img.repository}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 text-[10px] font-mono font-semibold">
                        {img.tag}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-500 dark:text-zinc-400">
                    {img.short_id}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-800 dark:text-zinc-300 font-medium">
                    {img.size_mb} MB
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                    {img.containers_count} linked
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onRemove(img.id, true)}
                      title="Remove image"
                      className="p-1.5 rounded-lg bg-white hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-500/20 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-200 dark:border-transparent transition shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
