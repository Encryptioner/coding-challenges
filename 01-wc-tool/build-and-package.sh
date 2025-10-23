#!/usr/bin/env bash
#
# build-and-package.sh - Automated build and packaging script for ccwc
#
# This script automates the entire workflow from dependency installation
# to creating distribution packages. It handles:
#   - Platform detection (macOS, Linux, BSD)
#   - Dependency verification
#   - Building the project
#   - Running tests
#   - Creating distribution packages
#
# Usage:
#   ./build-and-package.sh [options]
#
# Options:
#   -d, --deps         Install dependencies only
#   -b, --build TYPE   Build only (TYPE: normal, static, debug)
#   -t, --test         Run tests only
#   -p, --package      Create package only
#   -a, --all          Do everything (deps, build, test, package)
#   -h, --help         Show this help message
#
# Examples:
#   ./build-and-package.sh -a                 # Full automated setup
#   ./build-and-package.sh -b normal          # Build only
#   ./build-and-package.sh -d -b normal -t    # Install deps, build, test
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project information
PROJECT_NAME="ccwc"
VERSION="1.0.0"
BINARY_NAME="ccwc"

# Directories
DIST_DIR="dist"
BUILD_DIR="."

#
# Helper Functions
#

# Print colored message
print_msg() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_header() {
    echo ""
    print_msg "$BLUE" "========================================"
    print_msg "$BLUE" "  $1"
    print_msg "$BLUE" "========================================"
}

print_error() {
    print_msg "$RED" "ERROR: $1"
}

print_success() {
    print_msg "$GREEN" "✓ $1"
}

print_warning() {
    print_msg "$YELLOW" "⚠ $1"
}

#
# Platform Detection
#

detect_platform() {
    print_header "Detecting Platform"

    UNAME_S=$(uname -s)
    UNAME_M=$(uname -m)

    case "$UNAME_S" in
        Darwin*)
            PLATFORM="darwin"
            OS_TYPE="macOS"
            PACKAGE_MANAGER="brew"
            ;;
        Linux*)
            PLATFORM="linux"
            OS_TYPE="Linux"

            # Detect Linux distribution
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                DISTRO=$ID
                DISTRO_VERSION=$VERSION_ID

                case "$DISTRO" in
                    ubuntu|debian)
                        PACKAGE_MANAGER="apt"
                        ;;
                    centos|rhel|fedora)
                        PACKAGE_MANAGER="yum"
                        ;;
                    arch)
                        PACKAGE_MANAGER="pacman"
                        ;;
                    *)
                        PACKAGE_MANAGER="unknown"
                        ;;
                esac
            fi
            ;;
        FreeBSD*)
            PLATFORM="freebsd"
            OS_TYPE="FreeBSD"
            PACKAGE_MANAGER="pkg"
            ;;
        OpenBSD*)
            PLATFORM="openbsd"
            OS_TYPE="OpenBSD"
            PACKAGE_MANAGER="pkg_add"
            ;;
        NetBSD*)
            PLATFORM="netbsd"
            OS_TYPE="NetBSD"
            PACKAGE_MANAGER="pkgin"
            ;;
        *)
            PLATFORM="unknown"
            OS_TYPE="Unknown"
            PACKAGE_MANAGER="unknown"
            ;;
    esac

    print_success "Platform: $OS_TYPE ($PLATFORM)"
    print_success "Architecture: $UNAME_M"
    if [ -n "$DISTRO" ]; then
        print_success "Distribution: $DISTRO $DISTRO_VERSION"
    fi
    print_success "Package Manager: $PACKAGE_MANAGER"
}

#
# Dependency Management
#

check_dependencies() {
    print_header "Checking Dependencies"

    local all_deps_met=true

    # Check for C compiler
    if command -v gcc >/dev/null 2>&1; then
        print_success "gcc found: $(gcc --version | head -n 1)"
    elif command -v clang >/dev/null 2>&1; then
        print_success "clang found: $(clang --version | head -n 1)"
    else
        print_error "No C compiler found (gcc or clang required)"
        all_deps_met=false
    fi

    # Check for make
    if command -v make >/dev/null 2>&1; then
        print_success "make found: $(make --version | head -n 1)"
    else
        print_error "make not found"
        all_deps_met=false
    fi

    if [ "$all_deps_met" = true ]; then
        print_success "All dependencies are satisfied"
        return 0
    else
        print_warning "Some dependencies are missing"
        return 1
    fi
}

install_dependencies() {
    print_header "Installing Dependencies"

    case "$PACKAGE_MANAGER" in
        apt)
            print_msg "$BLUE" "Installing build essentials via apt..."
            sudo apt-get update
            sudo apt-get install -y build-essential
            ;;
        yum)
            print_msg "$BLUE" "Installing development tools via yum..."
            sudo yum groupinstall -y "Development Tools"
            ;;
        pacman)
            print_msg "$BLUE" "Installing base-devel via pacman..."
            sudo pacman -S --noconfirm base-devel
            ;;
        brew)
            print_msg "$BLUE" "Checking Homebrew installation..."
            if ! command -v brew >/dev/null 2>&1; then
                print_warning "Homebrew not found. Installing..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            # macOS typically has gcc/clang by default with Xcode Command Line Tools
            if ! command -v gcc >/dev/null 2>&1 && ! command -v clang >/dev/null 2>&1; then
                print_msg "$BLUE" "Installing Xcode Command Line Tools..."
                xcode-select --install
            fi
            ;;
        pkg)
            print_msg "$BLUE" "Installing dependencies via pkg..."
            sudo pkg install -y gcc gmake
            ;;
        *)
            print_error "Unknown package manager. Please install gcc and make manually."
            return 1
            ;;
    esac

    print_success "Dependencies installed"
}

#
# Build Functions
#

build_project() {
    local build_type=${1:-normal}

    print_header "Building Project ($build_type)"

    # Clean previous builds
    if [ -f "$BINARY_NAME" ]; then
        print_msg "$BLUE" "Cleaning previous build..."
        make clean
    fi

    # Build based on type
    case "$build_type" in
        normal)
            print_msg "$BLUE" "Building standard binary..."
            make all
            ;;
        static)
            print_msg "$BLUE" "Building static binary..."
            make static
            ;;
        debug)
            print_msg "$BLUE" "Building debug binary..."
            make debug
            ;;
        *)
            print_error "Unknown build type: $build_type"
            return 1
            ;;
    esac

    # Verify binary was created
    if [ -f "$BINARY_NAME" ]; then
        print_success "Build complete: $BINARY_NAME"
        ls -lh "$BINARY_NAME"
        return 0
    else
        print_error "Build failed: $BINARY_NAME not found"
        return 1
    fi
}

#
# Testing
#

test_build() {
    print_header "Running Tests"

    if [ ! -f "$BINARY_NAME" ]; then
        print_error "Binary not found. Build first."
        return 1
    fi

    if [ ! -f "test.sh" ]; then
        print_error "test.sh not found"
        return 1
    fi

    chmod +x test.sh
    ./test.sh

    print_success "All tests passed"
}

#
# Packaging
#

create_package() {
    print_header "Creating Distribution Package"

    # Check if binary exists
    if [ ! -f "$BINARY_NAME" ]; then
        print_error "Binary not found. Build first."
        return 1
    fi

    # Create distribution directory
    PACKAGE_NAME="${PROJECT_NAME}-${VERSION}-${OS_TYPE}-${UNAME_M}"
    PACKAGE_DIR="${DIST_DIR}/${PACKAGE_NAME}"

    print_msg "$BLUE" "Creating package directory: $PACKAGE_DIR"
    rm -rf "$PACKAGE_DIR"
    mkdir -p "$PACKAGE_DIR"

    # Copy binary
    print_msg "$BLUE" "Copying binary..."
    cp "$BINARY_NAME" "$PACKAGE_DIR/"

    # Copy documentation
    print_msg "$BLUE" "Copying documentation..."
    if [ -f "README.md" ]; then
        cp "README.md" "$PACKAGE_DIR/"
    fi

    if [ -f "CHALLENGE.md" ]; then
        cp "CHALLENGE.md" "$PACKAGE_DIR/"
    fi

    # Copy test script
    if [ -f "test.sh" ]; then
        cp "test.sh" "$PACKAGE_DIR/"
    fi

    # Copy docs directory if it exists
    if [ -d "docs" ]; then
        cp -r "docs" "$PACKAGE_DIR/"
    fi

    # Create installation script
    print_msg "$BLUE" "Creating install.sh..."
    cat > "$PACKAGE_DIR/install.sh" << 'EOF'
#!/usr/bin/env bash
# Installation script for ccwc

set -e

PREFIX="${PREFIX:-/usr/local}"
BINDIR="$PREFIX/bin"

echo "Installing ccwc to $BINDIR..."

# Check if running as root for system-wide install
if [ "$PREFIX" = "/usr/local" ] || [ "$PREFIX" = "/usr" ]; then
    if [ "$EUID" -ne 0 ]; then
        echo "Please run with sudo for system-wide installation"
        echo "Or set PREFIX to install to a user directory:"
        echo "  PREFIX=~/.local ./install.sh"
        exit 1
    fi
fi

# Create bin directory if it doesn't exist
mkdir -p "$BINDIR"

# Copy binary
install -m 755 ccwc "$BINDIR/ccwc"

echo "Installation complete!"
echo "ccwc is now available at: $BINDIR/ccwc"

# Check if directory is in PATH
if echo "$PATH" | grep -q "$BINDIR"; then
    echo "You can now run: ccwc --help"
else
    echo "Note: $BINDIR is not in your PATH"
    echo "Add it to your PATH or run: $BINDIR/ccwc"
fi
EOF

    chmod +x "$PACKAGE_DIR/install.sh"

    # Create uninstallation script
    print_msg "$BLUE" "Creating uninstall.sh..."
    cat > "$PACKAGE_DIR/uninstall.sh" << 'EOF'
#!/usr/bin/env bash
# Uninstallation script for ccwc

set -e

PREFIX="${PREFIX:-/usr/local}"
BINDIR="$PREFIX/bin"

echo "Uninstalling ccwc from $BINDIR..."

# Check if running as root for system-wide uninstall
if [ "$PREFIX" = "/usr/local" ] || [ "$PREFIX" = "/usr" ]; then
    if [ "$EUID" -ne 0 ]; then
        echo "Please run with sudo for system-wide uninstallation"
        exit 1
    fi
fi

# Remove binary
if [ -f "$BINDIR/ccwc" ]; then
    rm -f "$BINDIR/ccwc"
    echo "Uninstallation complete!"
else
    echo "ccwc not found at $BINDIR/ccwc"
    exit 1
fi
EOF

    chmod +x "$PACKAGE_DIR/uninstall.sh"

    # Create package info file
    print_msg "$BLUE" "Creating PACKAGE_INFO..."
    cat > "$PACKAGE_DIR/PACKAGE_INFO" << EOF
Package: $PROJECT_NAME
Version: $VERSION
Platform: $OS_TYPE ($PLATFORM)
Architecture: $UNAME_M
Build Date: $(date)
Build Host: $(hostname)

Contents:
- ccwc          : Main executable
- README.md     : User documentation
- CHALLENGE.md  : Challenge description
- test.sh       : Test suite
- install.sh    : Installation script
- uninstall.sh  : Uninstallation script
- PACKAGE_INFO  : This file

Installation:
  sudo ./install.sh

Or custom location:
  PREFIX=~/.local ./install.sh

Usage:
  ccwc --help
EOF

    # Create tarball
    print_msg "$BLUE" "Creating tarball..."
    cd "$DIST_DIR"
    tar czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME"

    # Create checksum
    print_msg "$BLUE" "Creating checksum..."
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "${PACKAGE_NAME}.tar.gz" > "${PACKAGE_NAME}.tar.gz.sha256"
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "${PACKAGE_NAME}.tar.gz" > "${PACKAGE_NAME}.tar.gz.sha256"
    fi

    cd - > /dev/null

    print_success "Package created: ${DIST_DIR}/${PACKAGE_NAME}.tar.gz"
    print_success "Checksum: ${DIST_DIR}/${PACKAGE_NAME}.tar.gz.sha256"

    # Show package contents
    echo ""
    print_msg "$BLUE" "Package contents:"
    ls -lh "${DIST_DIR}/${PACKAGE_NAME}.tar.gz"
    if [ -f "${DIST_DIR}/${PACKAGE_NAME}.tar.gz.sha256" ]; then
        cat "${DIST_DIR}/${PACKAGE_NAME}.tar.gz.sha256"
    fi
}

#
# Help
#

show_help() {
    cat << EOF
build-and-package.sh - Build and packaging automation for ccwc

Usage: ./build-and-package.sh [options]

Options:
  -d, --deps         Install dependencies
  -b, --build TYPE   Build project (TYPE: normal, static, debug)
  -t, --test         Run test suite
  -p, --package      Create distribution package
  -a, --all          Do everything (recommended for first time)
  -h, --help         Show this help message

Examples:
  ./build-and-package.sh -a                 # Full automated setup
  ./build-and-package.sh -d                 # Install dependencies only
  ./build-and-package.sh -b normal          # Build only
  ./build-and-package.sh -d -b normal -t    # Install, build, test
  ./build-and-package.sh -b debug -t        # Debug build and test
  ./build-and-package.sh -p                 # Package existing build

Build Types:
  normal    - Standard optimized build (default)
  static    - Static binary (Linux/BSD only)
  debug     - Debug build with symbols

EOF
}

#
# Main
#

main() {
    local do_deps=false
    local do_build=false
    local do_test=false
    local do_package=false
    local build_type="normal"

    # Parse arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    while [ $# -gt 0 ]; do
        case "$1" in
            -d|--deps)
                do_deps=true
                shift
                ;;
            -b|--build)
                do_build=true
                build_type="${2:-normal}"
                shift 2
                ;;
            -t|--test)
                do_test=true
                shift
                ;;
            -p|--package)
                do_package=true
                shift
                ;;
            -a|--all)
                do_deps=true
                do_build=true
                do_test=true
                do_package=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Detect platform first
    detect_platform

    # Execute requested operations
    if [ "$do_deps" = true ]; then
        if ! check_dependencies; then
            install_dependencies
        fi
    fi

    if [ "$do_build" = true ]; then
        build_project "$build_type"
    fi

    if [ "$do_test" = true ]; then
        test_build
    fi

    if [ "$do_package" = true ]; then
        create_package
    fi

    # Final summary
    print_header "Summary"
    print_success "All operations completed successfully!"

    if [ "$do_package" = true ]; then
        echo ""
        print_msg "$GREEN" "Distribution package ready!"
        print_msg "$BLUE" "Extract and install with:"
        echo "  tar xzf ${DIST_DIR}/${PROJECT_NAME}-${VERSION}-${OS_TYPE}-${UNAME_M}.tar.gz"
        echo "  cd ${PROJECT_NAME}-${VERSION}-${OS_TYPE}-${UNAME_M}"
        echo "  sudo ./install.sh"
    fi
}

# Run main
main "$@"
