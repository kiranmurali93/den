# core/dotfiles.mk

DOTFILES_DIR    := $(shell pwd)/dotfiles
ZSH_CUSTOM_DIR  := $(HOME)/.oh-my-zsh/custom

.PHONY: link-dotfiles unlink-dotfiles update-dotfiles install-missing-zsh-plugins

link-dotfiles:  ## Symlink dotfiles, then auto-install any missing zsh plugins
	@echo "Linking dotfiles..."
	@[ -f ~/.zshrc ] && ! [ -L ~/.zshrc ] && mv ~/.zshrc ~/.zshrc.bak && echo "Backed up existing ~/.zshrc to ~/.zshrc.bak" || true
	@ln -sf $(DOTFILES_DIR)/zshrc ~/.zshrc
	@echo "Linked ~/.zshrc → $(DOTFILES_DIR)/zshrc"
	@$(MAKE) --no-print-directory install-missing-zsh-plugins

unlink-dotfiles:  ## Remove dotfile symlinks and restore backups
	@if [ -L ~/.zshrc ]; then rm -f ~/.zshrc && echo "Removed symlink ~/.zshrc"; fi
	@if [ -f ~/.zshrc.bak ]; then mv ~/.zshrc.bak ~/.zshrc && echo "Restored ~/.zshrc from ~/.zshrc.bak"; fi

update-dotfiles:  ## Sync current dotfiles to repo (commit after to save)
	@cp -f ~/.zshrc $(DOTFILES_DIR)/zshrc 2>/dev/null || true
	@echo "Synced ~/.zshrc → $(DOTFILES_DIR)/zshrc (run git commit to save)"

# Source zshrc, capture oh-my-zsh "plugin '<name>' not found" warnings, and
# clone each missing plugin into $ZSH_CUSTOM/plugins. Names map to different
# upstream orgs, so resolve known plugins via a lookup; default to the
# zsh-users org for anything unrecognized.
install-missing-zsh-plugins:  ## Install oh-my-zsh plugins reported missing by zshrc
	@command -v zsh >/dev/null 2>&1 || { echo "zsh not installed — skipping plugin install"; exit 0; }
	@[ -d "$(ZSH_CUSTOM_DIR)" ] || { echo "oh-my-zsh not found at ~/.oh-my-zsh — skipping plugin install"; exit 0; }
	@missing=$$(zsh -ic 'exit' 2>&1 | sed -n "s/.*plugin '\([^']*\)' not found.*/\1/p" | sort -u); \
	if [ -z "$$missing" ]; then echo "All zsh plugins present."; exit 0; fi; \
	for name in $$missing; do \
		case "$$name" in \
			fast-syntax-highlighting) url="https://github.com/zdharma-continuum/fast-syntax-highlighting" ;; \
			zsh-autocomplete)         url="https://github.com/marlonrichert/zsh-autocomplete" ;; \
			*)                        url="https://github.com/zsh-users/$$name" ;; \
		esac; \
		echo "Installing missing plugin: $$name ($$url)"; \
		git clone --depth=1 "$$url" "$(ZSH_CUSTOM_DIR)/plugins/$$name" || echo "  ! failed to clone $$name"; \
	done; \
	echo "Done. Re-source your shell: source ~/.zshrc"
