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
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAbout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAbout,
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
    <aside className="w-64 bg-zinc-950/90 border-r border-zinc-800/80 flex flex-col justify-between h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 flex items-center justify-between border-b border-zinc-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/30">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  my<span className="text-brand-500">Box</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  v0.1
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Ultra-Lightweight
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
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
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-zinc-400"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Attribution Info */}
      <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/40">
        <button
          onClick={onOpenAbout}
          className="w-full mb-3 flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-xs text-zinc-300 font-medium border border-zinc-800 transition"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-brand-400" />
            <span>About myBox</span>
          </div>
          <Sparkles className="w-3 h-3 text-brand-400 animate-pulse" />
        </button>

        <div className="text-[11px] text-zinc-400 space-y-1 px-1">
          <div className="flex items-center justify-between">
            <span>By</span>
            <a
              href="https://ucdreams.com"
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
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
              className="text-zinc-300 hover:text-white font-medium flex items-center space-x-1"
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
