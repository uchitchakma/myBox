use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub const APP_NAME: &str = "myBox";
pub const APP_VERSION: &str = "0.1.0";
pub const APP_DEVELOPER: &str = "Uchit Chakma";
pub const APP_DEVELOPER_WEBSITE: &str = "https://uchitchakma.com";
pub const APP_COMPANY: &str = "UCDREAMS TECHNOLOGIES LLP";
pub const APP_COMPANY_WEBSITE: &str = "https://ucdreams.com";
pub const BRAND_PRIMARY_COLOR: &str = "#C5453E";
pub const REPO_URL: &str = "https://github.com/uchitchakma/myBox";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub auto_refresh_interval_secs: u64,
    pub custom_socket_path: Option<String>,
    pub enable_notifications: bool,
    pub primary_color: String,
    pub dark_mode: bool,
    pub log_tail_lines: usize,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            auto_refresh_interval_secs: 3,
            custom_socket_path: None,
            enable_notifications: true,
            primary_color: BRAND_PRIMARY_COLOR.to_string(),
            dark_mode: true,
            log_tail_lines: 100,
        }
    }
}

impl AppConfig {
    pub fn config_path() -> PathBuf {
        let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        base.join("myBox").join("config.json")
    }

    pub fn load() -> Self {
        let path = Self::config_path();
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(&path) {
                if let Ok(cfg) = serde_json::from_str(&content) {
                    return cfg;
                }
            }
        }
        Self::default()
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let path = Self::config_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }
}
