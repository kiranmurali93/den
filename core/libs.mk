# core/libs.mk

.PHONY: install-libs update-libs

ifeq ($(OS), Darwin)
  _PKG_INSTALL := echo "Mac detected → install using brew (TODO)"
  _PKG_UPDATE  := echo "Mac detected → updating via brew (TODO)"
else ifeq ($(DISTRO), fedora)
  _PKG_INSTALL := sudo dnf install -y git curl wget
  _PKG_UPDATE  := sudo dnf update -y
else ifeq ($(DISTRO), ubuntu)
  _PKG_INSTALL := sudo apt update && sudo apt install -y git curl wget
  _PKG_UPDATE  := sudo apt update && sudo apt upgrade -y
else
  _PKG_INSTALL := echo "Unsupported OS: $(OS) / $(DISTRO)" && exit 1
  _PKG_UPDATE  := echo "Unsupported OS: $(OS) / $(DISTRO)" && exit 1
endif

install-libs: check-os  ## Install system packages (git, curl, wget)
	@$(_PKG_INSTALL)

update-libs: check-os   ## Update system packages
	@$(_PKG_UPDATE)
