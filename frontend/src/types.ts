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
