# 📘 How myBox Works: Complete Guide to Containerization & Unboxing

Welcome to **myBox**! This guide is written for everyone — whether you are a beginner writing your first app or a DevOps engineer managing remote Linux servers.

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

### Step 3: Auto-Detection & Stacks
myBox automatically identifies your project framework:
* 📦 **Fullstack Multi-Service:** Frontend + Backend + PostgreSQL + Redis.
* ⚡ **Next.js / React / Vite / Vue / Nuxt / SvelteKit / Astro / Remix**
* 🐍 **Python / FastAPI / Django / Flask / Streamlit**
* 🐘 **PHP / Laravel / WordPress**
* 🦀 **Rust / Axum / Actix**
* 🐹 **Go / Gin / Fiber**
* ☕ **Java / Spring Boot**
* 🔷 **.NET / C# / ASP.NET Core**
* 🦋 **Flutter Web**

### Step 4: Click `Launch in myBox`
**myBox** will automatically:
1. Generate `mybox.yaml` in your project folder.
2. Spin up the isolated container sandboxes.
3. Stream real-time logs and live CPU/RAM meters.

---

## 🗑️ 3. How to Remove / De-containerize (Unbox)

If you decide you no longer want to run your project in a container or want to reset:

### In the Desktop App:
1. Open the Launch Project modal and select your folder.
2. Click **`Unbox Project`** (or *De-containerize*).
3. Confirm the action — myBox will shut down the containers and remove `mybox.yaml`.

### In the Terminal / CLI:
```bash
# De-containerize current folder
mybox unbox

# De-containerize a specific path
mybox unbox --path ~/Projects/my-app
```

---

## 💻 4. Using the Server CLI (`mybox`)

On headless Linux servers (Ubuntu, Debian, AWS, DigitalOcean) where there is no GUI:

### Common Daily Workflow:
```bash
# 1. Enter your project directory
cd /var/www/my-project

# 2. Auto-detect framework
mybox init

# 3. Launch the project containers
mybox up

# 4. View live status
mybox ps

# 5. View real-time logs
mybox logs my-app --tail 50

# 6. Open an interactive shell inside the container
mybox exec my-app

# 7. Stop containers
mybox down

# 8. Unbox / Remove
mybox unbox
```

---

## 📦 5. How to Install Libraries & Tools

| Goal | What to do |
| :--- | :--- |
| **Install Python packages** | Add packages to `requirements.txt`. myBox auto-installs them on launch. |
| **Install Node.js packages** | Add packages to `package.json`. myBox auto-runs `npm install`. |
| **Install system tools (ffmpeg, curl)** | Add `RUN apt-get install -y ffmpeg` to your `Dockerfile`. |
| **Run command inside live container** | Run `mybox exec <container-name> <command>`. |

---

## 🧹 6. Reclaiming Disk Space

Containers and old build layers can take up disk space over time.

* **In the App:** Click the **`Prune System`** button in the top navigation bar.
* **In the CLI:** Run `mybox prune`.

myBox will instantly delete all stopped containers, dangling images, and report how many Megabytes were freed!

---

## 🏢 Attribution & Support
* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **GitHub Repository:** [https://github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)
