# Implementation Guide - Build Your Own Docker

This guide provides a comprehensive walkthrough of implementing a container runtime from scratch, explaining design decisions, implementation details, and the underlying Linux kernel features that make containerization possible.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Linux Namespaces Deep Dive](#linux-namespaces-deep-dive)
3. [Implementation Steps](#implementation-steps)
4. [Design Decisions](#design-decisions)
5. [Code Organization](#code-organization)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Space (ccrun)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐ │
│  │   CLI    │───▶│    Config    │───▶│   Container Runtime  │ │
│  │  Parser  │    │   Manager    │    │      Orchestrator    │ │
│  └──────────┘    └──────────────┘    └──────────────────────┘ │
│                                              │                  │
│                                              ▼                  │
│  ┌──────────────┐    ┌────────────┐    ┌──────────────────┐  │
│  │   Registry   │    │   Layer    │    │   Namespace      │  │
│  │    Client    │◀───│  Manager   │◀───│   Manager        │  │
│  └──────────────┘    └────────────┘    └──────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Linux Kernel                             │
├─────────────────────────────────────────────────────────────────┤
│  clone()  │  unshare()  │  setns()  │  chroot()  │  mount()   │
│  Namespaces (UTS, PID, Mount, User, Network)                   │
│  Cgroups (memory, cpu, pids, devices)                          │
│  Capabilities                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **CLI Parser** | Parse command-line arguments, validate inputs, dispatch commands |
| **Config Manager** | Load and validate configuration, manage defaults |
| **Container Runtime Orchestrator** | Coordinate container lifecycle from creation to cleanup |
| **Registry Client** | Communicate with Docker Hub, authenticate, fetch manifests/layers |
| **Layer Manager** | Download, extract, verify, and merge image layers |
| **Namespace Manager** | Create and configure Linux namespaces for isolation |
| **Cgroup Manager** | Set up resource limits via cgroups |

---

## Linux Namespaces Deep Dive

Namespaces are the foundational technology for container isolation. They partition kernel resources such that one set of processes sees one set of resources, while another set of processes sees a different set.

### Namespace Types

#### 1. UTS Namespace

**Purpose**: Isolates hostname and domain name.

**Use Case**: Allow containers to have their own hostname without affecting the host.

**System Calls**:
- `clone(CLONE_NEWUTS)` - Create new UTS namespace
- `sethostname()` - Set hostname within namespace

**Example**:
```go
// Create new UTS namespace
cmd := exec.Command("bash")
cmd.SysProcAttr = &syscall.SysProcAttr{
    Cloneflags: syscall.CLONE_NEWUTS,
}
cmd.Run()

// Inside new namespace, set hostname
syscall.sethostname([]byte("mycontainer"))
```

**Implementation Details**:
- Each UTS namespace has its own `struct utsname`
- Hostname changes are visible only to processes in the same namespace
- Child processes inherit the UTS namespace by default

#### 2. PID Namespace

**Purpose**: Isolates process ID numbers.

**Use Case**: Containers see only their own processes; PID 1 in container is not init on host.

**System Calls**:
- `clone(CLONE_NEWPID)` - Create new PID namespace
- Mount `/proc` to see isolated process list

**Critical Implementation Detail**:
The first process in a new PID namespace becomes PID 1 **in that namespace**, but has a different PID on the host. This is why we need to:
1. Fork a child process in the new namespace
2. Have that child exec the container command

```go
// Parent process
cmd := exec.Command("/proc/self/exe", "child")
cmd.SysProcAttr = &syscall.SysProcAttr{
    Cloneflags: syscall.CLONE_NEWPID,
}
cmd.Run()

// Child process (in new namespace)
func childMain() {
    // This process is PID 1 in the namespace
    mount("proc", "/proc", "proc", 0, "")
    exec.Command("/bin/bash").Run()
}
```

#### 3. Mount Namespace

**Purpose**: Isolates filesystem mount points.

**Use Case**: Containers can mount/umount filesystems without affecting host.

**System Calls**:
- `clone(CLONE_NEWNS)` - Create new mount namespace
- `mount()` / `umount()` - Mount/umount operations

**Why It's Necessary for /proc**:
Each PID namespace needs its own `/proc` filesystem. Mounting `/proc` in a new mount namespace ensures:
- The container's `/proc` reflects only container processes
- The host's `/proc` is unchanged
- Clean isolation without side effects

```go
// Create mount namespace, then mount /proc
cmd.SysProcAttr = &syscall.SysProcAttr{
    Cloneflags: syscall.CLONE_NEWNS | syscall.CLONE_NEWPID,
}
// In child:
syscall.Mount("proc", "/proc", "proc", 0, "")
```

#### 4. User Namespace

**Purpose**: Isolates user and group IDs.

**Use Case**: Rootless containers - process runs as root in container but as regular user on host.

**System Calls**:
- `clone(CLONE_NEWUSER)` - Create new user namespace
- Write to `/etc/subuid` and `/etc/subgid` for mappings

**UID/GID Mapping**:
Map container UIDs to host UIDs via writing to `/proc/[pid]/uid_map` and `gid_map`:

```bash
# Map container root (0) to host user (1000) with range 1
echo "0 1000 1" > /proc/$$/uid_map
```

**Security Implication**: A process that is root in a user namespace has no special privileges on the host unless explicitly granted.

#### 5. Network Namespace

**Purpose**: Isolates network stack (interfaces, routing, firewall rules).

**Use Case**: Containers have their own network interfaces and IP addresses.

**System Calls**:
- `clone(CLONE_NEWNET)` - Create new network namespace

**Typical Setup**:
- Create veth pair (virtual ethernet)
- Move one end into container namespace
- Assign IP addresses
- Set up routing

### Namespace Interaction

```
┌─────────────────────────────────────────────────────┐
│                  clone() System Call                │
│  Creates child process with specified namespaces    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│           Namespace Isolation Matrix                │
├───────────┬──────────────┬───────────────────────────┤
│ Namespace │ Isolates     │ Container Benefit         │
├───────────┼──────────────┼───────────────────────────┤
│ UTS       │ Hostname     │ Custom identity           │
│ PID       │ Process IDs  │ Private process tree      │
│ Mount     │ Mount points│ Isolated /proc, /fs       │
│ User      │ UIDs/GIDs    │ Rootless operation        │
│ Network   │ Network stack│ Private IP, routing       │
└───────────┴──────────────┴───────────────────────────┘
```

---

## Implementation Steps

### Step 1: Basic Command Execution

**Goal**: Run arbitrary commands with stdio and exit code handling.

**Key Implementation Points**:

```go
type Command struct {
    Path string
    Args []string
}

func (c *Command) Run() error {
    cmd := exec.Command(c.Path, c.Args...)

    // Connect stdio
    cmd.Stdin = os.Stdin
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

    // Run and capture exit code
    err := cmd.Run()

    // Exit with same code as subprocess
    if exitErr, ok := err.(*exec.ExitError); ok {
        os.Exit(exitErr.ExitCode())
    }
    return err
}
```

**Why This Matters**:
- Establishes the foundation for all container execution
- Proper stdio handling enables interactive shells
- Exit code propagation enables shell scripting integration

### Step 2: UTS Namespace - Hostname Isolation

**Goal**: Container has its own hostname.

**Challenge**: The `clone()` system call with namespace flags requires the child process to execute in the new namespace. We need a two-process approach:

```go
func runWithHostname(cmdArgs []string, hostname string) error {
    // Parent process - creates namespace
    cmd := exec.Command("/proc/self/exe", append([]string{"child"}, cmdArgs...)...)
    cmd.SysProcAttr = &syscall.SysProcAttr{
        Cloneflags: syscall.CLONE_NEWUTS,
    }
    cmd.Stdin = os.Stdin
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

    return cmd.Run()
}

func childMain(cmdArgs []string, hostname string) {
    // Child process - in new namespace
    if err := syscall.sethostname([]byte(hostname)); err != nil {
        log.Fatalf("sethostname: %v", err)
    }

    // Execute the actual command
    cmd := exec.Command(cmdArgs[0], cmdArgs[1:]...)
    cmd.Stdin = os.Stdin
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

    if err := cmd.Run(); err != nil {
        if exitErr, ok := err.(*exec.ExitError); ok {
            os.Exit(exitErr.ExitCode())
        }
        log.Fatalf("exec: %v", err)
    }
    os.Exit(0)
}
```

**Why `/proc/self/exe`?**:
- It's a symlink to the current executable
- Allows the child to re-exec itself with different behavior
- Self-contained without hardcoding paths

### Step 3: chroot - Filesystem Isolation

**Goal**: Container cannot access files outside its root filesystem.

**Implementation**:

```go
func chroot(rootfs string) error {
    // 1. Change to new root
    if err := syscall.Chdir(rootfs); err != nil {
        return fmt.Errorf("chdir: %w", err)
    }

    // 2. Call chroot
    if err := syscall.Chroot(rootfs); err != nil {
        return fmt.Errorf("chroot: %w", err)
    }

    // 3. Change back to "/" (now the chroot root)
    if err := syscall.Chdir("/"); err != nil {
        return fmt.Errorf("chdir /: %w", err)
    }

    return nil
}
```

**Critical Security Note**: chroot alone is **not** a security boundary. A process with root privileges can escape chroot using techniques like:
- Creating device nodes and accessing host filesystems
- Using `..` in file paths before the chroot completes

**Modern Alternative**: pivot_root is more secure but requires a specially prepared root filesystem.

### Step 4: PID and Mount Namespaces

**Goal**: Container sees only its own processes; has isolated /proc.

**Complete Implementation**:

```go
func runIsolated(cmdArgs []string, rootfs string) error {
    cmd := exec.Command("/proc/self/exe", append([]string{"child"}, cmdArgs...)...)
    cmd.SysProcAttr = &syscall.SysProcAttr{
        Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWNS | syscall.CLONE_NEWPID,
    }
    cmd.Stdin = os.Stdin
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    return cmd.Run()
}

func childMain(cmdArgs []string, rootfs string) {
    // Apply chroot first
    if err := chroot(rootfs); err != nil {
        log.Fatalf("chroot: %v", err)
    }

    // Mount /proc in the new mount namespace
    if err := syscall.Mount("proc", "/proc", "proc", 0, ""); err != nil {
        log.Fatalf("mount /proc: %v", err)
    }
    defer syscall.Unmount("/proc", 0)

    // Now execute the command
    execCommand(cmdArgs)
}
```

**Order Matters**:
1. Create namespaces (via clone flags)
2. Apply chroot (changes visible root)
3. Mount /proc (shows only container processes)
4. Execute command

### Step 5: User Namespace - Rootless Containers

**Goal**: Container runs as root inside but as regular user on host.

**UID Mapping Setup**:

```go
func setupUserNamespace() error {
    pid := os.Getpid()

    // Write UID map: container 0 -> host UID, range 1
    uidMap := fmt.Sprintf("0 %d 1", os.Getuid())
    if err := os.WriteFile(fmt.Sprintf("/proc/%d/uid_map", pid), []byte(uidMap), 0644); err != nil {
        return fmt.Errorf("uid_map: %w", err)
    }

    // Write GID map: container 0 -> host GID, range 1
    gidMap := fmt.Sprintf("0 %d 1", os.Getgid())
    if err := os.WriteFile(fmt.Sprintf("/proc/%d/gid_map", pid), []byte(gidMap), 0644); err != nil {
        return fmt.Errorf("gid_map: %w", err)
    }

    // Disable setgroups for unprivileged user namespaces
    if err := os.WriteFile(fmt.Sprintf("/proc/%d/setgroups", pid), []byte("deny"), 0644); err != nil {
        // This may fail if already privileged
        log.Printf("warning: could not write setgroups: %v", err)
    }

    return nil
}
```

**When to Call**:
- Must be called from the child process after clone
- Must be called before any setuid/setgid operations
- Requires parent to not have setuid (deny setgroups)

### Step 6: Cgroups - Resource Limits

**Goal**: Limit memory and CPU usage.

**Cgroup v2 Implementation**:

```go
func setupCgroups(containerID string, memoryLimit string, cpuShares uint64) error {
    // Create cgroup directory
    cgroupPath := fmt.Sprintf("/sys/fs/cgroup/%s", containerID)
    if err := os.MkdirAll(cgroupPath, 0755); err != nil {
        return fmt.Errorf("mkdir cgroup: %w", err)
    }

    // Set memory limit
    if memoryLimit != "" {
        if err := os.WriteFile(
            filepath.Join(cgroupPath, "memory.max"),
            []byte(memoryLimit),
            0644,
        ); err != nil {
            return fmt.Errorf("memory limit: %w", err)
        }
    }

    // Set CPU shares (weight)
    if cpuShares > 0 {
        if err := os.WriteFile(
            filepath.Join(cgroupPath, "cpu.weight"),
            []byte(fmt.Sprintf("%d", cpuShares)),
            0644,
        ); err != nil {
            return fmt.Errorf("cpu weight: %w", err)
        }
    }

    // Add current process to cgroup
    if err := os.WriteFile(
        filepath.Join(cgroupPath, "cgroup.procs"),
        []byte(fmt.Sprintf("%d", os.Getpid())),
        0644,
    ); err != nil {
        return fmt.Errorf("add to cgroup: %w", err)
    }

    return nil
}
```

**Cgroup v1 vs v2**:
- v1: Hierarchical with multiple controllers (memory, cpu, etc.)
- v2: Unified hierarchy with single mount point
- Detection: Check if `/sys/fs/cgroup/cgroup.controllers` exists (v2)

### Step 7: Docker Registry Integration

**Goal**: Pull images from Docker Hub.

**Docker Registry API V2 Flow**:

```
1. GET /v2/                      → Check API availability
2. GET /v2/<name>/manifests/<tag> → Get manifest
3. Parse manifest                 → Extract layer digests
4. GET /v2/<name>/blobs/<digest>  → Download each layer
5. GET /v2/<name>/blobs/<config>  → Download config
6. Extract layers                 → Create filesystem
```

**Implementation**:

```go
type RegistryClient struct {
    httpClient *http.Client
    hostname   string
    auth       *AuthConfig
}

func (r *RegistryClient) PullImage(name, tag string) (*Image, error) {
    // 1. Get manifest
    manifest, err := r.GetManifest(name, tag)
    if err != nil {
        return nil, fmt.Errorf("get manifest: %w", err)
    }

    // 2. Download layers
    for _, layer := range manifest.Layers {
        if err := r.DownloadLayer(name, layer.Digest); err != nil {
            return nil, fmt.Errorf("download layer %s: %w", layer.Digest, err)
        }
    }

    // 3. Download config
    config, err := r.GetConfig(name, manifest.Config.Digest)
    if err != nil {
        return nil, fmt.Errorf("get config: %w", err)
    }

    // 4. Extract and merge layers
    rootfs, err := r.ExtractLayers(manifest.Layers)
    if err != nil {
        return nil, fmt.Errorf("extract layers: %w", err)
    }

    return &Image{
        Rootfs: rootfs,
        Config: config,
    }, nil
}
```

**Layer Extraction**:

```go
func (r *RegistryClient) ExtractLayers(layers []Layer) (string, error) {
    // Create target directory
    rootfs, err := os.MkdirTemp("", "ccrun-rootfs-")
    if err != nil {
        return "", err
    }

    // Extract layers in order (base to top)
    for _, layer := range layers {
        layerPath := r.getLayerPath(layer.Digest)

        // Open layer tar.gz
        f, err := os.Open(layerPath)
        if err != nil {
            return "", err
        }
        defer f.Close()

        // gunzip
        gzipReader, err := gzip.NewReader(f)
        if err != nil {
            return "", err
        }

        // untar into rootfs (later layers overwrite earlier ones)
        tarReader := tar.NewReader(gzipReader)
        for {
            header, err := tarReader.Next()
            if err == io.EOF {
                break
            }
            if err != nil {
                return "", err
            }

            targetPath := filepath.Join(rootfs, header.Name)

            // Create directory if needed
            if header.Typeflag == tar.TypeDir {
                os.MkdirAll(targetPath, os.FileMode(header.Mode))
                continue
            }

            // Create file
            outFile, err := os.Create(targetPath)
            if err != nil {
                return "", err
            }
            if _, err := io.Copy(outFile, tarReader); err != nil {
                return "", err
            }
            outFile.Close()
        }
    }

    return rootfs, nil
}
```

**Authentication**:

```go
type AuthConfig struct {
    Username string
    Password string
    Token    string
}

func (r *RegistryClient) Authenticate(name string) error {
    // For public images, no auth needed
    // For private images, implement OAuth2 token flow:
    // 1. GET 401 from registry
    // 2. Extract Www-Authenticate header
    // 3. Parse auth service and realm
    // 4. POST to auth service with credentials
    // 5. Receive bearer token
    // 6. Use token in Authorization header
    return nil
}
```

### Step 8: Running Pulled Images

**Goal**: Execute containers with proper environment and working directory.

```go
func (img *Image) Run(command []string) error {
    // 1. chroot to image rootfs
    if err := chroot(img.Rootfs); err != nil {
        return err
    }

    // 2. Set environment variables from config
    for k, v := range img.Config.Env {
        os.Setenv(k, v)
    }

    // 3. Set working directory
    if img.Config.WorkingDir != "" {
        if err := syscall.Chdir(img.Config.WorkingDir); err != nil {
            return err
        }
    }

    // 4. Execute command (or default entrypoint/cmd)
    cmd := command
    if len(cmd) == 0 {
        cmd = img.Config.Cmd
    }
    if len(cmd) == 0 {
        cmd = img.Config.Entrypoint
    }

    execCommand(cmd)
}
```

---

## Design Decisions

### 1. Go vs C for System Programming

**Decision**: Use Go for this implementation.

**Rationale**:
- Excellent syscall support via `syscall` package
- Built-in HTTP client for Registry API
- Goroutines simplify concurrent operations
- Strong type safety catches errors early
- Easy cross-compilation

**Trade-offs**:
- Slightly higher memory footprint than C
- Less direct control than raw syscalls

### 2. Two-Process Architecture

**Decision**: Parent creates namespaces, child executes in them.

**Rationale**:
- The `clone()` syscall with namespace flags affects the **child** process, not the parent
- Clean separation: parent orchestrates, child executes
- Simplifies error handling and cleanup

### 3. Layered Filesystem

**Decision**: Download and extract layers sequentially, merging into single directory.

**Rationale**:
- Simpler than overlayfs (which requires kernel support)
- Sufficient for basic container runtime
- Layer caching is straightforward

**Trade-off**: Uses more disk space than overlayfs.

### 4. cgroup v2 Only

**Decision**: Support only cgroup v2.

**Rationale**:
- cgroup v2 is the unified, modern approach
- Simpler API (single hierarchy)
- Most modern distributions use v2 by default

**Trade-off**: Won't work on older systems with only cgroup v1.

---

## Code Organization

### Module Structure

```
internal/
├── runtime/          # Container runtime core
│   ├── container.go  # Container lifecycle
│   ├── namespaces.go # Namespace management
│   ├── cgroups.go    # Cgroup operations
│   └── exec.go       # Command execution
├── registry/         # Docker Hub integration
│   ├── client.go     # HTTP client
│   ├── manifest.go   # Manifest handling
│   └── layers.go     # Layer download/extract
└── config/           # Configuration
    └── config.go     # Config loading
```

### Key Data Structures

```go
// Container represents a running container
type Container struct {
    ID         string
    Rootfs     string
    Config     *ContainerConfig
    Namespaces *NamespaceConfig
    Cgroups    *CgroupConfig
    State      ContainerState
}

// Image represents a pulled container image
type Image struct {
    Name    string
    Tag     string
    Rootfs  string
    Config  *ImageConfig
    Layers  []Layer
}

// NamespaceConfig specifies which namespaces to create
type NamespaceConfig struct {
    UTS     bool
    PID     bool
    Network bool
    Mount   bool
    User    bool
}
```

---

## Testing Strategy

### Unit Tests

- Mock syscalls for namespace operations
- Test manifest parsing with sample data
- Validate layer extraction logic

### Integration Tests

- Test with actual Alpine Linux rootfs
- Verify isolation using `/proc` inspection
- Confirm cgroup limits are applied

### Manual Testing

```bash
# Test each step incrementally
./ccrun run echo "step 1"
./ccrun run --hostname test bash -c "hostname"
./ccrun run --rootfs alpine-fs /bin/sh
./ccrun run --rootfs alpine-fs --isolate-pid /bin/sh -c "ps aux"
./ccrun run --rootfs alpine-fs --rootless /bin/sh
./ccrun run --rootfs alpine-fs --memory 100m /bin/sh
./ccrun pull alpine:latest
./ccrun run alpine:latest /bin/sh
```

---

## Debugging Tips

### Check Namespace Isolation

```bash
# From host, check container namespaces
ls -la /proc/<container-pid>/ns/

# Output shows symlinks to namespace identifiers
# Compare with host's /proc/1/ns/ to verify different
```

### Inspect Cgroups

```bash
cat /sys/fs/cgroup/<container-id>/memory.max
cat /sys/fs/cgroup/<container-id>/cpu.weight
cat /sys/fs/cgroup/<container-id>/cgroup.procs
```

### Trace System Calls

```bash
strace -f -e clone,unshare,setns,execve ./ccrun run /bin/bash
```

---

## Further Enhancements

1. **Multi-container Management**: Add `ps`, `stop`, `rm` commands
2. **Networking**: Bridge network setup, port forwarding
3. **Volumes**: Bind mounts, volume management
4. **Security**: seccomp profiles, capabilities dropping
5. **Image Building**: Dockerfile parser and builder
6. **Container Orchestration**: Multi-container deployment

---

## References

- [Linux namespaces(7) man page](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [cgroups(7) man page](https://man7.org/linux/man-pages/man7/cgroups.7.html)
- [Docker Registry HTTP API V2](https://docs.docker.com/registry/spec/api/)
- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec)
