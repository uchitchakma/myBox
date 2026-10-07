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
    #[command(alias = "rmi")]
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

    /// Start all containers defined in mybox.yml or docker-compose.yml
    Up {
        /// Optional directory path
        #[arg(short, long)]
        path: Option<String>,
    },

    /// Stop all containers defined in mybox.yml or docker-compose.yml
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

    /// Run myBox in headless server daemon mode
    Server {
        /// Port to bind the HTTP status daemon
        #[arg(short, long, default_value = "9090")]
        port: u16,
    },

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
                    "📦 No containers found. Use 'docker run' or compose to launch one."
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
