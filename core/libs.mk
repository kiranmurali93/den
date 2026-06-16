# core/libs.mk

.PHONY: install-libs update-libs

install-libs: check-os  ## Install system packages (git, curl, wget)
ifeq ($(OS), Darwin)
	@echo "Mac detected → install using brew (TODO)"
	# brew install git curl wget
else ifeq ($(DISTRO), fedora)
	@echo "Fedora detected → installing base packages"
	sudo dnf install -y git curl wget
else ifeq ($(DISTRO), ubuntu)
	@echo "Ubuntu detected → installing base packages"
	sudo apt update
	sudo apt install -y git curl wget
else
	@echo "Unsupported OS: $(OS) / $(DISTRO)"
endif


update-libs: check-os  ## Update system packages
ifeq ($(OS), Darwin)
	@echo "Mac detected → updating via brew"
	# brew update && brew upgrade
else ifeq ($(DISTRO), fedora)
	@echo "Fedora detected → updating system"
	sudo dnf update -y
else ifeq ($(DISTRO), ubuntu)
	@echo "Ubuntu detected → updating system"
	sudo apt update && sudo apt upgrade -y
else
	@echo "Unsupported OS: $(OS) / $(DISTRO)"
endif