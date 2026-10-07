# 💻 myBox CLI Complete Reference Manual

The `mybox` command-line utility provides rapid, ultra-lightweight container management for local workstations and remote Linux/Ubuntu cloud servers.

---

## 📌 Installation

```bash
# 1. Automatic One-Line Install (Linux & macOS)
curl -fsSL https://raw.githubusercontent.com/uchitchakma/myBox/main/install.sh | sh

# 2. Or Build directly from source with Cargo
cargo install --path crates/mybox-cli
```

---

## ⚡ Command Quick Cheat Sheet

```bash
mybox ps                # List running containers
mybox ps -a             # List all containers (including stopped)
mybox up                # Launch all containers in current folder (mybox.yml)
mybox down              # Stop all containers in current folder
mybox exec <name>       # Open interactive shell inside container (alias: mybox sh)
mybox exec <name> <cmd> # Run command inside container (e.g. pip install)
mybox logs <name>       # Stream recent container logs
mybox stats             # View host CPU & RAM diagnostics
mybox prune             # Delete stopped containers & reclaim disk space
mybox server            # Start background health monitoring daemon
```

---

## 📖 Detailed Subcommands

### 1. `mybox up [--path <DIR>]`
Spins up and orchestrates all containers defined in `mybox.yml` or `docker-compose.yml`.

```bash
# Launch in current directory
mybox up

# Launch a project in a specific directory
mybox up --path ~/Projects/my-app
```

---

### 2. `mybox down [--path <DIR>]`
Gracefully stops and shuts down all containers associated with the project.

```bash
# Stop current directory project
mybox down

# Stop project in specific folder
mybox down --path ~/Projects/my-app
```

---

### 3. `mybox exec <CONTAINER> [COMMAND...]` (Alias: `mybox sh`)
Execute any command or open an interactive terminal shell inside a running container.

```bash
# Open interactive shell (defaults to /bin/sh)
mybox exec my-web-app
mybox sh my-web-app

# Run a Python pip install inside the container
mybox exec my-web-app pip install requests

# Run database migrations
mybox exec my-web-app python manage.py migrate

# Inspect files inside the container
mybox exec my-web-app ls -la /app
```

---

### 4. `mybox ps` / `mybox list`
Display all containers in a clean, colorized terminal table.

```bash
# Show running containers
mybox ps

# Show all containers (including stopped & exited)
mybox ps --all
mybox ps -a
```

---

### 5. `mybox stats`
Display real-time CPU, RAM, active engine socket, and container metrics.

```bash
mybox stats
```

---

### 6. `mybox logs <CONTAINER> [--tail N]`
Fetch and stream the last `N` lines of container logs.

```bash
# View last 100 lines (default)
mybox logs my-web-app

# View last 25 lines
mybox logs my-web-app --tail 25
```

---

### 7. `mybox start <CONTAINER>`
Start an existing stopped container.

```bash
mybox start my-web-app
```

---

### 8. `mybox stop <CONTAINER>`
Gracefully stop a running container.

```bash
mybox stop my-web-app
```

---

### 9. `mybox restart <CONTAINER>`
Restart a container instance.

```bash
mybox restart my-web-app
```

---

### 10. `mybox rm <CONTAINER> [--force]`
Remove a container from local disk.

```bash
# Remove stopped container
mybox rm old-container

# Force remove running container
mybox rm my-web-app --force
```

---

### 11. `mybox images` & `mybox rmi <IMAGE>`
Inspect and remove locally cached container images.

```bash
# List all images and their sizes
mybox images

# Delete an image
mybox rmi redis:7.2-alpine
```

---

### 12. `mybox volumes`
Inspect persistent Docker volumes and host storage mountpoints.

```bash
mybox volumes
```

---

### 13. `mybox prune`
Reclaim gigabytes of wasted disk space by safely removing all stopped containers and unused dangling images.

```bash
mybox prune
```

---

### 14. `mybox server [--port <PORT>]`
Start a lightweight background status daemon for monitoring server health.

```bash
mybox server --port 9090
```

---

## 👨‍💻 Attribution
* **🏢 Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **👨‍💻 Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **🎨 Primary Brand Color:** `#C5453E`
* **📄 License:** MIT

