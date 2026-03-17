# Build Your Own Docker - Implementation

A container runtime implementation that pulls images from Docker Hub and runs them with proper isolation using Linux namespaces, cgroups, and chroot.

## Overview

This implementation recreates core Docker functionality by building a container runtime called `ccrun` (Coding Challenges Runtime). It demonstrates how containerization works under the hood through direct use of Linux kernel features.

## Features

- ✅ **Command Execution**: Run arbitrary commands with proper stdio handling and exit codes
- ✅ **UTS Namespace**: Container-specific hostname isolation
- ✅ **Mount Namespace & chroot**: Filesystem isolation with custom root
- ✅ **PID Namespace**: Process isolation - containers see only their own processes
- ✅ **User Namespace**: Rootless containers - container root != host root
- ✅ **Cgroups**: Resource limiting (memory, CPU)
- ✅ **Docker Hub Integration**: Pull and unpack container images via Registry API v2
- ✅ **Image Execution**: Run pulled images with proper environment and working directory

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         ccrun CLI                          │
├─────────────────────────────────────────────────────────────┤
│  Command Parser  →  Image Puller  →  Container Runtime      │
│       │                  │                 │                │
│       ▼                  ▼                 ▼                │
│  ┌─────────┐      ┌──────────┐    ┌──────────────────┐    │
│  │  run    │      │ Registry │    │  Namespace       │    │
│  │  pull   │      │  API v2  │    │  Configuration   │    │
│  │  exec   │      └──────────┘    └──────────────────┘    │
│  └─────────┘              │                  │              │
│                           ▼                  ▼              │
│                    ┌──────────┐      ┌─────────────────┐  │
│                    │ Layers   │      │ clone() syscall │  │
│                    │ Unpack   │      │ unshare()       │  │
│                    │ Merge    │      │ chroot()        │  │
│                    └──────────┘      │ mount() /proc   │  │
│                                       └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Build and Installation

### Prerequisites

- **Linux** (native or VM)
- **Go 1.21+** for Go implementation
- **Alpine Linux** (for testing - download from https://alpinelinux.org/downloads/)
- **Root access** (for some namespace operations)

### Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd 23-docker

# Build the binary
go build -o ccrun ./cmd/ccrun

# (Optional) Install to system path
sudo cp ccrun /usr/local/bin/
```

### Docker Image Build

```bash
docker build -t ccruntime:latest .
```

## Usage

### Basic Command Execution (Step 1)

Run commands without containerization:

```bash
# Simple command
./ccrun run echo "Hello Coding Challenges!"
# Output: Hello Coding Challenges!

# Check exit codes
./ccrun run ls /nonexistent
echo $?
# Output: 1

./ccrun run ls /tmp
echo $?
# Output: 0
```

### Container with Custom Hostname (Step 2)

Create a container with its own hostname:

```bash
# Run container with custom hostname
./ccrun run --hostname mycontainer bash

# Inside container, hostname is "mycontainer"
# On host, hostname remains unchanged
```

### Filesystem Isolation (Step 3)

Run commands in an isolated filesystem (Alpine Linux):

```bash
# Download and extract Alpine Linux first
wget https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-minirootfs-3.19.1-x86_64.tar.gz
mkdir -p alpine-fs
tar -xzf alpine-minirootfs-3.19.1-x86_64.tar.gz -C alpine-fs/

# Run shell in Alpine filesystem
./ccrun run --rootfs alpine-fs /bin/busybox sh

# Try to escape - you can't!
/ # cd ..
/ # ls
bin  dev  etc  home  lib  media  mnt  opt  proc  root...
```

### Process Isolation (Step 4)

Run with isolated PID namespace:

```bash
./ccrun run --rootfs alpine-fs --isolate-pid /bin/busybox sh

/ # ps
PID   USER     TIME  COMMAND
1     root     0:00  ccrun
7     root     0:00  sh
8     root     0:00  ps

# Only container processes visible!
```

### Rootless Container (Step 5)

Run container where root is mapped to non-privileged user:

```bash
./ccrun run --rootfs alpine-fs --rootless /bin/busybox sh

# Check on host - process runs as your user, not root
ps -ef | grep busybox
# username  12345  ...  busybox sh
```

### Resource Limits (Step 6)

Limit container resources using cgroups:

```bash
# Limit to 512MB memory and 50% CPU
./ccrun run \
  --rootfs alpine-fs \
  --memory 512m \
  --cpu-shares 512 \
  /bin/busybox sh
```

### Pull and Run Docker Images (Steps 7-8)

Pull images from Docker Hub:

```bash
# Pull Alpine image
./ccrun pull alpine:latest

# Run pulled image
./ccun run alpine:latest /bin/sh

# Pull and run specific image
./ccrun pull ubuntu:22.04
./ccrun run ubuntu:22.04 /bin/bash
```

### Pull with Specific Tag

```bash
./ccrun pull nginx:alpine
./ccrun run nginx:alpine /bin/sh
```

## Command-Line Options

```
ccrun [command] [options] [args]

Commands:
  run      Run a command in a new container
  pull     Pull an image from Docker Hub
  help     Show help message

Options for 'run':
  --hostname string      Container hostname (default "container")
  --rootfs string        Path to chroot root filesystem
  --memory string        Memory limit (e.g., "512m", "1g")
  --cpu-shares int       CPU shares (relative weight)
  --rootless             Run with user namespace mapping
  --isolate-pid          Create new PID namespace
  --isolate-network      Create new network namespace

Options for 'pull':
  --output string        Output directory for pulled images
```

## Project Structure

```
23-docker/
├── cmd/
│   └── ccrun/
│       └── main.go           # CLI entry point
├── internal/
│   ├── runtime/
│   │   ├── container.go      # Container lifecycle management
│   │   ├── namespaces.go     # Namespace creation/management
│   │   ├── cgroups.go        # Cgroups setup
│   │   └── chroot.go         # Filesystem isolation
│   ├── registry/
│   │   ├── client.go         # Docker Registry API client
│   │   ├── manifest.go       # Manifest parsing
│   │   ├── layers.go         # Layer download/extract
│   │   └── auth.go           # Authentication handling
│   ├── config/
│   │   └── config.go         # Configuration loading
│   └── cli/
│       └── commands.go       # CLI command handlers
├── pkg/
│   └── syscall/
│       ├── clone.go          # clone() syscall wrapper
│       └── unshare.go        # unshare() syscall wrapper
├── docs/
│   ├── implementation.md     # Implementation details
│   ├── examples.md           # Usage examples
│   └── internals.md          # Deep dive into internals
├── test/
│   ├── integration_test.go
│   └── test_helpers.go
├── CHALLENGE.md              # Challenge requirements
├── README.md                 # This file
├── go.mod
├── go.sum
└── Dockerfile
```

## How It Works

### Namespace Isolation

The runtime uses Linux namespaces to create isolated environments:

1. **UTS Namespace**: Isolates hostname and domain name
2. **PID Namespace**: Isolates process IDs - container sees only its own processes
3. **Mount Namespace**: Isolates filesystem mount points
4. **User Namespace**: Isolates user and group IDs - enables rootless containers
5. **Network Namespace**: (optional) Isolates network stack

### Cgroups Resource Limits

Control groups (cgroups) limit and account resources:

- **memory**: Limits memory usage
- **cpu**: Controls CPU allocation
- **pid**: Limits number of processes

### Docker Registry Integration

The Docker Registry HTTP API V2 is used to:

1. Authenticate with Docker Hub
2. Fetch image manifests (metadata about layers)
3. Download layer tarballs
4. Extract and merge layers to create filesystem
5. Retrieve image configuration (environment, entrypoint, etc.)

### Container Lifecycle

```
1. Parse Command
   ↓
2. (Optional) Pull Image
   ↓
3. Create Namespaces (clone with CLONE_NEW*)
   ↓
4. Setup Cgroups
   ↓
5. chroot to Image Root
   ↓
6. Mount /proc
   ↓
7. Set Hostname
   ↓
8. Execute Command
   ↓
9. Cleanup on Exit
```

## Platform-Specific Notes

### Linux

All features are supported natively.

### macOS

Requires a Linux VM (VirtualBox, VMware Fusion, or Parallels) as namespaces are Linux-specific.

### Windows

Requires WSL2 or a Linux VM. Native Windows support is not possible due to missing Linux kernel features.

## Testing

### Unit Tests

```bash
go test ./...
```

### Integration Tests

```bash
# Requires root
sudo go test ./test/integration_test.go
```

### Manual Testing

```bash
# Test basic execution
./ccrun run echo "test"

# Test hostname isolation
./ccrun run --hostname testhost bash -c "hostname"

# Test filesystem isolation (requires Alpine rootfs)
./ccrun run --rootfs alpine-fs /bin/busybox ls /bin
```

## Troubleshooting

### "Operation not permitted"

Most namespace operations require CAP_SYS_ADMIN. Run with sudo or configure user namespaces.

### chroot: "Operation not permitted"

chroot requires CAP_SYS_CHROOT. Use sudo or ensure proper capabilities.

### Images not found

Ensure you're using valid image names from Docker Hub:
- `alpine:latest`
- `ubuntu:22.04`
- `nginx:alpine`

### Cgroup limits not working

Ensure cgroups v2 is enabled:
```bash
mount | grep cgroup
```

## Performance Considerations

- **Image Layering**: Layers are cached to avoid re-downloading
- **Memory**: Each container has overhead for namespace setup
- **Startup Time**: ~10-50ms for basic containers, ~500ms-2s for pulling images

## Security Considerations

⚠️ **This is an educational implementation, not production-ready:**

- Rootless containers provide basic isolation but are not a security boundary
- No seccomp filters to restrict syscalls
- No AppArmor/SELinux profiles
- No user namespace verification
- No capability dropping beyond what namespaces provide

For production use, use real Docker or runC.

## Further Reading

- [Linux Namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Control Groups](https://www.kernel.org/doc/Documentation/cgroup-v2.txt)
- [Docker Registry API](https://docs.docker.com/registry/spec/api/)
- [Container Capabilities](https://man7.org/linux/man-pages/man7/capabilities.7.html)
- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec)

## License

MIT License - See LICENSE file for details

## Contributing

This is a coding challenge implementation. For the original challenge, visit:
https://codingchallenges.fyi/challenges/challenge-docker
