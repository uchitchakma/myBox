use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::*;
use indicatif::ProgressBar;
use mybox_core::{
    DockerEngine, StatsCollector, APP_COMPANY, APP_COMPANY_WEBSITE, APP_DEVELOPER,
    APP_DEVELOPER_WEBSITE, APP_VERSION, BRAND_PRIMARY_COLOR,
};
use std::time::Duration;
use tabled::{settings::Style, Table, Tabled};

#[derive(Parser)]
#[command(
    name = "mybox",
    author = "Uchit Chakma <contact@uchitchakma.com>",
    version = "0.1.0",
    about = "⚡ Ultra-lightweight, high-speed container management CLI for macOS, Windows & Linux",
    long_about = "myBox is an ultra-lightweight, modern container engine & management tool built by UCDREAMS TECHNOLOGIES LLP and Uchit Chakma."
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Print detailed system and container info
    #[arg(short, long)]
    info: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// List containers (alias: ps)
    #[command(alias = "ps")]
    List {
        /// Show all containers (default shows just running)
        #[arg(short, long)]
        all: bool,
    },

    /// Start one or more containers
    Start {
        /// Container ID or Name
        container: String,
    },

    /// Stop one or more running containers
    Stop {
        /// Container ID or Name
        container: String,
    },

    /// Restart a container
    Restart {
        /// Container ID or Name
        container: String,
    },

    /// Remove a container
    #[command(alias = "rm")]
    Remove {
        /// Container ID or Name
        container: String,

        /// Force removal of running container
        #[arg(short, long)]
        force: bool,
    },

    /// List container images
    Images,

    /// Remove an image
    Rmi {
        /// Image ID or Tag
        image: String,

        /// Force removal
        #[arg(short, long)]
        force: bool,
    },

    /// List storage volumes
    Volumes,

    /// Fetch logs for a container
    Logs {
        /// Container ID or Name
        container: String,

        /// Number of lines to show
        #[arg(short, long, default_value = "100")]
        tail: usize,
    },

    /// Live system and container performance stats
    Stats,

    /// Reclaim disk space by pruning stopped containers & dangling images
    Prune,

    /// Start all containers defined in mybox.yaml
    Up {
        /// Optional directory path
        #[arg(short, long)]
        path: Option<String>,
    },

    /// Stop all containers defined in mybox.yaml
    Down {
        /// Optional directory path
        #[arg(short, long)]
        path: Option<String>,
    },

    /// Execute a command or open an interactive shell inside a container (alias: sh)
    #[command(alias = "sh")]
    Exec {
        /// Container ID or Name
        container: String,

        /// Command to execute (default: /bin/sh)
        #[arg(default_value = "/bin/sh")]
        cmd: String,

        /// Optional command arguments (e.g. pip install requests)
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },

    /// Auto-detect framework and generate mybox.yaml configuration (alias: detect)
    #[command(alias = "detect")]
    Init {
        /// Project directory path (defaults to current directory)
        #[arg(short, long)]
        path: Option<String>,

        /// Overwrite existing mybox.yaml without confirmation
        #[arg(short, long)]
        force: bool,
    },

    /// Stop project and remove mybox.yaml (alias: remove-project, decontainerize)
    #[command(alias = "remove-project", alias = "decontainerize")]
    Unbox {
        /// Project directory path (defaults to current directory)
        #[arg(short, long)]
        path: Option<String>,

        /// Keep mybox.yaml configuration file (only stop containers)
        #[arg(short, long)]
        keep_config: bool,
    },

    /// Run myBox in headless server daemon mode
    Server {
        /// Port to bind the HTTP status daemon
        #[arg(short, long, default_value = "9090")]
        port: u16,
    },

    /// Share a running container or local port publicly with an instant HTTPS URL (alias: live)
    #[command(alias = "live")]
    Share {
        /// Container ID/name or local port number (e.g. 3000, 8080)
        target: String,

        /// Optional port number if specifying container ID
        #[arg(short, long)]
        port: Option<u16>,
    },

    /// Stop live public sharing for a container or port
    Unshare {
        /// Container ID/name or port
        target: String,
    },

    /// View saved persistent project history across reinstalls (alias: projects)
    #[command(alias = "projects")]
    History,

    /// Print myBox system information and runtime diagnostics
    Info,
}

#[derive(Tabled)]
struct ContainerRow {
    #[tabled(rename = "CONTAINER ID")]
    id: String,
    #[tabled(rename = "NAME")]
    name: String,
    #[tabled(rename = "IMAGE")]
    image: String,
    #[tabled(rename = "STATUS")]
    status: String,
    #[tabled(rename = "PORTS")]
    ports: String,
}

#[derive(Tabled)]
struct ImageRow {
    #[tabled(rename = "IMAGE ID")]
    id: String,
    #[tabled(rename = "REPOSITORY")]
    repo: String,
    #[tabled(rename = "TAG")]
    tag: String,
    #[tabled(rename = "SIZE (MB)")]
    size: String,
}

#[derive(Tabled)]
struct VolumeRow {
    #[tabled(rename = "VOLUME NAME")]
    name: String,
    #[tabled(rename = "DRIVER")]
    driver: String,
    #[tabled(rename = "MOUNTPOINT")]
    mountpoint: String,
}

#[derive(Tabled)]
struct ProjectRow {
    #[tabled(rename = "PROJECT ID")]
    id: String,
    #[tabled(rename = "NAME")]
    name: String,
    #[tabled(rename = "PRESET")]
    preset: String,
    #[tabled(rename = "PATH")]
    path: String,
    #[tabled(rename = "PORT")]
    port: u16,
    #[tabled(rename = "LAST LAUNCHED")]
    last_launched: String,
}

fn print_banner() {
    println!(
        "{}",
        format!(
            r#"
   ███╗   ███╗██╗   ██╗██████╗  ██████╗ ██╗  ██╗
   ████╗ ████║╚██╗ ██╔╝██╔══██╗██╔═══██╗╚██╗██╔╝
   ██╔████╔██║ ╚████╔╝ ██████╔╝██║   ██║ ╚███╔╝ 
   ██║╚██╔╝██║  ╚██╔╝  ██╔══██╗██║   ██║ ██╔██╗  
   ██║ ╚═╝ ██║   ██║   ██████╔╝╚██████╔╝██╔╝ ██╗ 
   ╚═╝     ╚═╝   ╚═╝   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ v{}
   ⚡ Ultra-Lightweight Container Tool
   By {} ({})
   Developer: {} ({})
   Primary Color: {}
"#,
            APP_VERSION,
            APP_COMPANY.bold(),
            APP_COMPANY_WEBSITE.underline(),
            APP_DEVELOPER.bold(),
            APP_DEVELOPER_WEBSITE.underline(),
            BRAND_PRIMARY_COLOR.custom_color(colored::CustomColor {
                r: 0xC5,
                g: 0x45,
                b: 0x3E
            })
        )
        .custom_color(colored::CustomColor {
            r: 0xC5,
            g: 0x45,
            b: 0x3E,
        })
    );
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    let docker = DockerEngine::new().await;
    let stats = StatsCollector::new();

    match cli.command {
        Some(Commands::List { all }) => {
            let spinner = ProgressBar::new_spinner();
            spinner.set_message("Fetching container states...");
            spinner.enable_steady_tick(Duration::from_millis(80));

            let containers = docker.list_containers(all).await?;
            spinner.finish_and_clear();

            if containers.is_empty() {
                println!(
                    "{}",
                    "📦 No containers found. Use 'mybox up' or 'mybox init' to launch one."
                        .yellow()
                );
                return Ok(());
            }

            let rows: Vec<ContainerRow> = containers
                .into_iter()
                .map(|c| {
                    let ports_str = c
                        .ports
                        .iter()
                        .map(|p| {
                            if let Some(pub_p) = p.public_port {
                                format!("{}:{}->{}", p.ip.clone().unwrap_or_default(), pub_p, p.private_port)
                            } else {
                                format!("{}/{}", p.private_port, p.proto)
                            }
                        })
                        .collect::<Vec<_>>()
                        .join(", ");

                    let status_colored = if c.is_running {
                        format!("● {}", c.status).green().to_string()
                    } else {
                        format!("○ {}", c.status).dimmed().to_string()
                    };

                    ContainerRow {
                        id: c.short_id.cyan().to_string(),
                        name: c.name.bold().to_string(),
                        image: c.image,
                        status: status_colored,
                        ports: if ports_str.is_empty() {
                            "-".into()
                        } else {
                            ports_str
                        },
                    }
                })
                .collect();

            let mut table = Table::new(rows);
            table.with(Style::rounded());
            println!("{}", table);
        }

        Some(Commands::Start { container }) => {
            println!("⚡ Starting container '{}'...", container.cyan());
            docker.start_container(&container).await?;
            println!("{}", format!("✓ Container '{}' started successfully!", container).green().bold());
        }

        Some(Commands::Stop { container }) => {
            println!("⏳ Stopping container '{}'...", container.cyan());
            docker.stop_container(&container).await?;
            println!("{}", format!("✓ Container '{}' stopped.", container).yellow().bold());
        }

        Some(Commands::Restart { container }) => {
            println!("🔄 Restarting container '{}'...", container.cyan());
            docker.restart_container(&container).await?;
            println!("{}", format!("✓ Container '{}' restarted.", container).green().bold());
        }

        Some(Commands::Remove { container, force }) => {
            println!("🗑 Removing container '{}' (force: {})...", container.cyan(), force);
            docker.remove_container(&container, force).await?;
            println!("{}", format!("✓ Container '{}' removed.", container).red().bold());
        }

        Some(Commands::Images) => {
            let spinner = ProgressBar::new_spinner();
            spinner.set_message("Listing local container images...");
            spinner.enable_steady_tick(Duration::from_millis(80));

            let images = docker.list_images().await?;
            spinner.finish_and_clear();

            if images.is_empty() {
                println!("{}", "No images found locally.".yellow());
                return Ok(());
            }

            let rows: Vec<ImageRow> = images
                .into_iter()
                .map(|img| ImageRow {
                    id: img.short_id.cyan().to_string(),
                    repo: img.repository.bold().to_string(),
                    tag: img.tag.yellow().to_string(),
                    size: format!("{:.1} MB", img.size_mb),
                })
                .collect();

            let mut table = Table::new(rows);
            table.with(Style::rounded());
            println!("{}", table);
        }

        Some(Commands::Rmi { image, force }) => {
            println!("🗑 Removing image '{}'...", image.cyan());
            docker.remove_image(&image, force).await?;
            println!("{}", format!("✓ Image '{}' removed.", image).red().bold());
        }

        Some(Commands::Volumes) => {
            let volumes = docker.list_volumes().await?;
            if volumes.is_empty() {
                println!("{}", "No volumes found.".yellow());
                return Ok(());
            }

            let rows: Vec<VolumeRow> = volumes
                .into_iter()
                .map(|v| VolumeRow {
                    name: v.name.bold().to_string(),
                    driver: v.driver,
                    mountpoint: v.mountpoint.dimmed().to_string(),
                })
                .collect();

            let mut table = Table::new(rows);
            table.with(Style::rounded());
            println!("{}", table);
        }

        Some(Commands::Logs { container, tail }) => {
            let logs = docker.get_container_logs(&container, tail).await?;
            println!(
                "{}",
                format!("─── Logs for '{}' (last {} lines) ───", container, tail).cyan()
            );
            for line in logs.lines {
                println!("{}", line);
            }
        }

        Some(Commands::Stats) => {
            let metrics = stats.collect_system_metrics(&docker).await;
            print_banner();
            println!("{}", "📊 Host & Container Metrics:".bold());
            println!(
                "  • Host OS:        {} ({})",
                metrics.host_os.cyan(),
                metrics.host_arch
            );
            println!(
                "  • Host Memory:    {} MB used / {} MB total ({}%)",
                metrics.used_memory_mb,
                metrics.total_memory_mb,
                format!("{:.1}", metrics.memory_usage_percent).yellow()
            );
            println!(
                "  • CPU Usage:      {}% across {} cores",
                format!("{:.1}", metrics.cpu_usage_percent).yellow(),
                metrics.cpu_cores
            );
            println!(
                "  • Active Engines: {} ({})",
                metrics.engine_status.engine_type.bold().green(),
                metrics.engine_status.socket_path
            );
            println!(
                "  • Containers:     {} running / {} total",
                metrics.active_containers.to_string().green().bold(),
                metrics.total_containers
            );
            println!("  • Images:         {}", metrics.total_images);
            println!("  • Volumes:        {}", metrics.total_volumes);
        }

        Some(Commands::Prune) => {
            let pb = ProgressBar::new_spinner();
            pb.set_message("Pruning stopped containers and dangling images...");
            pb.enable_steady_tick(Duration::from_millis(80));

            let res = docker.prune_system().await?;
            pb.finish_and_clear();

            println!("{}", "🧹 System Prune Complete:".green().bold());
            println!("  • Containers deleted: {}", res.containers_deleted);
            println!("  • Images deleted:     {}", res.images_deleted);
            println!(
                "  • Space reclaimed:    {} MB",
                format!("{:.1}", res.space_reclaimed_mb).cyan().bold()
            );
        }

        Some(Commands::Up { path }) => {
            let pb = ProgressBar::new_spinner();
            pb.set_message("⚡ Launching myBox project containers...");
            pb.enable_steady_tick(Duration::from_millis(80));

            let res = mybox_core::ProjectManager::compose_up(path).await?;
            pb.finish_and_clear();
            println!("{}", res.green().bold());
        }

        Some(Commands::Down { path }) => {
            let pb = ProgressBar::new_spinner();
            pb.set_message("⏳ Stopping myBox project containers...");
            pb.enable_steady_tick(Duration::from_millis(80));

            let res = mybox_core::ProjectManager::compose_down(path).await?;
            pb.finish_and_clear();
            println!("{}", res.yellow().bold());
        }

        Some(Commands::Exec {
            container,
            cmd,
            args,
        }) => {
            println!("🔌 Executing in container '{}'...", container.cyan());
            let mut command = std::process::Command::new("docker");
            command.arg("exec").arg("-it").arg(&container).arg(&cmd);
            for arg in &args {
                command.arg(arg);
            }
            let status = command.status();
            match status {
                Ok(s) => {
                    if let Some(code) = s.code() {
                        if code != 0 {
                            std::process::exit(code);
                        }
                    }
                }
                Err(err) => {
                    eprintln!("{}", format!("Failed to execute command: {}", err).red().bold());
                }
            }
        }

        Some(Commands::Init { path, force }) => {
            let target_path = path.unwrap_or_else(|| ".".to_string());
            let detected = mybox_core::FrameworkDetector::detect(&target_path);

            print_banner();
            println!("{}", "🔍 myBox Intelligent Project Detector".bold().custom_color(colored::CustomColor { r: 0xC5, g: 0x45, b: 0x3E }));
            println!("  • Directory:       {}", target_path.cyan());
            println!("  • Framework:       {}", detected.name.bold().green());
            println!("  • Category:        {}", detected.category);
            println!("  • Description:     {}", detected.description);
            println!("  • Default Port:    {}", detected.default_port.to_string().yellow());
            println!("  • Runtime Image:   {}", detected.runtime_image);
            println!("  • Start Command:   {}", detected.start_command.cyan());

            if !detected.services.is_empty() {
                println!("\n  📦 Detected Services ({}):", detected.services.len());
                for s in &detected.services {
                    println!("    - {} [{} -> Port {}]", s.name.bold(), s.role.dimmed(), s.port);
                }
            }

            let mybox_file = std::path::Path::new(&target_path).join("mybox.yaml");
            if mybox_file.exists() && !force {
                println!("\n{}", "⚠️  Existing mybox.yaml found. Use --force to overwrite.".yellow());
            } else {
                std::fs::write(&mybox_file, &detected.generated_yaml)?;
                println!("\n{}", format!("✓ Generated {} successfully!", mybox_file.display()).green().bold());
                println!("Run '{}' to start your project sandboxes.", "mybox up".bold().cyan());
            }
        }

        Some(Commands::Unbox { path, keep_config }) => {
            let target_path = path.unwrap_or_else(|| ".".to_string());
            let pb = ProgressBar::new_spinner();
            pb.set_message("🗑 De-containerizing project and cleaning up...");
            pb.enable_steady_tick(Duration::from_millis(80));

            let res = mybox_core::ProjectManager::remove_project(Some(target_path), !keep_config).await?;
            pb.finish_and_clear();
            println!("{}", res.green().bold());
        }

        Some(Commands::Server { port }) => {
            print_banner();
            println!(
                "{}",
                format!("🚀 Starting myBox Server Daemon on port http://0.0.0.0:{}", port)
                    .green()
                    .bold()
            );
            println!("Press Ctrl+C to stop.");
            // Keep running and logging heartbeat
            loop {
                let metrics = stats.collect_system_metrics(&docker).await;
                println!(
                    "[{}] Heartbeat: {} running containers | CPU: {:.1}% | RAM: {}MB",
                    chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
                    metrics.active_containers,
                    metrics.cpu_usage_percent,
                    metrics.used_memory_mb
                );
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
        }

        Some(Commands::Share { target, port }) => {
            let port_to_share = if let Ok(p) = target.parse::<u16>() {
                p
            } else if let Some(p) = port {
                p
            } else {
                let containers = docker.list_containers(true).await?;
                if let Some(c) = containers.into_iter().find(|c| c.id.starts_with(&target) || c.name == target || c.short_id == target) {
                    c.ports.first().and_then(|p| p.public_port.or(Some(p.private_port))).unwrap_or(3000)
                } else {
                    3000
                }
            };

            let pb = ProgressBar::new_spinner();
            pb.set_message(format!("🌐 Generating secure live HTTPS tunnel for port {}...", port_to_share));
            pb.enable_steady_tick(Duration::from_millis(80));

            let tunnel = mybox_core::TunnelManager::global();
            match tunnel.start_tunnel(&target, port_to_share).await {
                Ok(url) => {
                    pb.finish_and_clear();
                    print_banner();
                    println!("{}", "✨ Container / Service is now LIVE on the Public Internet!".green().bold());
                    println!("  • Local Port:  {}", format!("http://localhost:{}", port_to_share).cyan());
                    println!("  • Public URL:  {}", url.bold().underline().green());
                    println!("  • Target:      {}", target.yellow());
                    println!("\n💡 Share this URL with clients or team members. Press Ctrl+C or run 'mybox unshare {}' to stop.\n", target);

                    // Wait for Ctrl+C to stop the tunnel
                    tokio::signal::ctrl_c().await?;
                    println!("\nStopping live tunnel...");
                    let _ = tunnel.stop_tunnel(&target).await;
                    println!("{}", "✓ Live sharing stopped.".yellow());
                }
                Err(e) => {
                    pb.finish_and_clear();
                    eprintln!("{}", format!("Failed to create live tunnel: {}", e).red().bold());
                }
            }
        }

        Some(Commands::Unshare { target }) => {
            let tunnel = mybox_core::TunnelManager::global();
            match tunnel.stop_tunnel(&target).await {
                Ok(_) => println!("{}", format!("✓ Public share stopped for '{}'.", target).yellow().bold()),
                Err(e) => eprintln!("{}", format!("Failed to stop share: {}", e).red().bold()),
            }
        }

        Some(Commands::History) => {
            let storage = mybox_core::ProjectStorage::global();
            let projects = storage.list_projects();

            print_banner();
            println!("{}", "🗄️  Saved Persistent Projects (Stored in ~/.mybox/projects.json):".bold());
            if projects.is_empty() {
                println!("{}", "No saved projects found. Run or launch a project to save it automatically.".yellow());
                return Ok(());
            }

            let rows: Vec<ProjectRow> = projects
                .into_iter()
                .map(|p| {
                    let formatted_time = chrono::DateTime::from_timestamp(p.last_launched_at / 1000, 0)
                        .map(|dt| dt.format("%Y-%m-%d %H:%M").to_string())
                        .unwrap_or_else(|| "Unknown".to_string());
                    ProjectRow {
                        id: p.id.cyan().to_string(),
                        name: p.name.bold().to_string(),
                        preset: p.framework_name.yellow().to_string(),
                        path: p.path,
                        port: p.default_port,
                        last_launched: formatted_time,
                    }
                })
                .collect();

            let mut table = Table::new(rows);
            table.with(Style::rounded());
            println!("{}", table);
            println!("💡 Run 'mybox up -p <path>' to start any saved project.");
        }

        Some(Commands::Info) | None => {
            print_banner();
            let metrics = stats.collect_system_metrics(&docker).await;
            println!("{}", "ℹ️  System Information:".bold());
            println!("  • Engine Runtime:   {}", metrics.engine_status.engine_type.green());
            println!("  • Server Version:   {}", metrics.engine_status.server_version);
            println!("  • Socket Path:      {}", metrics.engine_status.socket_path);
            println!("  • Active Containers:{}", metrics.active_containers);
            println!("  • System Memory:    {}/{} MB", metrics.used_memory_mb, metrics.total_memory_mb);
            println!("\n💡 Run 'mybox --help' to see all available commands.");
        }
    }

    Ok(())
}
