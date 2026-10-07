use mybox_core::{
    AppConfig, ContainerItem, ContainerLogs, DockerEngine, ImageItem, PruneResult,
    StatsCollector, SystemMetrics, VolumeItem, APP_COMPANY, APP_COMPANY_WEBSITE,
    APP_DEVELOPER, APP_DEVELOPER_WEBSITE, APP_NAME, APP_VERSION, BRAND_PRIMARY_COLOR, REPO_URL,
};
use serde_json::json;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

pub struct AppState {
    pub docker: Arc<RwLock<DockerEngine>>,
    pub stats: Arc<StatsCollector>,
}

#[tauri::command]
async fn get_system_metrics(state: State<'_, AppState>) -> Result<SystemMetrics, String> {
    let docker = state.docker.read().await;
    let metrics = state.stats.collect_system_metrics(&docker).await;
    Ok(metrics)
}

#[tauri::command]
async fn list_containers(
    all: bool,
    state: State<'_, AppState>,
) -> Result<Vec<ContainerItem>, String> {
    let docker = state.docker.read().await;
    docker
        .list_containers(all)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_container(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let docker = state.docker.read().await;
    docker
        .start_container(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_container(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let docker = state.docker.read().await;
    docker
        .stop_container(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn restart_container(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let docker = state.docker.read().await;
    docker
        .restart_container(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn remove_container(
    id: String,
    force: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let docker = state.docker.read().await;
    docker
        .remove_container(&id, force)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_images(state: State<'_, AppState>) -> Result<Vec<ImageItem>, String> {
    let docker = state.docker.read().await;
    docker.list_images().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn remove_image(
    id: String,
    force: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let docker = state.docker.read().await;
    docker
        .remove_image(&id, force)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_volumes(state: State<'_, AppState>) -> Result<Vec<VolumeItem>, String> {
    let docker = state.docker.read().await;
    docker.list_volumes().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_container_logs(
    id: String,
    tail: usize,
    state: State<'_, AppState>,
) -> Result<ContainerLogs, String> {
    let docker = state.docker.read().await;
    docker
        .get_container_logs(&id, tail)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn prune_system(state: State<'_, AppState>) -> Result<PruneResult, String> {
    let docker = state.docker.read().await;
    docker.prune_system().await.map_err(|e| e.to_string())
}

#[tauri::command]
fn get_app_info() -> serde_json::Value {
    json!({
        "name": APP_NAME,
        "version": APP_VERSION,
        "developer": APP_DEVELOPER,
        "developer_website": APP_DEVELOPER_WEBSITE,
        "company": APP_COMPANY,
        "company_website": APP_COMPANY_WEBSITE,
        "primary_color": BRAND_PRIMARY_COLOR,
        "repo_url": REPO_URL,
    })
}

#[tauri::command]
fn get_app_config() -> AppConfig {
    AppConfig::load()
}

#[tauri::command]
fn save_app_config(config: AppConfig) -> Result<(), String> {
    config.save().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");

    let (docker_engine, stats_collector) = rt.block_on(async {
        let docker = DockerEngine::new().await;
        let stats = StatsCollector::new();
        (Arc::new(RwLock::new(docker)), Arc::new(stats))
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            docker: docker_engine,
            stats: stats_collector,
        })
        .invoke_handler(tauri::generate_handler![
            get_system_metrics,
            list_containers,
            start_container,
            stop_container,
            restart_container,
            remove_container,
            list_images,
            remove_image,
            list_volumes,
            get_container_logs,
            prune_system,
            get_app_info,
            get_app_config,
            save_app_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running myBox desktop application");
}
