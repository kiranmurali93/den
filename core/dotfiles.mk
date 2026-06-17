# core/dotfiles.mk

DOTFILES_DIR := $(shell pwd)/dotfiles

.PHONY: link-dotfiles update-dotfiles

link-dotfiles:  ## Symlink dotfiles into home directory
	@echo "Linking dotfiles..."
	@[ -f ~/.zshrc ] && ! [ -L ~/.zshrc ] && mv ~/.zshrc ~/.zshrc.bak && echo "Backed up existing ~/.zshrc to ~/.zshrc.bak" || true
	@ln -sf $(DOTFILES_DIR)/zshrc ~/.zshrc
	@echo "Linked ~/.zshrc → $(DOTFILES_DIR)/zshrc"

update-dotfiles:  ## Sync current dotfiles to repo (commit after to save)
	@cp -f ~/.zshrc $(DOTFILES_DIR)/zshrc 2>/dev/null || true
	@echo "Synced ~/.zshrc → $(DOTFILES_DIR)/zshrc (run git commit to save)"
