# core/obsidian.mk

VAULT_PATH := $(HOME)/secondary-brain

.PHONY: install-syncthing syncthing-status setup-vault

# -----------------------
# SYNCTHING
# -----------------------

install-syncthing: check-os  ## Install Syncthing and enable as a systemd service
ifeq ($(DISTRO), fedora)
	@echo "Installing Syncthing..."
	@sudo dnf install -y syncthing
	@echo "Enabling Syncthing service for $(USER)..."
	@systemctl --user enable --now syncthing
	@echo ""
	@echo "Syncthing is running. Open http://localhost:8384 to configure."
	@echo "Run: make setup-vault"
else
	@echo "Unsupported distro for auto-install: $(DISTRO)"
	@exit 1
endif

syncthing-status:  ## Show Syncthing service status and web UI URL
	@systemctl --user is-active syncthing >/dev/null 2>&1 \
		&& echo "Syncthing: running" \
		|| echo "Syncthing: stopped (run: make install-syncthing)"
	@echo "Web UI: http://localhost:8384"

setup-vault:  ## Print device ID and vault setup instructions
	@systemctl --user is-active syncthing >/dev/null 2>&1 || { \
		echo "Syncthing is not running. Run: make install-syncthing"; exit 1; \
	}
	@echo ""
	@echo "Vault path: $(VAULT_PATH)"
	@[ -d "$(VAULT_PATH)" ] || echo "  Warning: $(VAULT_PATH) does not exist yet — create it or open Obsidian first"
	@echo ""
	@echo "Device ID:"
	@syncthing --device-id
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open http://localhost:8384"
	@echo "  2. Add Folder → set path to $(VAULT_PATH)"
	@echo "  3. On your Android device, install Syncthing-Fork (Play Store)"
	@echo "  4. Share this Device ID with your Android and add it as a peer"
