# core/os.mk

OS ?= $(shell uname -s)
DISTRO ?= $(shell grep "^ID=" /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"')

.PHONY: check-os

check-os:
	@echo "Running Den on $(OS) ($(DISTRO))..."