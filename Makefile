# Makefile

include core/os.mk
include core/libs.mk
include core/dev.mk

.PHONY: install update info

install: install-libs install-dev

update: update-libs update-dev

info:
	@echo "Operating System: $(OS)"
	@echo "Linux Distro:     $(DISTRO)"