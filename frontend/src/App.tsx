import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { ContainersView } from "./components/ContainersView";
import { ImagesView } from "./components/ImagesView";
import { VolumesView } from "./components/VolumesView";
import { StatsView } from "./components/StatsView";
import { SettingsView } from "./components/SettingsView";
import { LogsModal } from "./components/LogsModal";
import { AboutModal } from "./components/AboutModal";
import { NewProjectModal } from "./components/NewProjectModal";
import { api } from "./api";
import {
  AppConfig,
  AppInfo,
  ContainerItem,
  ContainerLogs,
  ImageItem,
  SystemMetrics,
  VolumeItem,
} from "./types";

export function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [containers, setContainers] = useState<ContainerItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [volumes, setVolumes] = useState<VolumeItem[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [selectedLogsContainer, setSelectedLogsContainer] =
    useState<ContainerItem | null>(null);
  const [containerLogs, setContainerLogs] = useState<ContainerLogs | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  // Load All Data
  const loadData = useCallback(async () => {
    try {
      const [m, c, img, vol] = await Promise.all([
        api.getSystemMetrics().catch(() => null),
        api.listContainers(true).catch(() => []),
        api.listImages().catch(() => []),
        api.listVolumes().catch(() => []),
      ]);
      if (m) setMetrics(m);
      setContainers(c);
      setImages(img);
      setVolumes(vol);
    } catch (err) {
      console.error("Failed to fetch myBox data:", err);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Initial load
  useEffect(() => {
    loadData();
    api.getAppInfo().then(setAppInfo).catch(console.error);
    api.getAppConfig().then(setAppConfig).catch(console.error);

    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Container operations
  const handleStartContainer = async (id: string) => {
    await api.startContainer(id);
    await loadData();
  };

  const handleStopContainer = async (id: string) => {
    await api.stopContainer(id);
    await loadData();
  };

  const handleRestartContainer = async (id: string) => {
    await api.restartContainer(id);
    await loadData();
  };

  const handleRemoveContainer = async (id: string, force = true) => {
    await api.removeContainer(id, force);
    await loadData();
  };

  const handleRemoveImage = async (id: string, force = true) => {
    await api.removeImage(id, force);
    await loadData();
  };

  const handlePrune = async () => {
    const res = await api.pruneSystem();
    alert(
      `🧹 Prune Completed!\nDeleted ${res.containers_deleted} containers and ${res.images_deleted} images.\nReclaimed: ${res.space_reclaimed_mb} MB`
    );
    await loadData();
  };

  // Logs Modal
  const handleOpenLogs = async (container: ContainerItem) => {
    setSelectedLogsContainer(container);
    setIsLoadingLogs(true);
    try {
      const l = await api.getContainerLogs(container.id, 100);
      setContainerLogs(l);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleRefreshLogs = async () => {
    if (!selectedLogsContainer) return;
    setIsLoadingLogs(true);
    try {
      const l = await api.getContainerLogs(selectedLogsContainer.id, 100);
      setContainerLogs(l);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 antialiased overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-900/30">
        <Header
          currentTab={currentTab}
          metrics={metrics}
          onRefresh={handleRefresh}
          onPrune={handlePrune}
          onOpenLaunchModal={() => setIsLaunchModalOpen(true)}
          isRefreshing={isRefreshing}
        />

        <div className="flex-1 overflow-hidden">
          {currentTab === "dashboard" && (
            <Dashboard
              metrics={metrics}
              containers={containers}
              onStart={handleStartContainer}
              onStop={handleStopContainer}
              onOpenLogs={handleOpenLogs}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === "containers" && (
            <ContainersView
              containers={containers}
              onStart={handleStartContainer}
              onStop={handleStopContainer}
              onRestart={handleRestartContainer}
              onRemove={handleRemoveContainer}
              onOpenLogs={handleOpenLogs}
            />
          )}

          {currentTab === "images" && (
            <ImagesView images={images} onRemove={handleRemoveImage} />
          )}

          {currentTab === "volumes" && <VolumesView volumes={volumes} />}

          {currentTab === "stats" && <StatsView metrics={metrics} />}

          {currentTab === "settings" && (
            <SettingsView
              config={appConfig}
              onSaveConfig={(cfg) => {
                setAppConfig(cfg);
                api.saveAppConfig(cfg);
              }}
            />
          )}
        </div>
      </main>

      {/* Launch New Project Modal */}
      <NewProjectModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        onLaunchSuccess={loadData}
        onLaunch={async (path, type, port) => {
          return await api.launchProject(path, type, port);
        }}
      />

      {/* Logs Modal */}
      {selectedLogsContainer && (
        <LogsModal
          container={selectedLogsContainer}
          logs={containerLogs}
          isLoading={isLoadingLogs}
          onClose={() => setSelectedLogsContainer(null)}
          onRefresh={handleRefreshLogs}
        />
      )}

      {/* About Modal */}
      {isAboutOpen && (
        <AboutModal
          appInfo={appInfo}
          onClose={() => setIsAboutOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
