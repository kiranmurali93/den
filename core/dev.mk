# core/dev.mk

.PHONY: install-dev update-dev install-nvm update-nvm

# -----------------------
# NVM
# -----------------------

install-nvm: check-os
	@echo "Installing NVM..."
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

	@echo "Configuring NVM in ~/.zshrc..."
	@grep -q 'NVM_DIR' ~/.zshrc || echo '\nexport NVM_DIR="$$HOME/.nvm"' >> ~/.zshrc
	@grep -q 'nvm.sh' ~/.zshrc || echo '[ -s "$$NVM_DIR/nvm.sh" ] && \. "$$NVM_DIR/nvm.sh"' >> ~/.zshrc
	@grep -q 'bash_completion' ~/.zshrc || echo '[ -s "$$NVM_DIR/bash_completion" ] && \. "$$NVM_DIR/bash_completion"' >> ~/.zshrc

	@echo "NVM installed and configured. Run: source ~/.zshrc"

update-nvm: check-os
	@echo "Updating NVM..."
	cd ~/.nvm && git pull


# -----------------------
# DEV ENTRY POINT
# -----------------------

install-dev: install-nvm

update-dev: update-nvm