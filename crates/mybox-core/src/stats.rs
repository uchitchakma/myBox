use std::sync::{Arc, Mutex};
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};

use crate::docker::DockerEngine;
use crate::models::SystemMetrics;

#[derive(Clone)]
pub struct StatsCollector {
    system: Arc<Mutex<System>>,
}

impl StatsCollector {
    pub fn new() -> Self {
        let mut sys = System::new_with_specifics(
            RefreshKind::nothing()
                .with_cpu(CpuRefreshKind::everything())
                .with_memory(MemoryRefreshKind::everything()),
        );
        sys.refresh_all();
        Self {
            system: Arc::new(Mutex::new(sys)),
        }
    }

    pub async fn collect_system_metrics(&self, docker: &DockerEngine) -> SystemMetrics {
        let (
            host_os,
            host_arch,
            host_name,
            total_memory_mb,
            used_memory_mb,
            free_memory_mb,
            memory_usage_percent,
            cpu_usage_percent,
            cpu_cores,
        ) = {
            let mut sys = self.system.lock().unwrap();
            sys.refresh_cpu_all();
            sys.refresh_memory();

            let total_mem = sys.total_memory() / (1024 * 1024);
            let used_mem = sys.used_memory() / (1024 * 1024);
            let free_mem = sys.free_memory() / (1024 * 1024);
            let mem_pct = if total_mem > 0 {
                (used_mem as f32 / total_mem as f32) * 100.0
            } else {
                0.0
            };

            let cpus = sys.cpus();
            let cpu_usage = if !cpus.is_empty() {
                cpus.iter().map(|c| c.cpu_usage()).sum::<f32>() / cpus.len() as f32
            } else {
                sys.global_cpu_usage()
            };

            let os = System::name().unwrap_or_else(|| std::env::consts::OS.into());
            let arch = std::env::consts::ARCH.to_string();
            let host = System::host_name().unwrap_or_else(|| "localhost".into());

            (
                os,
                arch,
                host,
                total_mem,
                used_mem,
                free_mem,
                mem_pct,
                cpu_usage,
                cpus.len(),
            )
        };

        let engine_status = docker.get_engine_info().await;
        let containers = docker.list_containers(true).await.unwrap_or_default();
        let images = docker.list_images().await.unwrap_or_default();
        let volumes = docker.list_volumes().await.unwrap_or_default();

        let active_containers = containers.iter().filter(|c| c.is_running).count();

        SystemMetrics {
            host_os,
            host_arch,
            host_name,
            total_memory_mb,
            used_memory_mb,
            free_memory_mb,
            memory_usage_percent: (memory_usage_percent * 10.0).round() / 10.0,
            cpu_usage_percent: (cpu_usage_percent * 10.0).round() / 10.0,
            cpu_cores,
            active_containers,
            total_containers: containers.len(),
            total_images: images.len(),
            total_volumes: volumes.len(),
            engine_status,
        }
    }
}
