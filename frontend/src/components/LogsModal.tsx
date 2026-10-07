import React from "react";
import { X, Terminal, RefreshCw, Copy, Check } from "lucide-react";
import { ContainerItem, ContainerLogs } from "../types";

interface LogsModalProps {
  container: ContainerItem | null;
  logs: ContainerLogs | null;
  isLoading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({
  container,
  logs,
  isLoading,
  onClose,
  onRefresh,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!container) return null;

  const handleCopy = () => {
    if (logs?.lines) {
      navigator.clipboard.writeText(logs.lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[75vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">
                  Logs: {container.name}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {container.short_id}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{container.image}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand-400" : ""}`}
              />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Terminal Body */}
        <div className="p-4 flex-1 bg-black overflow-y-auto font-mono text-xs text-zinc-300 space-y-1 select-text">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-brand-400" />
              <span>Streaming container logs...</span>
            </div>
          ) : !logs || logs.lines.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <span>No logs available for this container.</span>
            </div>
          ) : (
            logs.lines.map((line, idx) => (
              <div key={idx} className="leading-relaxed hover:bg-zinc-900/50 px-1 rounded">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
