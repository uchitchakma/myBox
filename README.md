# ⚡ myBox

<div align="center">
  <img src="frontend/public/logo.svg" alt="myBox Logo" width="100" />
  <h3>The Ultra-Lightweight, Modern Container Desktop & Headless CLI</h3>
  <p><strong>Code Once, Run Everywhere: macOS • Windows • Linux / Ubuntu</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-C5453E.svg)](https://opensource.org/licenses/MIT)
  [![Tauri](https://img.shields.io/badge/Tauri-2.0-C5453E?logo=tauri)](https://tauri.app/)
  [![Rust](https://img.shields.io/badge/Rust-1.75+-orange?logo=rust)](https://www.rust-lang.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Primary Brand](https://img.shields.io/badge/Brand%20Color-%23C5453E-C5453E)](#)
</div>

---

## 🌟 Overview

**myBox** is an open-source, ultra-lightweight, and high-performance container management tool engineered with **Tauri 2.0**, **Rust**, and **React**.

Unlike heavy alternatives that bundle a full Chromium browser and consume 500MB+ of idle RAM, **myBox** runs natively on your operating system’s web engine and hypervisor interfaces, consuming only **~25MB of RAM** with **instant startup**.

* **🏢 Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **👨‍💻 Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **🎨 Primary Brand Color:** `#C5453E`
* **📦 Open Source Repository:** [github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)

---

## 🚀 Key Features

* **⚡ Ultra-Lightweight Footprint:** ~12MB installer size and ~25MB idle memory usage.
* **🖥️ Dual Mode:**
  * **Desktop GUI App:** Sleek dark-mode interface with live resource graphs, container controls, and log streaming.
  * **Headless CLI (`mybox`):** High-speed terminal utility for local development and Linux/Ubuntu servers.
* **🌐 Cross-Platform:** Single unified Rust & React codebase targeting macOS (Apple Silicon & Intel), Windows 10/11, and Linux (Ubuntu, Debian, Fedora, Arch).
* **🔌 Socket Compatibility:** Auto-detects standard Docker sockets, OrbStack, Colima, rootless Podman, and Windows named pipes.
* **🧹 One-Click Prune:** Instant disk reclamation for stopped containers and dangling image layers.
* **📜 Real-time Log Streaming:** Integrated terminal-style log inspector with instant copy functionality.

---

## 🏗️ Architecture

```
myBox/
├── Cargo.toml                  # Cargo Workspace configuration
├── crates/
│   ├── mybox-core/             # Shared Rust container engine & metrics collector
│   ├── mybox-cli/              # Headless CLI binary (`mybox`)
│   └── mybox-desktop/          # Tauri 2.0 Desktop wrapper & native IPC
├── frontend/                   # Modern React + Vite + TypeScript + Tailwind UI
│   ├── src/components/         # Dashboard, Containers, Images, Volumes, Logs, Stats
│   └── src/api.ts              # Tauri IPC bridge + Mock dev fallback
├── docs/                       # Architecture & CLI manuals
└── PROMPTS.md                  # Comprehensive AI Prompt Documentation Guide
```

---

## 💻 CLI Quickstart (`mybox`)

The `mybox` binary can be used standalone on any server or workstation without launching the GUI:

```bash
# List all running containers (alias: ps)
mybox ps

# List all containers (including stopped)
mybox ps --all

# Live host CPU & RAM diagnostics
mybox stats

# Inspect local container images
mybox images

# Inspect persistent volumes
mybox volumes

# View logs for a container
mybox logs <container_name_or_id> --tail 50

# Start / Stop / Restart / Remove
mybox start <container>
mybox stop <container>
mybox restart <container>
mybox rm <container> --force

# Reclaim disk space
mybox prune

# Start the headless server monitor daemon
mybox server --port 9090
```

---

## 🛠️ Development & Building

### Prerequisites
* **Rust** (1.75+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
* **Node.js** (v18+ / v20+): `node -v`
* **Package Manager**: `npm`, `pnpm`, or `bun`

### 1. Run the Desktop App in Development Mode
```bash
# Install frontend dependencies
cd frontend
npm install

# Start Tauri in development mode (launches the native desktop window with hot reload)
cd ../crates/mybox-desktop
cargo tauri dev
```

### 2. Build the Desktop Installers
```bash
cd crates/mybox-desktop
cargo tauri build
```
Outputs:
* **macOS:** `target/release/bundle/dmg/myBox_0.1.0_universal.dmg`
* **Windows:** `target/release/bundle/msi/myBox_0.1.0_x64_en-US.msi`
* **Linux / Ubuntu:** `target/release/bundle/deb/mybox_0.1.0_amd64.deb` and `.AppImage`

### 3. Build the Headless CLI
```bash
cargo build --release -p mybox-cli
# The binary will be available at: target/release/mybox
```

---

## 📄 License & Attribution

This project is open-source under the **[MIT License](LICENSE)**.

* **Created by:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Developed by:** [Uchit Chakma](https://uchitchakma.com)
* **GitHub:** [https://github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)
