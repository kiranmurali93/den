# Makefile

SHELL := /bin/bash
.SHELLFLAGS := -eo pipefail -c

ifeq ($(wildcard core/os.mk),)
$(error Run make from the repo root directory)
endif

include core/os.mk
include core/libs.mk
include core/dev.mk
include core/dotfiles.mk
include core/obsidian.mk

.PHONY: install update info help

install: install-libs install-dev install-syncthing  ## Install system packages and dev tools
update: update-libs update-dev                       ## Update system packages and dev tools

info:                              ## Show system information
ifeq ($(OS),Darwin)
	@echo "Operating System: $(DISTRO) $(OS_VERSION)"
	@echo "Architecture:     $(ARCH)"
	@echo "Chip:             $(CHIP)"
else
	@echo "Operating System: $(OS)"
	@echo "Linux Distro:     $(DISTRO) $(OS_VERSION)"
	@echo "Architecture:     $(ARCH)"
endif

help:                              ## List all available commands
	@grep -hE '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  %-15s %s\n", $$1, $$2}'
