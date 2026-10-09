import {
  AppConfig,
  AppInfo,
  ContainerItem,
  ContainerLogs,
  ImageItem,
  PruneResult,
  SystemMetrics,
  VolumeItem,
} from "./types";

import { invoke, isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

async function callTauri<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (typeof window !== "undefined" && isTauri()) {
    try {
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.warn(`Tauri invoke error for ${cmd}:`, err);
      return mockHandler<T>(cmd, args);
    }
  }

  // Fallback Mock data for standalone browser dev testing
  return mockHandler<T>(cmd, args);
}

// Mock fallback handlers
function mockHandler<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  switch (cmd) {
    case "get_system_metrics":
      return Promise.resolve({
        host_os: "macOS (Apple Silicon)",
        host_arch: "aarch64",
        host_name: "MacBook-Pro.local",
        total_memory_mb: 16384,
        used_memory_mb: 5820,
        free_memory_mb: 10564,
        memory_usage_percent: 35.5,
        cpu_usage_percent: 12.4,
        cpu_cores: 10,
        active_containers: 2,
        total_containers: 3,
        total_images: 4,
        total_volumes: 2,
        engine_status: {
          connected: true,
          engine_type: "myBox Native Engine",
          socket_path: "unix:///var/run/mybox.sock",
          server_version: "0.1.0",
          api_version: "1.47",
          min_api_version: "1.12",
          os: "linux",
          arch: "arm64",
        },
      } as unknown as T);

    case "list_containers":
      return Promise.resolve([
        {
          id: "c89b21f0a12e345678901234",
          short_id: "c89b21f0a12e",
          name: "web-frontend-prod",
          image: "node:20-alpine",
          state: "running",
          status: "Up 4 hours",
          created: Date.now() - 14400000,
          ports: [
            {
              ip: "0.0.0.0",
              private_port: 3000,
              public_port: 3000,
              proto: "tcp",
            },
          ],
          cpu_usage: 1.8,
          memory_usage_mb: 84.5,
          memory_limit_mb: 512.0,
          memory_percent: 16.5,
          is_running: true,
        },
        {
          id: "a12d45e67890123456789012",
          short_id: "a12d45e67890",
          name: "redis-cache",
          image: "redis:7.2-alpine",
          state: "running",
          status: "Up 8 hours",
          created: Date.now() - 28800000,
          ports: [
            {
              ip: "127.0.0.1",
              private_port: 6379,
              public_port: 6379,
              proto: "tcp",
            },
          ],
          cpu_usage: 0.4,
          memory_usage_mb: 32.1,
          memory_limit_mb: 256.0,
          memory_percent: 12.5,
          is_running: true,
        },
        {
          id: "f90e12345678901234567890",
          short_id: "f90e12345678",
          name: "postgres-db-test",
          image: "postgres:16-alpine",
          state: "exited",
          status: "Exited (0) 2 days ago",
          created: Date.now() - 172800000,
          ports: [],
          cpu_usage: 0.0,
          memory_usage_mb: 0.0,
          memory_limit_mb: 1024.0,
          memory_percent: 0.0,
          is_running: false,
        },
      ] as unknown as T);

    case "list_images":
      return Promise.resolve([
        {
          id: "sha256:7f8e9a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef",
          short_id: "7f8e9a1b2c3d",
          repository: "node",
          tag: "20-alpine",
          size_mb: 52.4,
          created: Date.now() - 864000000,
          containers_count: 1,
        },
        {
          id: "sha256:1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081",
          short_id: "1a2b3c4d5e6f",
          repository: "redis",
          tag: "7.2-alpine",
          size_mb: 38.6,
          created: Date.now() - 1200000000,
          containers_count: 1,
        },
        {
          id: "sha256:4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f8091a2b",
          short_id: "4b5c6d7e8f90",
          repository: "postgres",
          tag: "16-alpine",
          size_mb: 118.2,
          created: Date.now() - 1500000000,
          containers_count: 0,
        },
        {
          id: "sha256:99887766554433221100aabbccddeeff998877665544",
          short_id: "998877665544",
          repository: "nginx",
          tag: "alpine",
          size_mb: 23.5,
          created: Date.now() - 2000000000,
          containers_count: 0,
        },
      ] as unknown as T);

    case "list_volumes":
      return Promise.resolve([
        {
          name: "pgdata_dev",
          driver: "local",
          mountpoint: "/var/lib/mybox/volumes/pgdata_dev/_data",
          created_at: "2026-09-15T10:00:00Z",
          size_mb: 256.0,
        },
        {
          name: "redis_cache_store",
          driver: "local",
          mountpoint: "/var/lib/mybox/volumes/redis_cache_store/_data",
          created_at: "2026-09-20T14:30:00Z",
          size_mb: 48.5,
        },
      ] as unknown as T);

    case "get_container_logs":
      return Promise.resolve({
        container_id: String(args.id || "mock-container"),
        lines: [
          "[2026-10-07 10:00:01] INFO  Server starting on port 3000...",
          "[2026-10-07 10:00:02] INFO  Connected to local database instance",
          "[2026-10-07 10:00:03] INFO  Listening on http://0.0.0.0:3000",
          "[2026-10-07 10:15:22] HTTP  GET /api/v1/health 200 (1.2ms)",
          "[2026-10-07 10:20:45] HTTP  POST /api/v1/auth/login 200 (45.3ms)",
          "[2026-10-07 10:35:10] HTTP  GET /api/v1/containers 200 (2.4ms)",
          "[2026-10-07 10:55:00] INFO  Ready to accept incoming connections.",
        ],
      } as unknown as T);

    case "prune_system":
      return Promise.resolve({
        containers_deleted: 1,
        images_deleted: 2,
        space_reclaimed_mb: 342.8,
      } as unknown as T);

    case "get_app_info":
      return Promise.resolve({
        name: "myBox",
        version: "0.1.0",
        developer: "Uchit Chakma",
        developer_website: "https://uchitchakma.com",
        company: "UCDREAMS TECHNOLOGIES LLP",
        company_website: "https://ucdreams.com",
        primary_color: "#C5453E",
        repo_url: "https://github.com/uchitchakma/myBox",
      } as unknown as T);

    case "get_app_config":
      return Promise.resolve({
        auto_refresh_interval_secs: 3,
        enable_notifications: true,
        primary_color: "#C5453E",
        dark_mode: true,
        log_tail_lines: 100,
      } as unknown as T);

    case "start_container":
    case "stop_container":
    case "restart_container":
    case "remove_container":
    case "remove_image":
    case "save_app_config":
      return Promise.resolve(true as unknown as T);

    case "launch_project":
      return Promise.resolve("✓ Project launched successfully in myBox (Mock Dev Mode)" as unknown as T);

    case "compose_up":
      return Promise.resolve("✓ myBox project up" as unknown as T);

    case "compose_down":
      return Promise.resolve("✓ myBox project down" as unknown as T);

    case "select_folder":
      return Promise.resolve("/Users/uchitchakma/Projects/my-app" as unknown as T);

    case "detect_project":
      return Promise.resolve({
        framework_id: "nextjs",
        name: "Next.js (React Fullstack)",
        category: "JavaScript / TypeScript",
        description: "Auto-detected Next.js project with Server-Side Rendering & App Router",
        default_port: 3000,
        icon: "nextjs",
        runtime_image: "node:20-alpine",
        start_command: "npm run dev",
        detected_files: ["package.json", "next.config.js"],
        is_multi_service: false,
        generated_yaml: `# Auto-generated by myBox (https://ucdreams.com)\nversion: '3.8'\n\nservices:\n  web:\n    image: node:20-alpine\n    working_dir: /app\n    volumes:\n      - .:/app\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=development\n    command: sh -c "npm install && npm run dev"\n`,
        services: [{ name: "web", role: "Next.js App", image: "node:20-alpine", port: 3000, env_vars: ["NODE_ENV=development"] }],
      } as unknown as T);

    case "save_project_yaml":
      return Promise.resolve(true as unknown as T);

    default:
      return Promise.reject(new Error(`Unknown command: ${cmd}`));
  }
}

// Public API methods
export const api = {
  getSystemMetrics: () => callTauri<SystemMetrics>("get_system_metrics"),
  listContainers: (all = true) =>
    callTauri<ContainerItem[]>("list_containers", { all }),
  startContainer: (id: string) => callTauri<void>("start_container", { id }),
  stopContainer: (id: string) => callTauri<void>("stop_container", { id }),
  restartContainer: (id: string) =>
    callTauri<void>("restart_container", { id }),
  removeContainer: (id: string, force = false) =>
    callTauri<void>("remove_container", { id, force }),
  listImages: () => callTauri<ImageItem[]>("list_images"),
  removeImage: (id: string, force = false) =>
    callTauri<void>("remove_image", { id, force }),
  listVolumes: () => callTauri<VolumeItem[]>("list_volumes"),
  removeVolume: (name: string) => callTauri<void>("remove_volume", { name }),
  getContainerLogs: (id: string, tail = 100) =>
    callTauri<ContainerLogs>("get_container_logs", { id, tail }),
  pruneSystem: () => callTauri<PruneResult>("prune_system"),
  getAppInfo: () => callTauri<AppInfo>("get_app_info"),
  getAppConfig: () => callTauri<AppConfig>("get_app_config"),
  saveAppConfig: (config: AppConfig) =>
    callTauri<void>("save_app_config", { config }),
  launchProject: (projectPath: string, projectType: string, port: number) =>
    callTauri<string>("launch_project", { projectPath, projectType, port }),
  composeUp: (path?: string) => callTauri<string>("compose_up", { path }),
  composeDown: (path?: string) => callTauri<string>("compose_down", { path }),
  selectFolder: () => callTauri<string | null>("select_folder"),
  detectProject: (projectPath: string) =>
    callTauri<import("./types").DetectedProject>("detect_project", { projectPath }),
  saveProjectYaml: (projectPath: string, yamlContent: string) =>
    callTauri<void>("save_project_yaml", { projectPath, yamlContent }),
  removeProject: (projectPath: string, deleteConfig = true) =>
    callTauri<string>("remove_project", { projectPath, deleteConfig }),
  startNativeEngine: () => callTauri<string>("start_native_engine"),
  stopNativeEngine: () => callTauri<string>("stop_native_engine"),
  getNativeEngineStatus: () => callTauri<{ is_running: boolean; socket_path: string }>("get_native_engine_status"),
  openBrowser: async (url: string) => {
    try {
      if (typeof window !== "undefined" && isTauri()) {
        await openUrl(url);
        return;
      }
    } catch (e) {
      console.warn("Tauri opener fallback:", e);
    }
    window.open(url, "_blank");
  },
};




