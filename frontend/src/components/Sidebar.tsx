import React from "react";
import {
  LayoutDashboard,
  Box,
  Layers,
  HardDrive,
  Activity,
  Settings,
  Info,
  ExternalLink,
  Sparkles,
  Rocket,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAbout: () => void;
  onOpenLaunchModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAbout,
  onOpenLaunchModal,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "containers", label: "Containers", icon: Box },
    { id: "images", label: "Images", icon: Layers },
    { id: "volumes", label: "Volumes", icon: HardDrive },
    { id: "stats", label: "System Stats", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-zinc-950/90 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between h-screen select-none transition-colors duration-200">
      {/* Brand Header */}
      <div>
        <div data-tauri-drag-region className="pt-4 pb-4 px-5 border-b border-zinc-200 dark:border-zinc-800/60">
          {/* macOS Window Traffic Lights */}
          <div className="flex items-center space-x-2 mb-3.5 pt-1">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-sm inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-sm inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-sm inline-block" />
          </div>

          <div className="flex items-center space-x-3">
            <img
              src="/icon.png"
              alt="myBox Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-brand-500/20 ring-1 ring-zinc-200 dark:ring-zinc-800/50"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">
                  my<span className="text-brand-500">Box</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20">
                  v0.1
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Ultra-Lightweight
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch CTA Button */}
        <div className="p-3 pb-1">
          <button
            onClick={onOpenLaunchModal}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition transform hover:-translate-y-0.5"
          >
            <Rocket className="w-4 h-4" />
            <span>Launch Project</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 pt-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/25 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Attribution Info */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/80 dark:bg-zinc-950/40">
        <button
          onClick={onOpenAbout}
          className="w-full mb-3 flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-800 transition shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
            <span>About myBox</span>
          </div>
          <Sparkles className="w-3 h-3 text-brand-500 dark:text-brand-400 animate-pulse" />
        </button>

        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 px-1">
          <div className="flex items-center justify-between">
            <span>By</span>
            <a
              href="https://ucdreams.com"
              target="_blank"
              rel="noreferrer"
              className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 font-semibold flex items-center space-x-1"
            >
              <span>UCDREAMS</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span>Developer</span>
            <a
              href="https://uchitchakma.com"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-medium flex items-center space-x-1"
            >
              <span>Uchit Chakma</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
