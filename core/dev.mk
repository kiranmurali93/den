# core/dev.mk

.PHONY: install-dev update-dev install-nvm update-nvm

# -----------------------
# NVM
# -----------------------

install-nvm: check-os  ## Install NVM (Node Version Manager)
	@echo "Installing NVM..."
	curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
	@echo "NVM installed. Run: source ~/.zshrc"

update-nvm: check-os  ## Update NVM to latest
	@echo "Updating NVM..."
	@[ -d ~/.nvm/.git ] || { echo "NVM not installed or not a git clone. Run: make install-nvm"; exit 1; }
	cd ~/.nvm && git pull


# -----------------------
# DEV ENTRY POINT
# -----------------------

install-dev: install-nvm  ## Install all dev tools

update-dev: update-nvm  ## Update all dev tools
