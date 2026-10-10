use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock};

use crate::models::SavedProject;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProjectStorageData {
    pub projects: HashMap<String, SavedProject>,
}

pub struct ProjectStorage {
    data: Arc<Mutex<ProjectStorageData>>,
}

static STORAGE_INSTANCE: OnceLock<ProjectStorage> = OnceLock::new();

impl ProjectStorage {
    pub fn global() -> &'static ProjectStorage {
        STORAGE_INSTANCE.get_or_init(|| {
            let loaded = Self::load_from_disk().unwrap_or_default();
            ProjectStorage {
                data: Arc::new(Mutex::new(loaded)),
            }
        })
    }

    pub fn storage_dir() -> PathBuf {
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".mybox")
    }

    pub fn storage_file() -> PathBuf {
        Self::storage_dir().join("projects.json")
    }

    fn load_from_disk() -> Result<ProjectStorageData> {
        let file = Self::storage_file();
        if file.exists() {
            let content = std::fs::read_to_string(&file)?;
            let data: ProjectStorageData = serde_json::from_str(&content)?;
            return Ok(data);
        }
        Ok(ProjectStorageData::default())
    }

    fn persist_to_disk(&self) -> Result<()> {
        let dir = Self::storage_dir();
        if !dir.exists() {
            std::fs::create_dir_all(&dir)?;
        }
        let file = Self::storage_file();
        let guard = self.data.lock().unwrap();
        let json = serde_json::to_string_pretty(&*guard)?;
        std::fs::write(file, json)?;
        Ok(())
    }

    pub fn list_projects(&self) -> Vec<SavedProject> {
        let guard = self.data.lock().unwrap();
        let mut list: Vec<SavedProject> = guard.projects.values().cloned().collect();
        list.sort_by(|a, b| b.last_launched_at.cmp(&a.last_launched_at));
        list
    }

    pub fn get_project_by_path(&self, path: &str) -> Option<SavedProject> {
        let guard = self.data.lock().unwrap();
        guard.projects.get(path).cloned()
    }

    pub fn save_project(&self, project: SavedProject) -> Result<()> {
        {
            let mut guard = self.data.lock().unwrap();
            guard.projects.insert(project.path.clone(), project);
        }
        self.persist_to_disk()?;
        Ok(())
    }

    pub fn remove_project(&self, path: &str) -> Result<()> {
        {
            let mut guard = self.data.lock().unwrap();
            guard.projects.remove(path);
        }
        self.persist_to_disk()?;
        Ok(())
    }

    pub fn update_status(&self, path: &str, is_running: bool, public_url: Option<String>) -> Result<()> {
        {
            let mut guard = self.data.lock().unwrap();
            if let Some(p) = guard.projects.get_mut(path) {
                p.is_running = is_running;
                if is_running {
                    p.last_launched_at = chrono::Utc::now().timestamp_millis();
                }
                p.public_url = public_url;
            }
        }
        self.persist_to_disk()?;
        Ok(())
    }
}
