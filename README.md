# Den — Simple Dev Environment Bootstrap

Den is a lightweight Makefile-based tool to **set up and manage your development environment** across machines.

---

## Project Structure

```
den/
├── Makefile          # Entry point
└── core/
    ├── os.mk         # OS + distro detection
    ├── libs.mk       # System packages (dnf, apt, etc.)
    └── dev.mk        # Dev tools (NVM, etc.)
```

---

## Usage

### Install everything

```
make install
```

### Update system + dev tools

```
make update
```

### Check OS info

```
make info
```

---

## What it does

### System Setup (`libs.mk`)

* Detects OS and distro
* Installs base packages:

  * git
  * curl
  * wget

Supports:

* Fedora (dnf)
* Ubuntu (apt)
* macOS (planned)

---

### Dev Setup (`dev.mk`)

* Installs NVM (Node Version Manager)
* Automatically configures `~/.zshrc`
* Loads NVM in the current session

---

## Note on NVM

After installation, NVM is:

* Added to your `.zshrc`
* Loaded during install

For full shell availability:

```
source ~/.zshrc
```

---

## TODO

* Add macOS (brew) support
* Auto-install Node LTS using NVM
* Add pnpm/yarn global setup
* Add Go installation
* Add Docker setup
* Add Kafka/local services setup
* Create `make setup` for full bootstrap
* Improve error handling
* Add logging for installs/updates

---

## Quick Start

```
git clone <your-repo>
cd den
make install
```
