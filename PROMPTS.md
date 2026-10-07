# 🤖 myBox: AI Prompt Documentation & Developer Blueprints

This document contains specialized system prompts, engineering patterns, and ready-to-use developer prompts for extending and maintaining the **myBox** codebase using AI assistants (Claude, ChatGPT, Gemini, Copilot, Antigravity).

---

## 🧭 Project Context & Identity Prompt

Use this base context prompt whenever starting a new AI session to work on myBox:

```markdown
You are an expert systems and full-stack software engineer working on "myBox", an open-source, ultra-lightweight container desktop application and server CLI created by UCDREAMS TECHNOLOGIES LLP (ucdreams.com) and lead developer Uchit Chakma (uchitchakma.com).

Project Specifications:
- Backend Engine: Rust (Cargo workspace with `mybox-core`, `mybox-cli`, and `mybox-desktop`)
- Frontend UI: React 18, Vite, TypeScript, Tailwind CSS
- Desktop Framework: Tauri 2.0 (macOS, Windows, Linux / Ubuntu)
- Primary Brand Color: #C5453E
- Design Principles: Ultra-low RAM footprint (~25MB), zero background bloat, clean dark mode glassmorphism UI, instant startup
- Repository: https://github.com/uchitchakma/myBox
```

---

## 🛠️ Feature Expansion Prompts

### Prompt 1: Adding a Real-Time Container Exec Terminal (Interactive Shell)
```markdown
Context: myBox needs an in-app interactive terminal (Xterm.js) that allows developers to run `/bin/sh` or `/bin/bash` inside a running container.

Task:
1. In `crates/mybox-core/src/docker.rs`, implement `attach_container_exec(id: &str, cmd: &[&str])` using Bollard's exec stream API.
2. In `crates/mybox-desktop/src/lib.rs`, add a Tauri channel or WebSocket/IPC command to stream stdin/stdout bidirectionally.
3. In `frontend/src/components/TerminalModal.tsx`, integrate `@xterm/xterm` and `@xterm/addon-fit` to render a terminal matching the `#C5453E` brand accent theme.
4. Ensure all code compiles cleanly across macOS, Windows, and Linux.
```

---

### Prompt 2: Adding Docker Compose File Visualizer & Manager
```markdown
Context: Developers want to inspect, start, and stop multi-container `docker-compose.yml` services directly inside myBox.

Task:
1. In `crates/mybox-core`, add a parser for `docker-compose.yml` that identifies services, networks, volumes, and dependency graphs (`depends_on`).
2. Add CLI subcommand `mybox compose [up|down|ps|logs]`.
3. In `frontend/src/components/ComposeView.tsx`, create an interactive visual service topology graph with status badges for each service container.
4. Use Tailwind CSS with primary color `#C5453E` and dark slate panels.
```

---

### Prompt 3: Building a Custom Local DNS & Port Proxy
```markdown
Context: Replace port memorization (e.g. `localhost:3000`, `localhost:8080`) with automatic local `.local` domains (e.g. `web.mybox.local`).

Task:
1. In `crates/mybox-core`, create a lightweight reverse proxy using `hyper` / `tokio` that binds to port 80/443 and routes hostname headers to the respective container's exposed port.
2. Expose controls in the Tauri Settings panel to toggle the proxy on/off and configure custom domain names.
3. Add a CLI command `mybox proxy status`.
```

---

### Prompt 4: Porting Micro-VM Engine for Bare-Metal macOS / Windows Isolation
```markdown
Context: Create a native hypervisor backend for myBox using Apple's `Virtualization.framework` (macOS) and Hyper-V/WSL2 (Windows) so Linux containers can run even without Docker Desktop installed.

Task:
1. Implement a lightweight Alpine Linux VM bootloader in Rust using `apple-vz` or `libkrun`.
2. Configure VirtioFS for sub-millisecond host file sharing.
3. Forward the containerd socket into `/var/run/mybox.sock`.
4. Ensure zero-idle memory release when no containers are running.
```

---

## 🧪 Testing & Validation Prompts

### Prompt: Automated Unit & Integration Testing
```markdown
Task:
1. Write Rust integration tests in `crates/mybox-core/tests/` that mock Docker API responses and test socket reconnection routines.
2. Write React component tests using Vitest and React Testing Library for `ContainersView.tsx` and `Dashboard.tsx`.
3. Ensure CI pipeline executes `cargo test --workspace` and `npm run test` without external Docker daemon dependencies.
```

---

## 📋 Code Style & Design Guidelines

* **Rust Code**: Idiomatic Rust with clean error propagation using `anyhow` and `thiserror`. Avoid unnecessary allocations in hot metric polling loops.
* **UI Design**: Strictly adhere to the `#C5453E` primary brand palette, dark zinc backgrounds (`#09090b` / `#18181b`), subtle glassmorphism borders (`rgba(255, 255, 255, 0.08)`), and crisp typography.
* **Attribution**: Preserve credit to **UCDREAMS TECHNOLOGIES LLP** and **Uchit Chakma** across headers, documentation, and the About window.
