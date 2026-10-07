use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::{Arc, Mutex, OnceLock};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::RwLock;

use crate::models::{ContainerItem, ContainerLogs, DetectedProject, PortMapping};

#[derive(Clone)]
pub struct NativeService {
    pub id: String,
    pub short_id: String,
    pub name: String,
    pub role: String,
    pub runtime_label: String,
    pub command: String,
    pub working_dir: PathBuf,
    pub project_path: String,
    pub port: u16,
    pub pid: Option<u32>,
    pub is_running: bool,
    pub created_at: i64,
    pub logs: Arc<Mutex<Vec<String>>>,
    pub env_vars: Vec<(String, String)>,
}

pub struct NativeRunner {
    services: Arc<RwLock<HashMap<String, NativeService>>>,
}

static INSTANCE: OnceLock<NativeRunner> = OnceLock::new();

impl NativeRunner {
    pub fn global() -> &'static NativeRunner {
        INSTANCE.get_or_init(|| NativeRunner {
            services: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Launch all detected project services natively on the host OS
    pub async fn launch_project_natively(
        project_path: &str,
        detected: &DetectedProject,
    ) -> Result<String> {
        let runner = Self::global();
        let root = Path::new(project_path);
        if !root.exists() {
            anyhow::bail!("Project directory does not exist: {}", project_path);
        }

        // Stop any previously running native services for this project first
        let _ = runner.stop_all_for_project(project_path).await;

        let has_frontend_dir = root.join("frontend").is_dir() || root.join("client").is_dir() || root.join("web").is_dir();
        let has_backend_dir = root.join("backend").is_dir() || root.join("server").is_dir() || root.join("api").is_dir();

        if detected.is_multi_service || (has_frontend_dir && has_backend_dir) {
            // Dual service stack: frontend + backend
            let mut launched_names = Vec::new();
            let f_dir_name = if root.join("frontend").is_dir() { "frontend" } else if root.join("client").is_dir() { "client" } else { "web" };
            let b_dir_name = if root.join("backend").is_dir() { "backend" } else if root.join("server").is_dir() { "server" } else { "api" };

            let f_path = root.join(f_dir_name);
            let b_path = root.join(b_dir_name);

            // 1. Backend Service
            let (b_cmd, b_label, b_port) = if b_path.join("Cargo.toml").exists() {
                ("cargo run".to_string(), "rust (native)".to_string(), 8080)
            } else if b_path.join("go.mod").exists() || b_path.join("main.go").exists() {
                ("go run . || go run main.go".to_string(), "go (native)".to_string(), 8080)
            } else if b_path.join("package.json").exists() {
                ("npm run dev || npm start".to_string(), "node (native)".to_string(), 8000)
            } else {
                ("python main.py || python app.py".to_string(), "python (native)".to_string(), 8000)
            };

            let b_id = format!("native-backend-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos() % 1_000_000);
            let b_short_id = b_id.chars().take(12).collect::<String>();
            let b_envs = vec![
                ("PORT".to_string(), b_port.to_string()),
                ("DATABASE_URL".to_string(), "postgres://localhost:5432/mybox_db".to_string()),
            ];

            runner.spawn_service_process(
                b_id,
                b_short_id,
                "backend".to_string(),
                format!("Backend API Server (Port {})", b_port),
                b_label,
                b_cmd,
                b_path,
                project_path.to_string(),
                b_port,
                b_envs,
            ).await?;
            launched_names.push("Backend");

            // 2. Frontend Service
            let f_cmd = if f_path.join("package.json").exists() {
                "npm run dev || npm start".to_string()
            } else {
                "npm start".to_string()
            };

            let f_id = format!("native-frontend-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos() % 1_000_000);
            let f_short_id = f_id.chars().take(12).collect::<String>();
            let f_envs = vec![
                ("PORT".to_string(), "3000".to_string()),
                ("VITE_API_URL".to_string(), format!("http://localhost:{}", b_port)),
                ("NEXT_PUBLIC_API_URL".to_string(), format!("http://localhost:{}", b_port)),
                ("NODE_ENV".to_string(), "development".to_string()),
            ];

            runner.spawn_service_process(
                f_id,
                f_short_id,
                "frontend".to_string(),
                "Frontend Web Server (Port 3000)".to_string(),
                "node (native)".to_string(),
                f_cmd,
                f_path,
                project_path.to_string(),
                3000,
                f_envs,
            ).await?;
            launched_names.push("Frontend");

            Ok(format!(
                "✓ Launched native myBox sandboxes ({}) on http://localhost:3000 (Zero Docker required)!",
                launched_names.join(" & ")
            ))
        } else {
            // Single service project
            let mut cmd = detected.start_command.clone();
            if cmd == "mybox up" || cmd.is_empty() {
                // Fallback to real framework runner command
                if root.join("package.json").exists() {
                    cmd = "npm run dev || npm start".to_string();
                } else if root.join("Cargo.toml").exists() {
                    cmd = "cargo run".to_string();
                } else if root.join("go.mod").exists() || root.join("main.go").exists() {
                    cmd = "go run .".to_string();
                } else if root.join("manage.py").exists() {
                    cmd = "python manage.py runserver 0.0.0.0:8000".to_string();
                } else if root.join("main.py").exists() || root.join("app.py").exists() {
                    cmd = "python main.py || python app.py".to_string();
                } else {
                    cmd = "npm start".to_string();
                }
            }

            let port = if detected.default_port > 0 { detected.default_port } else { 3000 };
            let svc_id = format!("native-app-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos() % 1_000_000);
            let short_id = svc_id.chars().take(12).collect::<String>();

            let envs = vec![
                ("PORT".to_string(), port.to_string()),
                ("NODE_ENV".to_string(), "development".to_string()),
            ];

            runner.spawn_service_process(
                svc_id,
                short_id,
                detected.name.clone(),
                detected.category.clone(),
                detected.runtime_image.clone(),
                cmd,
                root.to_path_buf(),
                project_path.to_string(),
                port,
                envs,
            ).await?;

            Ok(format!(
                "✓ Launched '{}' natively on port http://localhost:{} (Zero Docker required)!",
                detected.name, port
            ))
        }
    }

fn get_system_path() -> String {
    let mut parts: Vec<String> = Vec::new();
    if let Ok(home) = std::env::var("HOME") {
        parts.push(format!("{}/.local/bin", home));
        parts.push(format!("{}/.cargo/bin", home));
        parts.push(format!("{}/.bun/bin", home));
        parts.push(format!("{}/.nvm/versions/node/current/bin", home));
        parts.push(format!("{}/Library/Application Support/fnm/current/bin", home));
    }
    parts.push("/opt/homebrew/bin".to_string());
    parts.push("/opt/homebrew/sbin".to_string());
    parts.push("/usr/local/bin".to_string());
    parts.push("/usr/local/sbin".to_string());
    parts.push("/usr/bin".to_string());
    parts.push("/bin".to_string());
    parts.push("/usr/sbin".to_string());
    parts.push("/sbin".to_string());

    if let Ok(existing) = std::env::var("PATH") {
        for p in existing.split(':') {
            if !p.is_empty() && !parts.contains(&p.to_string()) {
                parts.push(p.to_string());
            }
        }
    }
    parts.join(":")
}

    #[allow(clippy::too_many_arguments)]
    async fn spawn_service_process(
        &self,
        id: String,
        short_id: String,
        name: String,
        role: String,
        runtime_label: String,
        command_str: String,
        working_dir: PathBuf,
        project_path: String,
        port: u16,
        env_vars: Vec<(String, String)>,
    ) -> Result<()> {
        let logs = Arc::new(Mutex::new(Vec::new()));
        let logs_clone = logs.clone();
        let svc_name = name.clone();

        // Prepare shell command with rich PATH environment
        let enhanced_path = Self::get_system_path();
        let mut cmd = Command::new("sh");
        cmd.arg("-c").arg(&command_str);
        cmd.current_dir(&working_dir);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
        cmd.env("PATH", &enhanced_path);

        if let Ok(home) = std::env::var("HOME") {
            cmd.env("HOME", home);
        }

        for (k, v) in &env_vars {
            cmd.env(k, v);
        }

        let mut child = cmd.spawn().context(format!("Failed to start service process for {}", name))?;
        let pid = child.id();

        // Spawn stdout reader
        if let Some(stdout) = child.stdout.take() {
            let logs_out = logs_clone.clone();
            let s_name = svc_name.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let timestamp = chrono::Local::now().format("%H:%M:%S");
                    let entry = format!("[{}] [{}] {}", timestamp, s_name, line);
                    if let Ok(mut l) = logs_out.lock() {
                        if l.len() > 1000 {
                            l.remove(0);
                        }
                        l.push(entry);
                    }
                }
            });
        }

        // Spawn stderr reader
        if let Some(stderr) = child.stderr.take() {
            let logs_err = logs_clone.clone();
            let s_name = svc_name.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let timestamp = chrono::Local::now().format("%H:%M:%S");
                    let entry = format!("[{}] [{}] [stderr] {}", timestamp, s_name, line);
                    if let Ok(mut l) = logs_err.lock() {
                        if l.len() > 1000 {
                            l.remove(0);
                        }
                        l.push(entry);
                    }
                }
            });
        }

        // Store service
        let service = NativeService {
            id: id.clone(),
            short_id,
            name,
            role,
            runtime_label,
            command: command_str,
            working_dir,
            project_path,
            port,
            pid,
            is_running: true,
            created_at: chrono::Utc::now().timestamp(),
            logs,
            env_vars,
        };

        let mut services = self.services.write().await;
        services.insert(id, service);

        Ok(())
    }

    pub async fn list_services(&self) -> Vec<ContainerItem> {
        let mut sys = sysinfo::System::new_all();
        sys.refresh_all();

        let mut services = self.services.write().await;
        let mut items = Vec::new();

        for svc in services.values_mut() {
            let mut cpu = 0.0;
            let mut mem_mb = 0.0;
            let mut is_running = false;

            if let Some(pid_u32) = svc.pid {
                let pid = sysinfo::Pid::from_u32(pid_u32);
                if let Some(proc_info) = sys.process(pid) {
                    is_running = true;
                    cpu = proc_info.cpu_usage() as f64;
                    mem_mb = (proc_info.memory() as f64) / (1024.0 * 1024.0);
                }
            }

            svc.is_running = is_running;

            let status_label = if is_running {
                format!("Running (Native PID {})", svc.pid.unwrap_or(0))
            } else {
                "Exited".to_string()
            };

            let state_label = if is_running { "running" } else { "exited" };

            items.push(ContainerItem {
                id: svc.id.clone(),
                short_id: svc.short_id.clone(),
                name: svc.name.clone(),
                image: format!("native:{}", svc.runtime_label),
                state: state_label.to_string(),
                status: status_label,
                created: svc.created_at,
                ports: vec![PortMapping {
                    ip: Some("127.0.0.1".to_string()),
                    private_port: svc.port,
                    public_port: Some(svc.port),
                    proto: "tcp".to_string(),
                }],
                cpu_usage: (cpu * 10.0).round() / 10.0,
                memory_usage_mb: (mem_mb * 10.0).round() / 10.0,
                memory_limit_mb: 2048.0,
                memory_percent: ((mem_mb / 2048.0) * 100.0 * 10.0).round() / 10.0,
                is_running,
            });
        }

        items
    }

    pub async fn stop_service(&self, id: &str) -> Result<()> {
        let mut services = self.services.write().await;
        if let Some(svc) = services.get_mut(id) {
            if let Some(pid) = svc.pid {
                #[cfg(unix)]
                {
                    let _ = std::process::Command::new("kill").args(["-15", &pid.to_string()]).output();
                }
                #[cfg(windows)]
                {
                    let _ = std::process::Command::new("taskkill").args(["/PID", &pid.to_string(), "/F"]).output();
                }
            }
            svc.is_running = false;
            svc.pid = None;
            return Ok(());
        }
        anyhow::bail!("Native service not found: {}", id);
    }

    pub async fn restart_service(&self, id: &str) -> Result<()> {
        self.stop_service(id).await?;
        let services = self.services.read().await;
        if let Some(svc) = services.get(id) {
            let id = svc.id.clone();
            let short_id = svc.short_id.clone();
            let name = svc.name.clone();
            let role = svc.role.clone();
            let runtime_label = svc.runtime_label.clone();
            let cmd = svc.command.clone();
            let dir = svc.working_dir.clone();
            let project = svc.project_path.clone();
            let port = svc.port;
            let envs = svc.env_vars.clone();
            drop(services);

            self.spawn_service_process(id, short_id, name, role, runtime_label, cmd, dir, project, port, envs).await?;
            return Ok(());
        }
        anyhow::bail!("Native service not found: {}", id);
    }

    pub async fn remove_service(&self, id: &str) -> Result<()> {
        let _ = self.stop_service(id).await;
        let mut services = self.services.write().await;
        services.remove(id);
        Ok(())
    }

    pub async fn get_logs(&self, id: &str, tail: usize) -> Result<ContainerLogs> {
        let services = self.services.read().await;
        if let Some(svc) = services.get(id) {
            if let Ok(l) = svc.logs.lock() {
                let start = if l.len() > tail { l.len() - tail } else { 0 };
                return Ok(ContainerLogs {
                    container_id: id.to_string(),
                    lines: l[start..].to_vec(),
                });
            }
        }
        anyhow::bail!("Native service logs not found for: {}", id);
    }

    pub async fn stop_all_for_project(&self, project_path: &str) -> Result<String> {
        let mut services = self.services.write().await;
        let mut stopped = 0;
        for svc in services.values_mut() {
            if svc.project_path == project_path && svc.is_running {
                if let Some(pid) = svc.pid {
                    #[cfg(unix)]
                    {
                        let _ = std::process::Command::new("kill").args(["-15", &pid.to_string()]).output();
                    }
                    #[cfg(windows)]
                    {
                        let _ = std::process::Command::new("taskkill").args(["/PID", &pid.to_string(), "/F"]).output();
                    }
                }
                svc.is_running = false;
                svc.pid = None;
                stopped += 1;
            }
        }
        Ok(format!("✓ Stopped {} native services for project.", stopped))
    }
}
