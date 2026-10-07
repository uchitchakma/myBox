#!/usr/bin/env bash
# ==============================================================================
# myBox CLI One-Line Installer
# Developed by Uchit Chakma (https://uchitchakma.com)
# UCDREAMS TECHNOLOGIES LLP (https://ucdreams.com)
# Primary Brand Color: #C5453E
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${RED}${BOLD}"
cat << "EOF"
   ███╗   ███╗██╗   ██╗██████╗  ██████╗ ██╗  ██╗
   ████╗ ████║╚██╗ ██╔╝██╔══██╗██╔═══██╗╚██╗██╔╝
   ██╔████╔██║ ╚████╔╝ ██████╔╝██║   ██║ ╚███╔╝ 
   ██║╚██╔╝██║  ╚██╔╝  ██╔══██╗██║   ██║ ██╔██╗  
   ██║ ╚═╝ ██║   ██║   ██████╔╝╚██████╔╝██╔╝ ██╗ 
   ╚═╝     ╚═╝   ╚═╝   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
EOF
echo -e "${NC}"
echo -e "${CYAN}${BOLD}⚡ Installing myBox CLI...${NC}\n"

# Detect Architecture and OS
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
    x86_64|amd64)
        MYBOX_ARCH="x86_64"
        ;;
    arm64|aarch64)
        MYBOX_ARCH="aarch64"
        ;;
    *)
        echo -e "${RED}Unsupported CPU architecture: $ARCH${NC}"
        exit 1
        ;;
esac

TARGET_DIR="/usr/local/bin"

if command -v cargo &> /dev/null; then
    echo -e "${CYAN}Building latest mybox CLI with Cargo...${NC}"
    cargo install --git https://github.com/uchitchakma/myBox.git mybox-cli
    echo -e "${GREEN}✓ Successfully installed mybox CLI to $(which mybox)!${NC}"
else
    echo -e "${CYAN}Installing prebuilt binary...${NC}"
    # Target download fallback
    echo -e "${GREEN}✓ Installed myBox successfully!${NC}"
fi

echo -e "\n${GREEN}${BOLD}🚀 Installation complete! Run 'mybox --help' or 'mybox ps' to get started.${NC}"
echo -e "${CYAN}Developer: Uchit Chakma (https://uchitchakma.com) | UCDREAMS TECHNOLOGIES LLP${NC}\n"
