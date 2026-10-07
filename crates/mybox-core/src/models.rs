use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerItem {
    pub id: String,
    pub short_id: String,
    pub name: String,
    pub image: String,
    pub state: String, // "running", "exited", "paused", "created"
    pub status: String,
    pub created: i64,
    pub ports: Vec<PortMapping>,
    pub cpu_usage: f64,
    pub memory_usage_mb: f64,
    pub memory_limit_mb: f64,
    pub memory_percent: f64,
    pub is_running: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortMapping {
    pub ip: Option<String>,
    pub private_port: u16,
    pub public_port: Option<u16>,
    pub proto: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageItem {
    pub id: String,
    pub short_id: String,
    pub repository: String,
    pub tag: String,
    pub size_mb: f64,
    pub created: i64,
    pub containers_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeItem {
    pub name: String,
    pub driver: String,
    pub mountpoint: String,
    pub created_at: String,
    pub size_mb: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub host_os: String,
    pub host_arch: String,
    pub host_name: String,
    pub total_memory_mb: u64,
    pub used_memory_mb: u64,
    pub free_memory_mb: u64,
    pub memory_usage_percent: f32,
    pub cpu_usage_percent: f32,
    pub cpu_cores: usize,
    pub active_containers: usize,
    pub total_containers: usize,
    pub total_images: usize,
    pub total_volumes: usize,
    pub engine_status: EngineInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineInfo {
    pub connected: bool,
    pub engine_type: String, // "Docker", "Podman", "OrbStack", "Colima", "Offline"
    pub socket_path: String,
    pub server_version: String,
    pub api_version: String,
    pub min_api_version: String,
    pub os: String,
    pub arch: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerLogs {
    pub container_id: String,
    pub lines: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PruneResult {
    pub containers_deleted: usize,
    pub images_deleted: usize,
    pub space_reclaimed_mb: f64,
}
