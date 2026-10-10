use anyhow::{Context, Result};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::{Arc, OnceLock};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;

pub struct ActiveTunnel {
    pub container_id: String,
    pub local_port: u16,
    pub public_url: String,
    pub process: Arc<RwLock<Option<Child>>>,
    pub created_at: i64,
}

pub struct TunnelManager {
    tunnels: Arc<RwLock<HashMap<String, ActiveTunnel>>>,
}

static TUNNEL_INSTANCE: OnceLock<TunnelManager> = OnceLock::new();

impl TunnelManager {
    pub fn global() -> &'static TunnelManager {
        TUNNEL_INSTANCE.get_or_init(|| TunnelManager {
            tunnels: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Expose a local container port to the public internet and return the HTTPS URL
    pub async fn start_tunnel(&self, container_id: &str, port: u16) -> Result<String> {
        // If already active for this container, return existing public URL
        {
            let map = self.tunnels.read().await;
            if let Some(t) = map.get(container_id) {
                if !t.public_url.is_empty() {
                    return Ok(t.public_url.clone());
                }
            }
        }

        // Stop any old tunnel for this container first
        let _ = self.stop_tunnel(container_id).await;

        log::info!("myBox Tunnel: Starting public live sharing for port {}...", port);

        // Try Strategy 1: Cloudflared Quick Tunnel (trycloudflare.com)
        let cf_result = Self::spawn_cloudflared(port).await;
        if let Ok((url, child)) = cf_result {
            log::info!("myBox Tunnel: Live Cloudflare public URL active: {}", url);
            let active = ActiveTunnel {
                container_id: container_id.to_string(),
                local_port: port,
                public_url: url.clone(),
                process: Arc::new(RwLock::new(Some(child))),
                created_at: chrono::Utc::now().timestamp_millis(),
            };
            let mut map = self.tunnels.write().await;
            map.insert(container_id.to_string(), active);
            return Ok(url);
        }

        // Strategy 2: SSH Reverse Tunnel (localhost.run / pinggy.io)
        log::info!("myBox Tunnel: Spawning SSH reverse tunnel fallback...");
        let ssh_result = Self::spawn_ssh_tunnel(port).await;
        if let Ok((url, child)) = ssh_result {
            log::info!("myBox Tunnel: Live SSH public URL active: {}", url);
            let active = ActiveTunnel {
                container_id: container_id.to_string(),
                local_port: port,
                public_url: url.clone(),
                process: Arc::new(RwLock::new(Some(child))),
                created_at: chrono::Utc::now().timestamp_millis(),
            };
            let mut map = self.tunnels.write().await;
            map.insert(container_id.to_string(), active);
            return Ok(url);
        }

        // Strategy 3: localtunnel (npx localtunnel --port <port>)
        log::info!("myBox Tunnel: Spawning localtunnel fallback...");
        let lt_result = Self::spawn_localtunnel(port).await;
        if let Ok((url, child)) = lt_result {
            log::info!("myBox Tunnel: Live localtunnel public URL active: {}", url);
            let active = ActiveTunnel {
                container_id: container_id.to_string(),
                local_port: port,
                public_url: url.clone(),
                process: Arc::new(RwLock::new(Some(child))),
                created_at: chrono::Utc::now().timestamp_millis(),
            };
            let mut map = self.tunnels.write().await;
            map.insert(container_id.to_string(), active);
            return Ok(url);
        }

        anyhow::bail!("Failed to generate public URL. Please ensure internet connectivity is available.")
    }

    async fn spawn_cloudflared(port: u16) -> Result<(String, Child)> {
        let mut cmd = Command::new("cloudflared");
        cmd.args(["tunnel", "--url", &format!("http://127.0.0.1:{}", port), "--no-autoupdate"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn().context("Failed to spawn cloudflared")?;
        let stderr = child.stderr.take().context("No stderr")?;
        let mut reader = BufReader::new(stderr).lines();

        let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(1);

        tokio::spawn(async move {
            while let Ok(Some(line)) = reader.next_line().await {
                if line.contains("trycloudflare.com") {
                    for word in line.split_whitespace() {
                        if word.starts_with("https://") && word.contains("trycloudflare.com") {
                            let _ = tx.send(word.trim().to_string()).await;
                            return;
                        }
                    }
                }
            }
        });

        match tokio::time::timeout(std::time::Duration::from_secs(8), rx.recv()).await {
            Ok(Some(url)) => Ok((url, child)),
            _ => {
                let _ = child.kill().await;
                anyhow::bail!("Cloudflare tunnel timed out");
            }
        }
    }

    async fn spawn_ssh_tunnel(port: u16) -> Result<(String, Child)> {
        let mut cmd = Command::new("ssh");
        cmd.args([
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "ServerAliveInterval=30",
            "-o", "ExitOnForwardFailure=yes",
            "-R", &format!("80:127.0.0.1:{}", port),
            "nokey@localhost.run",
            "--", "--no-inject-http-auth"
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

        let mut child = cmd.spawn().context("Failed to spawn ssh tunnel")?;
        let stdout = child.stdout.take().context("No stdout")?;
        let mut reader = BufReader::new(stdout).lines();

        let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(1);

        tokio::spawn(async move {
            while let Ok(Some(line)) = reader.next_line().await {
                if line.contains("https://") {
                    for word in line.split_whitespace() {
                        if word.starts_with("https://") && (word.contains(".lhrtunnel.pro") || word.contains(".lhr.life") || word.contains(".localhost.run")) {
                            let _ = tx.send(word.trim().to_string()).await;
                            return;
                        }
                    }
                }
            }
        });

        match tokio::time::timeout(std::time::Duration::from_secs(8), rx.recv()).await {
            Ok(Some(url)) => Ok((url, child)),
            _ => {
                let _ = child.kill().await;
                anyhow::bail!("SSH tunnel timed out");
            }
        }
    }

    async fn spawn_localtunnel(port: u16) -> Result<(String, Child)> {
        let mut cmd = Command::new("npx");
        cmd.args(["--yes", "localtunnel", "--port", &port.to_string()])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn().context("Failed to spawn localtunnel")?;
        let stdout = child.stdout.take().context("No stdout")?;
        let mut reader = BufReader::new(stdout).lines();

        let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(1);

        tokio::spawn(async move {
            while let Ok(Some(line)) = reader.next_line().await {
                if line.contains("https://") && line.contains("loca.lt") {
                    for word in line.split_whitespace() {
                        if word.starts_with("https://") && word.contains("loca.lt") {
                            let _ = tx.send(word.trim().to_string()).await;
                            return;
                        }
                    }
                }
            }
        });

        match tokio::time::timeout(std::time::Duration::from_secs(8), rx.recv()).await {
            Ok(Some(url)) => Ok((url, child)),
            _ => {
                let _ = child.kill().await;
                anyhow::bail!("Localtunnel timed out");
            }
        }
    }

    /// Stop an active public URL tunnel
    pub async fn stop_tunnel(&self, container_id: &str) -> Result<()> {
        let mut map = self.tunnels.write().await;
        if let Some(active) = map.remove(container_id) {
            let mut proc_guard = active.process.write().await;
            if let Some(mut child) = proc_guard.take() {
                let _ = child.kill().await;
            }
            log::info!("myBox Tunnel: Stopped public tunnel for container {}", container_id);
        }
        Ok(())
    }

    /// Get all active tunnels as (container_id -> public_url) map
    pub async fn get_active_tunnels(&self) -> HashMap<String, String> {
        let map = self.tunnels.read().await;
        let mut res = HashMap::new();
        for (id, tunnel) in map.iter() {
            res.insert(id.clone(), tunnel.public_url.clone());
        }
        res
    }

    /// Get public URL for a specific container
    pub async fn get_tunnel_url(&self, container_id: &str) -> Option<String> {
        let map = self.tunnels.read().await;
        map.get(container_id).map(|t| t.public_url.clone())
    }
}
