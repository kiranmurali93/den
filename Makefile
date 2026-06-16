# Makefile

include core/os.mk
include core/libs.mk
include core/dev.mk

.PHONY: install update info help

install: install-libs install-dev  ## Install system packages and dev tools
update: update-libs update-dev     ## Update system packages and dev tools

info:                              ## Show current OS and distro
	@echo "Operating System: $(OS)"
	@echo "Linux Distro:     $(DISTRO)"

help:                              ## List all available commands
	@grep -hE '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  %-15s %s\n", $$1, $$2}'