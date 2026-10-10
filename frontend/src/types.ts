export interface PortMapping {
  ip?: string;
  private_port: number;
  public_port?: number;
  proto: string;
}

export interface ContainerItem {
  id: string;
  short_id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  ports: PortMapping[];
  cpu_usage: number;
  memory_usage_mb: number;
  memory_limit_mb: number;
  memory_percent: number;
  is_running: boolean;
  project_name?: string;
  project_path?: string;
  public_url?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  path: string;
  framework_id: string;
  framework_name: string;
  default_port: number;
  created_at: number;
  last_launched_at: number;
  is_running: boolean;
  public_url?: string;
}

export interface ImageItem {
  id: string;
  short_id: string;
  repository: string;
  tag: string;
  size_mb: number;
  created: number;
  containers_count: number;
}

export interface VolumeItem {
  name: string;
  driver: string;
  mountpoint: string;
  created_at: string;
  size_mb?: number;
}

export interface EngineInfo {
  connected: boolean;
  engine_type: string;
  socket_path: string;
  server_version: string;
  api_version: string;
  min_api_version: string;
  os: string;
  arch: string;
}

export interface SystemMetrics {
  host_os: string;
  host_arch: string;
  host_name: string;
  total_memory_mb: number;
  used_memory_mb: number;
  free_memory_mb: number;
  memory_usage_percent: number;
  cpu_usage_percent: number;
  cpu_cores: number;
  active_containers: number;
  total_containers: number;
  total_images: number;
  total_volumes: number;
  engine_status: EngineInfo;
}

export interface ContainerLogs {
  container_id: string;
  lines: string[];
  log_file_path?: string;
}

export interface PruneResult {
  containers_deleted: number;
  images_deleted: number;
  space_reclaimed_mb: number;
}

export interface AppInfo {
  name: string;
  version: string;
  developer: string;
  developer_website: string;
  company: string;
  company_website: string;
  primary_color: string;
  repo_url: string;
}

export interface AppConfig {
  auto_refresh_interval_secs: number;
  custom_socket_path?: string;
  enable_notifications: boolean;
  primary_color: string;
  dark_mode: boolean;
  log_tail_lines: number;
}

export interface DetectedService {
  name: string;
  role: string;
  image: string;
  port: number;
  env_vars: string[];
}

export interface DetectedProject {
  framework_id: string;
  name: string;
  category: string;
  description: string;
  default_port: number;
  icon: string;
  runtime_image: string;
  start_command: string;
  detected_files: string[];
  is_multi_service: boolean;
  generated_yaml: string;
  services: DetectedService[];
}

export interface ContainerGroup {
  key: string;
  projectName: string;
  isGroup: boolean;
  services: ContainerItem[];
  is_running: boolean;
  ports: PortMapping[];
  status: string;
  image: string;
}

export function groupContainers(containers: ContainerItem[]): ContainerGroup[] {
  const map = new Map<string, ContainerItem[]>();
  const standalone: ContainerItem[] = [];

  for (const c of containers) {
    if (c.project_name) {
      const list = map.get(c.project_name) || [];
      list.push(c);
      map.set(c.project_name, list);
    } else {
      standalone.push(c);
    }
  }

  const groups: ContainerGroup[] = [];

  for (const [pName, services] of map.entries()) {
    if (services.length > 1) {
      const isAnyRunning = services.some((s) => s.is_running);
      const isAllRunning = services.every((s) => s.is_running);
      const runningCount = services.filter((s) => s.is_running).length;
      const allPorts = services.flatMap((s) => s.ports);

      groups.push({
        key: `group-${pName}`,
        projectName: pName,
        isGroup: true,
        services,
        is_running: isAnyRunning,
        ports: allPorts,
        status: isAllRunning
          ? `Running (${services.length}/${services.length} services)`
          : isAnyRunning
          ? `Partially Running (${runningCount}/${services.length})`
          : `Exited (${services.length} services)`,
        image: `Stack (${services.map((s) => s.name).join(" + ")})`,
      });
    } else if (services.length === 1) {
      const c = services[0];
      groups.push({
        key: c.id,
        projectName: pName,
        isGroup: false,
        services: [c],
        is_running: c.is_running,
        ports: c.ports,
        status: c.status,
        image: c.image,
      });
    }
  }

  for (const c of standalone) {
    groups.push({
      key: c.id,
      projectName: c.name,
      isGroup: false,
      services: [c],
      is_running: c.is_running,
      ports: c.ports,
      status: c.status,
      image: c.image,
    });
  }

  return groups;
}

export function getPrimaryWebUrl(group: ContainerGroup): string | null {
  if (!group.services || group.services.length === 0) return null;

  // 1. Look for explicit frontend / web / client / node service
  const frontendService = group.services.find((s) => {
    const n = s.name.toLowerCase();
    const img = s.image.toLowerCase();
    return (
      n.includes("front") ||
      n.includes("client") ||
      n.includes("web") ||
      n.includes("ui") ||
      n.includes("app") ||
      img.includes("node") ||
      img.includes("react") ||
      img.includes("vite") ||
      img.includes("next")
    );
  });

  if (frontendService && frontendService.ports.length > 0) {
    const p = frontendService.ports[0];
    return `http://localhost:${p.public_port || p.private_port}`;
  }

  // 2. Look for standard web frontend port ranges (3000-3050, 5173-5200, 80, 443)
  const webPort = group.ports.find((p) => {
    const port = p.public_port || p.private_port;
    return (
      (port >= 3000 && port <= 3050) ||
      (port >= 5173 && port <= 5200) ||
      port === 80 ||
      port === 443
    );
  });

  if (webPort) {
    return `http://localhost:${webPort.public_port || webPort.private_port}`;
  }

  // 3. Fallback to any active port
  if (group.ports.length > 0) {
    const p = group.ports[0];
    return `http://localhost:${p.public_port || p.private_port}`;
  }

  return null;
}



