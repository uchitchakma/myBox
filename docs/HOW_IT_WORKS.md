# 📘 How myBox Works: Beginner's Guide to Containerization

Welcome to **myBox**! This guide is written for everyone — whether you are a beginner writing your first app or a senior DevOps engineer managing remote Linux servers.

---

## 🌟 1. The Core Idea: What is a Container?

Without containers, running a project on your computer requires manually installing the exact version of Node.js, Python, PostgreSQL, and system packages. If someone else runs your project with a different version, it fails with *"It worked on my machine!"*.

With **myBox**, your code runs inside a sealed, lightweight **sandbox (container)** that includes its own exact runtime, dependencies, and environment.

```
┌────────────────────────────────────────────────────────┐
│                   YOUR HOST COMPUTER                   │
│                     (macOS / Windows / Linux)          │
│                                                        │
│  ┌─────────────────────────┐ ┌──────────────────────┐  │
│  │   Sandbox 1: Python API │ │ Sandbox 2: React App │  │
│  │   - Python 3.12 (Slim)  │ │ - Node.js 20         │  │
│  │   - FastAPI + Pandas    │ │ - Vite + Tailwind    │  │
│  │   - Port 8000           │ │ - Port 3000          │  │
│  └─────────────────────────┘ └──────────────────────┘  │
│                                                        │
│                  Managed by ⚡ myBox                   │
└────────────────────────────────────────────────────────┘
```

---

## 🖥️ 2. Using the Desktop App (GUI)

The desktop app is designed for local development on **macOS** and **Windows**.

### Step 1: Open the Launch Wizard
Click the crimson **`🚀 Launch Project`** button located in the sidebar or top header.

### Step 2: Choose Your Folder
Click **`📁 Select`** (or *Browse Finder*) to pick your project folder from your files.

### Step 3: Select Stack Preset
Choose your technology:
* 📦 **Fullstack + Database:** Node.js app connected to a PostgreSQL 16 database.
* ⚡ **Node.js / React / Next:** High-performance Node.js Alpine sandbox.
* 🐍 **Python / FastAPI / Django:** Python 3.12 with pip requirements auto-install.
* 🐘 **PHP / Laravel / WordPress:** PHP 8.3 with Apache web server.

### Step 4: Click `Launch in myBox`
**myBox** will automatically:
1. Detect or create your `mybox.yml` configuration.
2. Spin up the isolated container sandbox.
3. Stream real-time logs and live CPU/RAM meters.

---

## 💻 3. Using the Server CLI (`mybox`)

On headless Linux servers (Ubuntu, Debian, AWS, DigitalOcean) where there is no GUI:

### Common Daily Workflow:
```bash
# 1. Enter your project directory
cd /var/www/my-project

# 2. Launch the project containers
mybox up

# 3. View live status
mybox ps

# 4. View real-time logs
mybox logs my-app --tail 50

# 5. Open an interactive shell inside the container
mybox exec my-app

# 6. Stop containers
mybox down
```

---

## 📦 4. How to Install Libraries & Tools

| Goal | What to do |
| :--- | :--- |
| **Install Python packages** | Add packages to `requirements.txt`. myBox auto-installs them on launch. |
| **Install Node.js packages** | Add packages to `package.json`. myBox auto-runs `npm install`. |
| **Install system tools (ffmpeg, curl)** | Add `RUN apt-get install -y ffmpeg` to your `Dockerfile`. |
| **Run command inside live container** | Run `mybox exec <container-name> <command>`. |

---

## 🧹 5. Reclaiming Disk Space

Containers and old build layers can take up disk space over time.

* **In the App:** Click the **`Prune System`** button in the top navigation bar.
* **In the CLI:** Run `mybox prune`.

myBox will instantly delete all stopped containers, dangling images, and report how many Megabytes were freed!

---

## 🏢 Attribution & Support
* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **GitHub Repository:** [https://github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)
