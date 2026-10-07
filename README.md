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

## 🌟 What is myBox?

**myBox** is an open-source, ultra-lightweight container tool that lets you **run, containerize, and manage any project in isolated sandboxes** without polluting your machine with multiple language versions, database installs, or conflicting dependencies.

Unlike bloated alternatives that consume 1GB+ of idle RAM, **myBox** is written in **Rust** and **Tauri 2.0**, using only **~25MB of RAM** with instant sub-second startup!

* **🏢 Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **👨‍💻 Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **🎨 Primary Brand Color:** `#C5453E`
* **📦 Open Source Repository:** [github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)

---

## ⚡ Quick Cheat Sheet (Common Commands)

| Task | Desktop App (GUI) | CLI (`mybox`) |
| :--- | :--- | :--- |
| **Launch Project** | Click `🚀 Launch Project` ➔ Pick folder ➔ Click Launch | `cd my-project && mybox up` |
| **List Containers** | View **Dashboard** or **Containers** tab | `mybox ps` (or `mybox ps -a`) |
| **Run command inside** | Open container logs/terminal | `mybox exec <name> <cmd>` |
| **Live Shell** | Click terminal icon | `mybox exec <name>` (or `mybox sh <name>`) |
| **Stream Live Logs** | Click `Logs` button next to any container | `mybox logs <name> --tail 50` |
| **Stop Project** | Click `Stop` button | `mybox down` (or `mybox stop <name>`) |
| **Restart** | Click `Restart` button | `mybox restart <name>` |
| **Reclaim Disk Space** | Click `Prune System` button (Top Header) | `mybox prune` |
| **View System Stats** | Visual CPU & RAM graphs in Header / Stats tab | `mybox stats` |

---

## 🚀 How to Containerize & Run Any Project (In 2 Minutes)

### Option 1: Using the Desktop App (macOS & Windows)
1. Open **myBox**.
2. Click the crimson **`🚀 Launch Project`** button (in Sidebar or Header).
3. Click **`📁 Select`** (or *Browse Finder*) to pick your project folder.
4. Choose your tech stack:
   * 📦 **Fullstack + Database** (Node.js/Next.js + PostgreSQL 16)
   * ⚡ **Node.js / React / Next** (Alpine Linux runtime)
   * 🐍 **Python / FastAPI / Django** (Python 3.12 Slim runtime)
   * 🐘 **PHP / Laravel / WordPress** (PHP 8.3 + Apache runtime)
5. Click **`Launch in myBox`** — **myBox automatically creates the configuration, starts the sandbox, and connects the ports!**

---

### Option 2: Using the CLI on Terminal or Linux Servers
```bash
# 1. Navigate to your project folder
cd ~/my-projects/my-web-app

# 2. Launch all project containers
mybox up

# 3. Check status
mybox ps

# 4. View live logs
mybox logs my-web-app

# 5. Stop when finished
mybox down
```

---

## 📦 How Dependencies & Package Installs Work

In myBox, **you never install tools globally on your host OS**. The container manages all dependencies:

### 1. Python Packages (pip)
Add your packages to `requirements.txt`:
```text
fastapi
uvicorn
pandas
requests
```
myBox automatically installs them inside the container during launch!

### 2. Node.js Packages (npm)
Add your dependencies to `package.json`:
```json
{
  "dependencies": {
    "express": "^4.19.0",
    "dotenv": "^16.4.5"
  }
}
```
myBox automatically runs `npm install` inside the container.

### 3. Installing Packages On-The-Fly (Interactive Exec)
To run a command or install something immediately in a running container:
```bash
# Open an interactive shell inside the container
mybox exec my-web-app

# Run a one-off command inside the container
mybox exec my-web-app pip install requests
mybox exec my-web-app npm install lodash
```

---

## 💻 CLI Reference Manual

```bash
# List all running containers
mybox ps

# List all containers including stopped ones
mybox ps --all

# View instant CPU & Memory metrics
mybox stats

# Inspect local container images
mybox images

# Inspect persistent storage volumes
mybox volumes

# View last 100 log lines
mybox logs <container_name_or_id> --tail 100

# Start, Stop, Restart, Remove
mybox start <container>
mybox stop <container>
mybox restart <container>
mybox rm <container> --force

# Clean up dangling images and stopped containers
mybox prune

# Start background server daemon for health monitoring
mybox server --port 9090

# View system and socket diagnostics
mybox info
```

---

## 🛠️ Building From Source

### Prerequisites
* **Rust (1.75+)**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
* **Node.js (18+)**: `node -v`

### 1. Run Desktop App in Development Mode:
```bash
# Install UI dependencies
cd frontend && npm install

# Run Tauri desktop app with hot reload
cd ../crates/mybox-desktop
cargo tauri dev
```

### 2. Build Production Desktop App:
```bash
cd crates/mybox-desktop
npm --prefix ../../frontend exec tauri build
```
Outputs:
* **macOS:** `target/release/bundle/macos/myBox.app` & `.dmg`
* **Windows:** `target/release/bundle/msi/myBox.msi`
* **Linux:** `target/release/bundle/deb/mybox.deb` & `.AppImage`

### 3. Build Headless CLI:
```bash
cargo build --release -p mybox-cli
# Output binary: target/release/mybox
```

---

## 📄 License & Attribution

This project is free and open-source under the **[MIT License](LICENSE)**.

* **Created by:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **Website:** [ucdreams.com](https://ucdreams.com) • [uchitchakma.com](https://uchitchakma.com)
* **GitHub:** [https://github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)

