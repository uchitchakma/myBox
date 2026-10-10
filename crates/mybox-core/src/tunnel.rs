use anyhow::{Context, Result};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
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

    fn get_cloudflared_path() -> String {
        if std::path::Path::new("/opt/homebrew/bin/cloudflared").exists() {
            "/opt/homebrew/bin/cloudflared".to_string()
        } else if std::path::Path::new("/usr/local/bin/cloudflared").exists() {
            "/usr/local/bin/cloudflared".to_string()
        } else {
            "cloudflared".to_string()
        }
    }

    async fn spawn_cloudflared(port: u16) -> Result<(String, Child)> {
        let cf_bin = Self::get_cloudflared_path();
        let mut cmd = Command::new(cf_bin);
        cmd.args([
            "tunnel",
            "--url", &format!("http://127.0.0.1:{}", port),
            "--http-host-header", "localhost",
            "--no-autoupdate",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .env("PATH", crate::native_runner::NativeRunner::get_system_path());

        let mut child = cmd.spawn().context("Failed to spawn cloudflared")?;
        let stderr = child.stderr.take().context("No stderr")?;
        let mut reader = BufReader::new(stderr).lines();

        let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(1);

        tokio::spawn(async move {
            let mut detected_url: Option<String> = None;
            let sent = Arc::new(AtomicBool::new(false));

            while let Ok(Some(line)) = reader.next_line().await {
                log::info!("myBox Cloudflare: {}", line);

                // 1. Detect the quick tunnel URL
                if detected_url.is_none() && line.contains("trycloudflare.com") {
                    for word in line.split_whitespace() {
                        let clean = word.trim_matches(|c: char| !c.is_alphanumeric() && c != ':' && c != '/' && c != '.' && c != '-');
                        if clean.starts_with("https://") && clean.contains("trycloudflare.com") {
                            detected_url = Some(clean.to_string());

                            // Safety timer: after 16s from discovery, if "Registered" wasn't parsed, send anyway
                            let tx_timer = tx.clone();
                            let url_clone = clean.to_string();
                            let sent_timer = sent.clone();
                            tokio::spawn(async move {
                                tokio::time::sleep(std::time::Duration::from_secs(16)).await;
                                if !sent_timer.swap(true, Ordering::SeqCst) {
                                    let _ = tx_timer.send(url_clone).await;
                                }
                            });
                            break;
                        }
                    }
                }

                // 2. Wait until Cloudflare edge nodes have registered the connector
                // This guarantees the visitor will not receive Cloudflare Error 1033.
                if detected_url.is_some() && (line.contains("Registered tunnel connection") || line.contains("Registered tunnel")) {
                    if let Some(ref url) = detected_url {
                        if !sent.swap(true, Ordering::SeqCst) {
                            let _ = tx.send(url.clone()).await;
                        }
                    }
                }

                // IMPORTANT: Keep draining reader so cloudflared process never gets SIGPIPE or full pipe buffer!
            }
        });

        match tokio::time::timeout(std::time::Duration::from_secs(25), rx.recv()).await {
            Ok(Some(url)) => Ok((url, child)),
            _ => {
                let _ = child.kill().await;
                anyhow::bail!("Cloudflare tunnel timed out or not registered in time");
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
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .env("PATH", crate::native_runner::NativeRunner::get_system_path());

        let mut child = cmd.spawn().context("Failed to spawn ssh tunnel")?;
        let stdout = child.stdout.take().context("No stdout")?;
        let mut reader = BufReader::new(stdout).lines();

        let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(1);

        tokio::spawn(async move {
            let mut sent = false;
            while let Ok(Some(line)) = reader.next_line().await {
                log::info!("myBox SSH: {}", line);
                if !sent && line.contains("https://") {
                    for word in line.split_whitespace() {
                        let clean = word.trim_matches(|c: char| !c.is_alphanumeric() && c != ':' && c != '/' && c != '.' && c != '-');
                        if clean.starts_with("https://") && (clean.contains(".lhrtunnel.pro") || clean.contains(".lhr.life") || clean.contains(".localhost.run")) {
                            sent = true;
                            let _ = tx.send(clean.to_string()).await;
                            break;
                        }
                    }
                }
                // Continue reading to prevent pipe closure or full pipe buffer
            }
        });

        match tokio::time::timeout(std::time::Duration::from_secs(12), rx.recv()).await {
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
            .stderr(Stdio::piped())
            .env("PATH", crate::native_runner::NativeRunner::get_system_path());

        let mut child = cmd.spawn().context("Failed to spawn localtunnel")?;
        let stdout = child.stdout.take().context("No stdout")?;
        let mut reader = BufReader::new(stdout).lines();

        let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(1);

        tokio::spawn(async move {
            let mut sent = false;
            while let Ok(Some(line)) = reader.next_line().await {
                if !sent && line.contains("https://") && line.contains("loca.lt") {
                    for word in line.split_whitespace() {
                        if word.starts_with("https://") && word.contains("loca.lt") {
                            sent = true;
                            let _ = tx.send(word.trim().to_string()).await;
                            break;
                        }
                    }
                }
                // Continue reading to prevent pipe closure
            }
        });

        match tokio::time::timeout(std::time::Duration::from_secs(12), rx.recv()).await {
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
