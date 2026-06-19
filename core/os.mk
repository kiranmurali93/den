# core/os.mk

OS ?= $(shell uname -s)
ARCH ?= $(shell uname -m)

ifeq ($(OS),Darwin)
  DISTRO     ?= $(shell sw_vers -productName)
  OS_VERSION ?= $(shell sw_vers -productVersion)
  CHIP       ?= $(shell sysctl -n machdep.cpu.brand_string 2>/dev/null)
else
  DISTRO     ?= $(shell grep "^ID=" /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"')
  OS_VERSION ?= $(shell grep "^VERSION_ID=" /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"')
  CHIP       ?=
endif

.PHONY: check-os

check-os:
	@echo "Running Den on $(OS) ($(DISTRO))..."
