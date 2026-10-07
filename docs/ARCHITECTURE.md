# 🏛️ myBox System Architecture

This document provides a technical deep-dive into the architectural design of **myBox**, explaining how the Rust core engine, headless CLI, Tauri desktop application, and React frontend operate together with minimal resource usage.

---

## 📐 High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DESKTOP USER (GUI)                            │
│                     React 18 + Tailwind UI (Vite)                      │
│                Primary Color: #C5453E | Glassmorphism                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Tauri 2.0 IPC Invoke Bridge
┌───────────────────────────────────▼────────────────────────────────────┐
│                         TAURI RUNTIME CRATE                            │
│                       (crates/mybox-desktop)                           │
│              Command Handlers & Realtime State Manager                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Rust Internal Crate Link
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                          CORE ENGINE CRATE                             │
│                         (crates/mybox-core)                            │
│  • Socket Discovery & Health Check   • Docker / Podman / containerd    │
│  • System Hardware Metrics (sysinfo) • Container & Storage Lifecycle   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                                    │ Rust Internal Crate Link
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                          HEADLESS CLI CRATE                            │
│                          (crates/mybox-cli)                            │
│                `mybox` Terminal Executable for Servers                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Workspace Crates Breakdown

### 1. `mybox-core` (Shared Engine)
* **Role:** The foundational library containing all domain models, container socket clients, and hardware metric collectors.
* **Key Modules:**
  * `docker.rs`: Intelligent multi-runtime socket discovery. Scans `/var/run/docker.sock`, OrbStack, Colima, rootless Podman paths, and Windows named pipes (`//./pipe/docker_engine`).
  * `stats.rs`: High-efficiency hardware metrics gathering via `sysinfo` without triggering unnecessary garbage collection or memory allocations.
  * `models.rs`: Strongly-typed serializable structs for containers, images, volumes, ports, and logs.
  * `config.rs`: Persistent JSON configuration handling in standard OS user config directories.

### 2. `mybox-cli` (Headless CLI)
* **Role:** A standalone binary compiled to native machine code (`mybox`) intended for servers, CI/CD runners, and developer terminal workflows.
* **Features:** Formatted ANSI tables with `#C5453E` custom color accents, interactive spinners (`indicatif`), and a daemon mode (`mybox server`).

### 3. `mybox-desktop` (Tauri 2.0 GUI)
* **Role:** The desktop application wrapper utilizing native OS web engines:
  * **macOS:** Native WebKit (Safari engine)
  * **Windows:** WebView2 (Microsoft Edge Chromium engine)
  * **Linux / Ubuntu:** WebKitGTK
* **Memory Footprint:** ~25MB total RAM usage on idle, freeing host resources for developer workloads.

---

## ⚡ Zero-Idle Efficiency Model

Standard container desktop apps leave heavy background Chromium and node daemons running at all times. In myBox:
1. **Event-Driven Polling:** Metrics refresh on a configurable interval (default: 3 seconds) and can pause when minimized.
2. **Native WebViews:** No bundled Chromium binaries in installer packages.
3. **Rust Concurrency:** All socket operations leverage `tokio` asynchronous I/O to avoid blocking main threads.

---

## 🏢 Creators & Maintainers
* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **Open Source Repository:** [https://github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)
