import React from "react";
import { X, Box, ExternalLink, Github, Sparkles } from "lucide-react";
import { AppInfo } from "../types";

interface AboutModalProps {
  appInfo: AppInfo | null;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ appInfo, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Background */}
        <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-zinc-800/80 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
              <Box className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  my<span className="text-brand-500">Box</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  v0.1.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ultra-Lightweight Container Desktop & CLI
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-zinc-300">
          <p className="leading-relaxed text-zinc-400">
            myBox is a blazing-fast, modern, open-source container desktop app and headless CLI built with <strong className="text-zinc-200">Tauri</strong> and <strong className="text-zinc-200">Rust</strong>. Designed to deliver container management with zero background memory bloat.
          </p>

          <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Company</span>
              <a
                href={appInfo?.company_website || "https://ucdreams.com"}
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:text-brand-300 font-bold flex items-center space-x-1"
              >
                <span>{appInfo?.company || "UCDREAMS TECHNOLOGIES LLP"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Lead Developer</span>
              <a
                href={appInfo?.developer_website || "https://uchitchakma.com"}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-200 hover:text-white font-semibold flex items-center space-x-1"
              >
                <span>{appInfo?.developer || "Uchit Chakma"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Brand Color</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="font-mono text-zinc-300">#C5453E</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Open Source License</span>
              <span className="text-zinc-300 font-semibold">MIT License</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between pt-2">
            <a
              href="https://github.com/uchitchakma/myBox"
              target="_blank"
              rel="noreferrer"
              className="flex-1 mr-2 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium border border-zinc-800 transition"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>

            <a
              href="https://ucdreams.com"
              target="_blank"
              rel="noreferrer"
              className="flex-1 ml-2 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/25 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>ucdreams.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
