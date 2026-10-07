# Contributing to myBox

Thank you for your interest in contributing to **myBox**! We welcome community contributions from developers around the world to build the lightest, fastest container desktop and CLI on earth.

myBox is open-source software maintained by **[UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)** and **[Uchit Chakma](https://uchitchakma.com)**.

---

## 🚀 How to Get Started

1. **Fork the repository** on GitHub: [https://github.com/uchitchakma/myBox](https://github.com/uchitchakma/myBox)
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/myBox.git
   cd myBox
   ```
3. **Create a new feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

---

## 🛠️ Development Workflow

### Rust Backend
* Format Rust code before committing:
  ```bash
  cargo fmt --all
  ```
* Run linter:
  ```bash
  cargo clippy --workspace -- -D warnings
  ```
* Run tests:
  ```bash
  cargo test --workspace
  ```

### React Frontend
* Install dependencies:
  ```bash
  cd frontend
  npm install
  ```
* Run dev server:
  ```bash
  npm run dev
  ```
* Typecheck and build:
  ```bash
  npm run build
  ```

---

## 🎨 UI Guidelines

* Stick to the primary brand color **`#C5453E`** for active states, badges, and accents.
* Keep the interface ultra-clean with dark mode backgrounds (`bg-zinc-950`, `bg-zinc-900`).
* Maintain responsive design across macOS, Windows, and Linux window resolutions.

---

## 📮 Submitting Pull Requests

1. Commit your changes with clear messages (`feat:`, `fix:`, `docs:`, `perf:`).
2. Push to your branch and open a Pull Request against `main`.
3. Ensure CI checks pass on all target OS matrices (macOS, Windows, Ubuntu).

Thank you for helping make container management lighter and faster for everyone!
