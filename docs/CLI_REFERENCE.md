# 💻 myBox CLI Reference Manual

The `mybox` command-line utility provides rapid, headless container management for workstations and remote Linux servers.

---

## 📌 Installation

```bash
# From source using Cargo
cargo install --path crates/mybox-cli

# Or download the precompiled binary from GitHub Releases
curl -sSL https://github.com/uchitchakma/myBox/releases/latest/download/mybox-linux-x86_64 -o /usr/local/bin/mybox
chmod +x /usr/local/bin/mybox
```

---

## 📖 Commands & Subcommands

### 1. `mybox ps` / `mybox list`
List running application containers in a styled table.

```bash
# List running containers
mybox ps

# List all containers (including exited and paused)
mybox ps --all
mybox ps -a
```

---

### 2. `mybox start <CONTAINER>`
Start an existing stopped container.

```bash
mybox start my-web-app
mybox start c89b21f0a12e
```

---

### 3. `mybox stop <CONTAINER>`
Gracefully stop a running container with a 10-second timeout.

```bash
mybox stop my-web-app
```

---

### 4. `mybox restart <CONTAINER>`
Restart a container instance.

```bash
mybox restart my-redis
```

---

### 5. `mybox rm <CONTAINER> [--force]`
Remove a container from local disk.

```bash
# Remove stopped container
mybox rm my-old-container

# Force remove running container
mybox rm my-web-app --force
```

---

### 6. `mybox images`
List all locally downloaded and built container images with layer sizes in Megabytes.

```bash
mybox images
```

---

### 7. `mybox rmi <IMAGE> [--force]`
Delete a container image from local storage.

```bash
mybox rmi redis:7.2-alpine
```

---

### 8. `mybox volumes`
Inspect persistent Docker volumes and host mountpoints.

```bash
mybox volumes
```

---

### 9. `mybox logs <CONTAINER> [--tail N]`
Fetch and display timestamped container logs.

```bash
mybox logs my-web-app --tail 100
```

---

### 10. `mybox stats`
Display instant host CPU, RAM, active container counts, and socket diagnostics.

```bash
mybox stats
```

---

### 11. `mybox prune`
Reclaim disk space by deleting all stopped containers and unused dangling images.

```bash
mybox prune
```

---

### 12. `mybox server [--port PORT]`
Launch a background heartbeat and HTTP status daemon for remote server health monitoring.

```bash
mybox server --port 9090
```

---

## 👨‍💻 Attribution
Developed by **[Uchit Chakma](https://uchitchakma.com)** for **[UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)**.
License: MIT.
