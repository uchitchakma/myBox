use anyhow::{Context, Result};
use bollard::container::{
    ListContainersOptions, LogsOptions, RemoveContainerOptions, RestartContainerOptions,
    StartContainerOptions, StopContainerOptions,
};
use bollard::image::{ListImagesOptions, RemoveImageOptions};
use bollard::volume::ListVolumesOptions;
use bollard::Docker;
use futures_util::StreamExt;
use std::collections::HashMap;
use std::path::PathBuf;

use crate::models::{
    ContainerItem, ContainerLogs, EngineInfo, ImageItem, PortMapping, PruneResult, VolumeItem,
};

#[derive(Clone)]
pub struct DockerEngine {
    client: Option<Docker>,
    detected_socket: String,
    engine_type: String,
}

impl DockerEngine {
    pub async fn new() -> Self {
        let (client, socket, engine_type) = Self::auto_connect().await;
        Self {
            client,
            detected_socket: socket,
            engine_type,
        }
    }

    async fn auto_connect() -> (Option<Docker>, String, String) {
        let mut candidates = Vec::new();

        // 1. Environment variable DOCKER_HOST if set
        if let Ok(host) = std::env::var("DOCKER_HOST") {
            candidates.push((host.clone(), "Custom DOCKER_HOST".to_string()));
        }

        // 2. Standard Docker unix socket
        #[cfg(unix)]
        {
            candidates.push((
                "unix:///var/run/docker.sock".to_string(),
                "Docker".to_string(),
            ));

            // OrbStack socket
            if let Some(home) = dirs::home_dir() {
                let orb_path = home.join(".orbstack/run/docker.sock");
                if orb_path.exists() {
                    candidates.push((
                        format!("unix://{}", orb_path.display()),
                        "OrbStack".to_string(),
                    ));
                }

                // Colima socket
                let colima_path = home.join(".colima/default/docker.sock");
                if colima_path.exists() {
                    candidates.push((
                        format!("unix://{}", colima_path.display()),
                        "Colima".to_string(),
                    ));
                }

                // Podman rootless socket
                let podman_path = home.join(".local/share/containers/podman/machine/podman.sock");
                if podman_path.exists() {
                    candidates.push((
                        format!("unix://{}", podman_path.display()),
                        "Podman".to_string(),
                    ));
                }
            }

            // Linux rootless podman / XDG_RUNTIME_DIR
            if let Ok(runtime_dir) = std::env::var("XDG_RUNTIME_DIR") {
                let p = PathBuf::from(&runtime_dir).join("podman/podman.sock");
                if p.exists() {
                    candidates.push((format!("unix://{}", p.display()), "Podman".to_string()));
                }
                let d = PathBuf::from(&runtime_dir).join("docker.sock");
                if d.exists() {
                    candidates.push((
                        format!("unix://{}", d.display()),
                        "Docker (Rootless)".to_string(),
                    ));
                }
            }
        }

        // 3. Windows named pipe
        #[cfg(windows)]
        {
            candidates.push((
                "npipe:////./pipe/docker_engine".to_string(),
                "Docker Desktop (Windows)".to_string(),
            ));
        }

        // Try candidate connections
        for (candidate_socket, engine_label) in candidates {
            if let Ok(docker) = Docker::connect_with_socket(&candidate_socket, 120, bollard::API_DEFAULT_VERSION) {
                if docker.ping().await.is_ok() {
                    log::info!("myBox connected to {} via {}", engine_label, candidate_socket);
                    return (Some(docker), candidate_socket, engine_label);
                }
            }
        }

        // Fallback default connect
        if let Ok(docker) = Docker::connect_with_local_defaults() {
            if docker.ping().await.is_ok() {
                return (
                    Some(docker),
                    "local_defaults".to_string(),
                    "Docker Compatible".to_string(),
                );
            }
        }

        log::warn!("myBox: No running container runtime detected. Running in detached mode.");
        (None, "None".to_string(), "Offline".to_string())
    }

    pub fn is_connected(&self) -> bool {
        self.client.is_some()
    }

    pub async fn get_engine_info(&self) -> EngineInfo {
        if let Some(ref client) = self.client {
            if let Ok(version) = client.version().await {
                return EngineInfo {
                    connected: true,
                    engine_type: self.engine_type.clone(),
                    socket_path: self.detected_socket.clone(),
                    server_version: version.version.unwrap_or_else(|| "Unknown".into()),
                    api_version: version.api_version.unwrap_or_else(|| "Unknown".into()),
                    min_api_version: version.min_api_version.unwrap_or_else(|| "Unknown".into()),
                    os: version.os.unwrap_or_else(|| std::env::consts::OS.into()),
                    arch: version.arch.unwrap_or_else(|| std::env::consts::ARCH.into()),
                };
            }
        }

        EngineInfo {
            connected: false,
            engine_type: "Offline".to_string(),
            socket_path: "None".to_string(),
            server_version: "N/A".to_string(),
            api_version: "N/A".to_string(),
            min_api_version: "N/A".to_string(),
            os: std::env::consts::OS.to_string(),
            arch: std::env::consts::ARCH.to_string(),
        }
    }

    pub async fn list_containers(&self, all: bool) -> Result<Vec<ContainerItem>> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline or unreachable")?;

        let options = Some(ListContainersOptions::<String> {
            all,
            limit: None,
            size: false,
            filters: HashMap::new(),
        });

        let summaries = client.list_containers(options).await?;
        let mut containers = Vec::new();

        for c in summaries {
            let id = c.id.unwrap_or_default();
            let short_id = if id.len() >= 12 {
                id[..12].to_string()
            } else {
                id.clone()
            };

            let name = c
                .names
                .and_then(|names| names.first().cloned())
                .unwrap_or_else(|| "unnamed".into())
                .trim_start_matches('/')
                .to_string();

            let image = c.image.unwrap_or_else(|| "unknown".into());
            let state = c.state.unwrap_or_else(|| "unknown".into());
            let status = c.status.unwrap_or_else(|| "".into());
            let created = c.created.unwrap_or(0);
            let is_running = state.to_lowercase() == "running";

            let ports = c
                .ports
                .unwrap_or_default()
                .into_iter()
                .map(|p| PortMapping {
                    ip: p.ip,
                    private_port: p.private_port,
                    public_port: p.public_port,
                    proto: p.typ.map(|t| t.to_string()).unwrap_or_else(|| "tcp".into()),
                })
                .collect();

            containers.push(ContainerItem {
                id,
                short_id,
                name,
                image,
                state,
                status,
                created,
                ports,
                cpu_usage: 0.0,
                memory_usage_mb: 0.0,
                memory_limit_mb: 0.0,
                memory_percent: 0.0,
                is_running,
            });
        }

        Ok(containers)
    }

    pub async fn start_container(&self, id: &str) -> Result<()> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;
        client
            .start_container(id, None::<StartContainerOptions<String>>)
            .await?;
        Ok(())
    }

    pub async fn stop_container(&self, id: &str) -> Result<()> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;
        let options = Some(StopContainerOptions { t: 10 });
        client.stop_container(id, options).await?;
        Ok(())
    }

    pub async fn restart_container(&self, id: &str) -> Result<()> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;
        let options = Some(RestartContainerOptions { t: 10 });
        client.restart_container(id, options).await?;
        Ok(())
    }

    pub async fn remove_container(&self, id: &str, force: bool) -> Result<()> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;
        let options = Some(RemoveContainerOptions {
            force,
            v: true,
            link: false,
        });
        client.remove_container(id, options).await?;
        Ok(())
    }

    pub async fn list_images(&self) -> Result<Vec<ImageItem>> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;

        let options = Some(ListImagesOptions::<String> {
            all: false,
            filters: HashMap::new(),
            digests: false,
        });

        let summaries = client.list_images(options).await?;
        let mut images = Vec::new();

        for img in summaries {
            let full_id = img.id.trim_start_matches("sha256:");
            let short_id = if full_id.len() >= 12 {
                full_id[..12].to_string()
            } else {
                full_id.to_string()
            };

            let tags = &img.repo_tags;
            let (repo, tag) = if let Some(first_tag) = tags.first() {
                let parts: Vec<&str> = first_tag.split(':').collect();
                if parts.len() == 2 {
                    (parts[0].to_string(), parts[1].to_string())
                } else {
                    (first_tag.clone(), "latest".to_string())
                }
            } else {
                ("<none>".to_string(), "<none>".to_string())
            };

            let size_mb = (img.size as f64) / (1024.0 * 1024.0);

            images.push(ImageItem {
                id: img.id,
                short_id,
                repository: repo,
                tag,
                size_mb: (size_mb * 10.0).round() / 10.0,
                created: img.created,
                containers_count: img.containers,
            });
        }

        Ok(images)
    }

    pub async fn remove_image(&self, id: &str, force: bool) -> Result<()> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;
        let options = Some(RemoveImageOptions {
            force,
            noprune: false,
        });
        client.remove_image(id, options, None).await?;
        Ok(())
    }

    pub async fn list_volumes(&self) -> Result<Vec<VolumeItem>> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;

        let options = Some(ListVolumesOptions::<String> {
            filters: HashMap::new(),
        });

        let res = client.list_volumes(options).await?;
        let volumes = res
            .volumes
            .unwrap_or_default()
            .into_iter()
            .map(|v| VolumeItem {
                name: v.name,
                driver: v.driver,
                mountpoint: v.mountpoint,
                created_at: v.created_at.unwrap_or_else(|| "N/A".into()),
                size_mb: None,
            })
            .collect();

        Ok(volumes)
    }

    pub async fn get_container_logs(&self, id: &str, tail: usize) -> Result<ContainerLogs> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;

        let options = Some(LogsOptions::<String> {
            stdout: true,
            stderr: true,
            tail: tail.to_string(),
            follow: false,
            timestamps: true,
            ..Default::default()
        });

        let mut stream = client.logs(id, options);
        let mut lines = Vec::new();

        while let Some(log_result) = stream.next().await {
            match log_result {
                Ok(output) => {
                    lines.push(output.to_string().trim_end().to_string());
                }
                Err(e) => {
                    lines.push(format!("[Error reading log stream: {}]", e));
                    break;
                }
            }
        }

        Ok(ContainerLogs {
            container_id: id.to_string(),
            lines,
        })
    }

    pub async fn prune_system(&self) -> Result<PruneResult> {
        let client = self
            .client
            .as_ref()
            .context("Container runtime is offline")?;

        let mut space_reclaimed_bytes: u64 = 0;
        let mut containers_deleted = 0;
        let mut images_deleted = 0;

        if let Ok(c_prune) = client.prune_containers(None::<bollard::container::PruneContainersOptions<String>>).await {
            containers_deleted = c_prune.containers_deleted.unwrap_or_default().len();
            space_reclaimed_bytes += c_prune.space_reclaimed.unwrap_or(0).max(0) as u64;
        }

        if let Ok(i_prune) = client.prune_images(None::<bollard::image::PruneImagesOptions<String>>).await {
            images_deleted = i_prune.images_deleted.unwrap_or_default().len();
            space_reclaimed_bytes += i_prune.space_reclaimed.unwrap_or(0).max(0) as u64;
        }

        let space_reclaimed_mb = (space_reclaimed_bytes as f64) / (1024.0 * 1024.0);

        Ok(PruneResult {
            containers_deleted,
            images_deleted,
            space_reclaimed_mb: (space_reclaimed_mb * 10.0).round() / 10.0,
        })
    }
}
