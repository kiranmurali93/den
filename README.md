# Den — Simple Dev Environment Bootstrap

Den is a lightweight Makefile-based tool to **set up and manage your development environment** across machines.

---

## Project Structure

```
den/
├── Makefile          # Entry point
├── dotfiles/         # Tracked dotfiles (zshrc, etc.)
└── core/
    ├── os.mk         # OS + distro detection
    ├── libs.mk       # System packages (dnf, apt, etc.)
    ├── dev.mk        # Dev tools (NVM, etc.)
    ├── dotfiles.mk   # Symlink dotfiles, install missing zsh plugins
    └── obsidian.mk   # Syncthing + Obsidian vault setup
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

### Dotfiles (`dotfiles.mk`)

* `make link-dotfiles` — symlinks tracked dotfiles (e.g. `~/.zshrc`) into place, backing up any existing file, and auto-installs any oh-my-zsh plugins reported missing
* `make unlink-dotfiles` — removes the symlinks and restores the backup
* `make update-dotfiles` — copies your current `~/.zshrc` back into the repo so changes can be committed

---

### Obsidian / Syncthing (`obsidian.mk`)

* `make install-syncthing` — installs Syncthing and enables it as a systemd user service
* `make syncthing-status` — shows whether Syncthing is running and the web UI URL
* `make setup-vault` — prints your device ID and next steps for syncing your Obsidian vault (`$(VAULT_PATH)`, default `~/secondary-brain`)

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
