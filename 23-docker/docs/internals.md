# Internals Deep Dive - Build Your Own Docker

This guide dives deep into the technical internals of containerization, explaining kernel mechanisms, data structures, algorithms, and implementation details that power container runtimes.

## Table of Contents

1. [Linux Kernel Mechanisms](#linux-kernel-mechanisms)
2. [Container Lifecycle](#container-lifecycle)
3. [Data Structures](#data-structures)
4. [Algorithms and Protocols](#algorithms-and-protocols)
5. [Performance Considerations](#performance-considerations)

---

## Linux Kernel Mechanisms

### The clone() System Call

The `clone()` system call is the fundamental primitive for creating containers. Unlike `fork()`, which creates a copy of the calling process, `clone()` allows fine-grained control over what is shared between parent and child.

**Signature**:

```c
long clone(unsigned long flags, void *child_stack, int *ptid, int *ctid, unsigned long newtls);
```

**Key Flags for Containerization**:

| Flag | Namespace | Purpose |
|------|-----------|---------|
| `CLONE_NEWUTS` | UTS | Isolate hostname and domain name |
| `CLONE_NEWPID` | PID | Isolate process IDs |
| `CLONE_NEWNS` | Mount | Isolate mount points |
| `CLONE_NEWNET` | Network | Isolate network stack |
| `CLONE_NEWUSER` | User | Isolate user and group IDs |
| `CLONE_NEWCGROUP` | Cgroup | Isolate cgroup root directory |

**Implementation in Go**:

```go
package syscall

const (
    CLONE_NEWUTS   = 0x04000000 /* New utsname namespace */
    CLONE_NEWPID   = 0x20000000 /* New pid namespace */
    CLONE_NEWNS    = 0x00020000 /* New mount namespace */
    CLONE_NEWNET   = 0x40000000 /* New network namespace */
    CLONE_NEWUSER  = 0x10000000 /* New user namespace */
    CLONE_NEWCGROUP= 0x02000000 /* New cgroup namespace */
)

// SysProcAttr holds attributes for clone()
type SysProcAttr struct {
    Cloneflags uintptr         // Flags for clone()
    UidMappings []IDMap        // UID mappings for user namespace
    GidMappings []IDMap        // GID mappings for user namespace
}

type IDMap struct {
    ContainerID int  // UID/GID inside container
    HostID      int  // UID/GID on host
    Size        int  // Range size
}
```

**Call Flow**:

```
Parent Process
     │
     ├─> exec.Command("/proc/self/exe", "child", ...)
     │       │
     │       └─> SysProcAttr.Cloneflags = CLONE_NEWUTS | CLONE_NEWNS
     │
     ▼
clone() system call
     │
     ├─> Creates new namespaces (based on flags)
     ├─> Clones specified resources
     └─> Returns in both parent and child
              │
              ▼
       Child Process (in new namespaces)
              │
              ├─> sethostname("mycontainer")
              ├─> chroot("/path/to/rootfs")
              ├─> mount("proc", "/proc", "proc", 0, "")
              └─> exec("/bin/bash")
```

### Namespace Implementation Details

#### UTS Namespace

**Kernel Structure** (`include/linux/utsname.h`):

```c
struct uts_namespace {
    struct new_utsname name;
    struct user_namespace *user_ns;
    struct ucounts *ucounts;
    struct ns_common ns;
} __randomize_layout;

struct new_utsname {
    char sysname[__NEW_UTS_LEN + 1];
    char nodename[__NEW_UTS_LEN + 1];  // This is the hostname
    char release[__NEW_UTS_LEN + 1];
    char version[__NEW_UTS_LEN + 1];
    char machine[__NEW_UTS_LEN + 1];
    char domainname[__NEW_UTS_LEN + 1];
};
```

**Isolation Mechanism**:
- Each UTS namespace has its own `struct new_utsname`
- `sethostname()` writes to `nodename` field in current namespace
- Processes in different UTS namespaces see different hostnames

**Filesystem Representation**:

```
/proc/[pid]/ns/uts -> 'uts:[4026531838]'
```

The symlink target is a unique namespace identifier. Processes with the same identifier share the namespace.

#### PID Namespace

**Key Concept**: PID namespaces are hierarchical. A parent namespace can see all child namespaces, but not vice versa.

**Hierarchy Example**:

```
Init PID Namespace (host)
├── PID 1: systemd
├── PID 42: dockerd
└── PID 123: containerd
    └── Child PID Namespace (container)
        ├── PID 1: ccrun (shown as PID 123 in parent)
        ├── PID 2: sh
        └── PID 3: ps
```

**Kernel Data Structure**:

```c
struct pid_namespace {
    struct idr idr;
    struct rcu_head rcu;
    unsigned int level;
    struct pid_namespace *parent;
    struct kref kref;
    struct user_namespace *user_ns;
    struct ucounts *ucounts;
    struct work_struct proc_work;
    kgid_t pid_gid;
    int hide_pid;
    int reboot; /* group exit code if PID namespace was rebooted */
    struct ns_common ns;
};
```

**Virtual PID Translation**:

The kernel maintains PID translation tables for cross-namespace references:

```
┌─────────────────────────────────────────────────┐
│           Virtual PID Numbering                 │
├─────────────────────────────────────────────────┤
│  Host Namespace:  Container Namespace:          │
│  ┌─────────────┐  ┌─────────────────────────┐   │
│  │ PID 123     │  │ PID 1 (same process)    │   │
│  │  └─ ccrun   │  │  └─ ccrun               │   │
│  │             │  │                         │   │
│  │ PID 124     │  │ PID 2 (same process)    │   │
│  │  └─ sh      │  │  └─ sh                  │   │
│  └─────────────┘  └─────────────────────────┘   │
│                                                 │
│  Translation Table (in kernel):                  │
│  (namespace, virtual_pid) → physical_pid        │
│  (host_ns, 123) → 123                           │
│  (container_ns, 1) → 123                        │
└─────────────────────────────────────────────────┘
```

**Signal Delivery Complexity**:
Signals from parent namespace to child namespace require special handling:
- `SIGKILL` always works
- Other signals require same UID/GID mapping
- `ptrace()` from parent namespace is restricted

#### Mount Namespace

**Key Concept**: Mount namespaces isolate the set of filesystem mount points visible to processes.

**Kernel Data Structure**:

```c
struct mnt_namespace {
    struct mount * root;
    struct rb_root mounts;
    struct list_head list;
    struct user_namespace *user_ns;
    struct ucounts *ucounts;
    struct ns_common ns;
};
```

**Mount Propagation Types**:

| Type | Behavior | Use Case |
|------|----------|----------|
| `MS_PRIVATE` | No propagation | Default for containers |
| `MS_SHARED` | Bidirectional | Shared subtrees |
| `MS_SLAVE` | Receive only | Leaf nodes |
| `MS_UNBINDABLE` | No bind mounts | Protected directories |

**Why Remount /proc?**:

Each PID namespace requires its own `/proc` filesystem because `/proc` entries are PID-specific:

```
Before mount (shared /proc):
/proc/1 -> host init (wrong!)

After mount (private /proc):
/proc/1 -> container init (correct!)
```

**Mount Namespace Isolation Flow**:

```
1. clone(CLONE_NEWNS)
   ↓
2. child has copy of parent's mount table
   ↓
3. mount --make-private / (prevent propagation)
   ↓
4. mount -t proc proc /proc (new /proc for namespace)
   ↓
5. All subsequent mounts are isolated
```

#### User Namespace

**Key Concept**: User namespaces allow a process to have a different UID/GID inside the namespace than outside.

**UID Mapping**:

```
Format: <container-uid> <host-uid> <range>

Example: "0 1000 1"
         │    │     │
         │    │     └─ Map 1 UID
         │    └─────── Map container 0 to host 1000
         └──────────── Container UID (root in container)

Result: Container UID 0 = Host UID 1000
        Container UID 1 = Host UID 1001 (if range > 1)
```

**Multiple Ranges**:

```
"0 1000 10"    → Container 0-9 maps to host 1000-1009
"10000 100000 1000" → Container 10000-10999 maps to host 100000-100999
```

**Capability Set Transformation**:

When a user namespace is created, capabilities are transformed:

```
Host view:
  Process: UID 1000, no capabilities

Container view (after user namespace creation):
  Process: UID 0 (mapped from host 1000), full capabilities

Kernel internal view:
  Process: UID 1000, capabilities valid only in child namespace
```

**Security Boundary**:

User namespaces create a **privileged inside, unprivileged outside** boundary:

```
┌─────────────────────────────────────────┐
│           Container View                │
│  UID: 0 (root)                          │
│  Capabilities: CAP_NET_ADMIN, etc.      │
│  Can do: chmod 777, chown, etc.         │
└─────────────────────────────────────────┘
                    │
                    ▼ (maps to)
┌─────────────────────────────────────────┐
│            Host View                    │
│  UID: 1000 (regular user)               │
│  Capabilities: none                     │
│  Can do: only user operations           │
└─────────────────────────────────────────┘
```

**setgroups() restriction**:

For unprivileged user namespace creation, `setgroups` must be disabled to prevent `setgroups(0, NULL)` (which would drop all groups):

```go
// Must write "deny" before writing gid_map
os.WriteFile("/proc/$$/setgroups", []byte("deny"), 0644)
```

### Control Groups (Cgroups)

**Cgroup v2 Architecture**:

```
/sys/fs/cgroup/
├── cgroup.controllers          # Available controllers
├── cgroup.subtree_control       # Active controllers for children
├── memory.max                   # Memory limit
├── cpu.weight                   # CPU weight (1-10000)
├── io.max                       # IO limits
├── pids.max                     # Process count limit
├── ...                          # Other control files
└── [container-id]/              # Container cgroup directory
    ├── cgroup.procs             # Processes in cgroup
    ├── memory.current           # Current memory usage
    ├── memory.events            # OOM events, etc.
    └── ...                      # Other control files
```

**Memory Controller**:

Key files:
- `memory.max`: Limit in bytes (or "max" for unlimited)
- `memory.swap.max`: Swap limit
- `memory.current`: Current usage
- `memory.events`: Events (low, high, oom, oom_kill)

**OOM Handling**:

When memory limit is exceeded:
```
1. Kernel tries to reclaim memory
   ├─ Clean page cache
   ├─ Swap to disk
   └─ Slab reclaim
2. If still over limit → OOM killer
3. Selects victim process
4. Sends SIGKILL
5. Writes event to memory.events:
   oom_kill 1
```

**CPU Controller**:

Uses `cpu.weight` (cgroup v2) instead of `cpu.shares` (cgroup v1):

```
Weight: CPU Time Ratio
1:     Minimum (never scheduled if others exist)
100:   Default (baseline)
10000: Maximum
```

**Scheduling Algorithm**:

The kernel uses a weighted fair queueing algorithm:

```
time_slice = base_slice * (weight / sum_of_weights)

Example:
  Container A: weight 500
  Container B: weight 1500
  Total: 2000

  Container A gets: base_slice * 500/2000 = 25%
  Container B gets: base_slice * 1500/2000 = 75%
```

### chroot Mechanism

**System Call**:

```c
int chroot(const char *path);
```

**What It Does**:
1. Changes the root directory for the calling process
2. Current working directory is unchanged
3. ".." (dot-dot) cannot escape the new root

**What It Doesn't Do**:
- Doesn't change the current working directory
- Doesn't isolate mount points
- Doesn't prevent privileged escape

**Escape Techniques** (why chroot alone is insecure):

1. **mkdir/chroot escape**:
```c
mkdir("foo/bar");
chroot("foo/bar");
// Now in foo/bar, ".." goes to foo
// Can escape with careful directory traversal
```

2. **Device node escape**:
```c
// If root in chroot, can create device nodes
mknod("/tmp/sda", S_IFBLK, makedev(8, 0));
// Open device and access host filesystem
int fd = open("/tmp/sda", O_RDWR);
```

**Modern Alternative: pivot_root**:

```c
int pivot_root(const char *new_root, const char *put_old);
```

`pivot_root` is more secure because it:
- Requires the new root to be a mount point
- Doesn't allow ".." escape
- Is atomic (either fully succeeds or fails)

---

## Container Lifecycle

### Creation Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                    Container Creation Flow                  │
└─────────────────────────────────────────────────────────────┘

1. CLI Parsing
   │
   ├─ Parse command: "ccrun run --hostname foo alpine sh"
   ├─ Extract flags: hostname="foo", image="alpine", cmd="sh"
   └─ Validate arguments

2. Image Preparation (if pulling)
   │
   ├─ Fetch manifest from Docker Hub
   ├─ Download layers (in parallel)
   ├─ Extract layers to target directory
   └─ Load image configuration

3. Container Setup
   │
   ├─ Create container ID
   ├─ Prepare rootfs directory
   ├─ Set up cgroup directory
   └─ Prepare namespace configuration

4. Process Creation (clone)
   │
   ├─ Prepare SysProcAttr with Cloneflags
   ├─ Set UID/GID mappings (if user namespace)
   ├─ Prepare stdio pipes
   └─ Call clone() with namespace flags

5. Child Initialization (in new namespaces)
   │
   ├─ Set hostname (UTS namespace)
   ├─ Apply chroot/pivot_root
   ├─ Mount /proc (Mount namespace)
   ├─ Set up cgroup membership
   └─ Drop capabilities (if applicable)

6. Command Execution
   │
   ├─ Set environment variables
   ├─ Set working directory
   ├─ Prepare execve arguments
   └─ Execute command

7. Parent Monitoring
   │
   ├─ Wait for child to exit
   ├─ Forward signals to child
   ├─ Monitor resource usage
   └─ Clean up on exit
```

### Exit Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                      Container Exit Flow                    │
└─────────────────────────────────────────────────────────────┘

1. Container Process Exits
   │
   ├─ Command exits (or killed by signal)
   ├─ All child processes re-parented to container init
   └─ Container init waits for all children

2. Parent Receives SIGCHLD
   │
   ├─ Reap child process with waitpid()
   ├─ Get exit status
   └─ Clean up resources

3. Resource Cleanup
   │
   ├─ Remove from cgroup
   ├─ Unmount /proc
   ├─ Close namespaces (reference counted)
   └─ Free cgroup directory

4. State Update
   │
   ├─ Mark container as "exited"
   ├─ Record exit time and status
   └─ Persist state (if stateful)
```

### Signal Handling

**Signal Forwarding**:

```go
// Parent receives SIGTERM
func handleSignals(containerPid int) {
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

    for sig := range sigChan {
        // Forward to container
        syscall.Kill(containerPid, sig.(syscall.Signal))
    }
}
```

**Special Case: SIGKILL**:
- Cannot be caught or ignored
- Delivered immediately to target process
- Container process dies immediately

**Signal Interaction with Namespaces**:

Signals from parent namespace to child namespace:
- Must have matching UID/GID mapping
- Some signals (SIGKILL, SIGSTOP) always work
- Others require privilege

---

## Data Structures

### Container State

```go
type ContainerState struct {
    ID        string
    Pid       int
    Rootfs    string
    Status    ContainerStatus
    CreatedAt time.Time
    Namespaces *NamespaceConfig
    Config    *ContainerConfig
}

type ContainerStatus string

const (
    StatusCreated  ContainerStatus = "created"
    StatusRunning  ContainerStatus = "running"
    StatusPaused   ContainerStatus = "paused"
    StatusStopped  ContainerStatus = "stopped"
    StatusRemoving ContainerStatus = "removing"
)
```

### Image Manifest

```go
type ImageManifest struct {
    SchemaVersion int      `json:"schemaVersion"`
    MediaType     string   `json:"mediaType"`
    Config        Layer    `json:"config"`
    Layers        []Layer  `json:"layers"`
}

type Layer struct {
    MediaType string `json:"mediaType"`
    Digest    string `json:"digest"`
    Size      int64  `json:"size"`
}
```

### Image Configuration

```go
type ImageConfig struct {
    Config      struct {
        Env        []string `json:"Env"`
        Cmd        []string `json:"Cmd"`
        WorkingDir string   `json:"WorkingDir"`
        User       string   `json:"User"`
    } `json:"config"`
    RootFS struct {
        Type    string   `json:"type"`
        DiffIDs []string `json:"diff_ids"`
    } `json:"rootfs"`
}
```

### Namespace Configuration

```go
type NamespaceConfig struct {
    UTS     bool
    PID     bool
    Network bool
    Mount   bool
    User    bool
    Cgroup  bool

    // UTS specific
    Hostname string

    // Network specific
    Bridge   string
    IP       string

    // User namespace specific
    UIDMap []IDMap
    GIDMap []IDMap
}

func (n *NamespaceConfig) CloneFlags() uintptr {
    var flags uintptr

    if n.UTS {
        flags |= syscall.CLONE_NEWUTS
    }
    if n.PID {
        flags |= syscall.CLONE_NEWPID
    }
    if n.Network {
        flags |= syscall.CLONE_NEWNET
    }
    if n.Mount {
        flags |= syscall.CLONE_NEWNS
    }
    if n.User {
        flags |= syscall.CLONE_NEWUSER
    }
    if n.Cgroup {
        flags |= syscall.CLONE_NEWCGROUP
    }

    return flags
}
```

### Cgroup Configuration

```go
type CgroupConfig struct {
    Name  string
    Path  string

    // Memory limits
    MemoryLimit     int64   // bytes, -1 for unlimited
    MemorySwapLimit int64   // bytes, -1 for unlimited
    MemoryReservation int64 // soft limit

    // CPU limits
    CPUShares  uint64 // 1-10000 (cgroup v2)
    CPUQuota   int64  // microseconds per second (e.g., 100000 for 0.1 CPU)
    CPUPeriod  uint64 // default 100000

    // Process limits
    PidsLimit int64 // max processes, -1 for unlimited

    // IO limits
    IOReadBps   int64 // bytes per second
    IOWriteBps  int64
    IOReadIOps  int64 // IO operations per second
    IOWriteIOps int64
}
```

---

## Algorithms and Protocols

### Docker Registry HTTP API V2

**Authentication Flow**:

```
1. Client → Registry: GET /v2/
   │
   ├─ 401 Unauthorized
   ├─ WWW-Authenticate: Bearer realm="https://auth.docker.io/token"
   │                     service="registry.docker.io"
   │                     scope="repository:library/alpine:pull"
   │
   ▼
2. Client → Auth Service: GET /token?
   │                          service=registry.docker.io&
   │                          scope=repository:library/alpine:pull
   │
   ├─ 200 OK
   ├─ {"token": "eyJhbGci...", ...}
   │
   ▼
3. Client → Registry: GET /v2/library/alpine/manifests/latest
   │                    Authorization: Bearer eyJhbGci...
   │
   └─ 200 OK (manifest)
```

**Layer Download Strategy**:

```go
func (r *RegistryClient) DownloadLayersParallel(layers []Layer) error {
    const maxConcurrency = 5
    sem := make(chan struct{}, maxConcurrency)
    errChan := make(chan error, len(layers))

    for _, layer := range layers {
        sem <- struct{}{} // Acquire semaphore
        go func(l Layer) {
            defer func() { <-sem }() // Release semaphore
            errChan <- r.downloadLayer(l)
        }(layer)
    }

    // Wait for all downloads
    for i := 0; i < len(layers); i++ {
        if err := <-errChan; err != nil {
            return err
        }
    }

    return nil
}
```

**Layer Verification**:

```go
func verifyLayer(path string, expectedDigest string) error {
    // Parse digest: "sha256:abc123..."
    algo, expected := splitDigest(expectedDigest)

    // Calculate hash
    f, _ := os.Open(path)
    defer f.Close()

    var hash hash.Hash
    if algo == "sha256" {
        hash = sha256.New()
    }

    io.Copy(hash, f)
    actual := hex.EncodeToString(hash.Sum(nil))

    if actual != expected {
        return fmt.Errorf("digest mismatch: expected %s, got %s", expected, actual)
    }

    return nil
}
```

### Layer Extraction Algorithm

```
Layer Extraction Process:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  For each layer in ordered list (base → top):               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Open layer file (tar.gz)                         │   │
│  │ 2. Gunzip decompression                             │   │
│  │ 3. For each tar entry:                              │   │
│  │    ├─ Directory: mkdir -p (with permissions)        │   │
│  │    ├─ Regular file: create & write contents         │   │
│  │    ├─ Symlink: create symlink (preserve target)     │   │
│  │    ├─ Hardlink: create hardlink (inode reference)  │   │
│  │    ├─ Whiteout: mark file for deletion             │   │
│  │    └─ Device node: (skip in user namespaces)       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Process whiteout files:                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Files named .wh.<filename> indicate <filename>       │   │
│  │ should be deleted from lower layers                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Whiteout Implementation**:

```go
type Whiteout struct {
    Name string // ".wh.filename"
}

func isWhiteout(name string) bool {
    return strings.HasPrefix(filepath.Base(name), ".wh.")
}

func applyWhiteout(rootfs, path string) error {
    // ".wh.filename" → delete "filename"
    target := strings.TrimPrefix(filepath.Base(path), ".wh.")
    targetPath := filepath.Join(filepath.Dir(path), target)

    return os.RemoveAll(filepath.Join(rootfs, targetPath))
}
```

### Container ID Generation

**Algorithm**:

```go
func generateContainerID() string {
    // Use crypto/rand for uniqueness
    b := make([]byte, 16)
    rand.Read(b)

    // Convert to hex
    id := hex.EncodeToString(b)

    // Use first 12 characters (like Docker)
    return id[:12]
}
```

**Collision Probability**:

```
12 hex characters = 24 bytes = 96 bits
p(collision) ≈ n² / (2 * 2^96)

For 1 million containers:
p ≈ (10^6)² / (2 * 2^96) ≈ 10^12 / 10^29 ≈ 10^-17 (negligible)
```

---

## Performance Considerations

### Namespace Creation Overhead

```
Namespace creation cost:
┌──────────────┬─────────────────┬──────────────────┐
│ Namespace    │ Creation Time   │ Memory Overhead  │
├──────────────┼─────────────────┼──────────────────┤
│ UTS          │ ~1 µs           │ ~1 KB            │
│ PID          │ ~10 µs          │ ~4 KB (proc view)│
│ Mount        │ ~50 µs          │ ~8 KB (mount tab)│
│ Network      │ ~100 µs         │ ~16 KB (net ns)  │
│ User         │ ~20 µs          │ ~2 KB            │
│ Cgroup       │ ~200 µs         │ ~4 KB            │
└──────────────┴─────────────────┴──────────────────┘

Total (all namespaces): ~400 µs, ~35 KB
```

### Memory Overhead by Component

```
Container Memory Breakdown:
┌─────────────────────┬──────────────┐
│ Component           │ Memory       │
├─────────────────────┼──────────────┤
│ Runtime binary      │ ~2 MB        │
│ Namespaces          │ ~35 KB       │
│ Cgroup structures   │ ~4 KB        │
│ File descriptors    │ ~8 KB        │
│ Process metadata    │ ~100 KB      │
│ ────────────────────┼──────────────┤
│ Base overhead       │ ~2.1 MB      │
│ + Application       │ varies       │
└─────────────────────┴──────────────┘
```

### Image Layer Caching

**Strategy**:

```go
type LayerCache struct {
    cacheDir string
    layers   map[string]string // digest → path
}

func (c *LayerCache) Get(digest string) (string, bool) {
    path, exists := c.layers[digest]
    if !exists {
        return "", false
    }

    // Verify file still exists
    if _, err := os.Stat(path); err != nil {
        delete(c.layers, digest)
        return "", false
    }

    return path, true
}

func (c *LayerCache) Put(digest, path string) {
    c.layers[digest] = path
}
```

**Benefits**:
- Reuse layers across images
- Faster pulls (cache hit)
- Reduced disk usage (shared layers)

### Copy-on-Write (CoW) Opportunities

**Future Optimization**: Use overlayfs for CoW layers

```
Current: Full layer extraction
┌─────────────────────────────────────────┐
│ layer1.tar.gz → extracted/             │
│ layer2.tar.gz → extracted/ (overwrites)│
│ layer3.tar.gz → extracted/ (overwrites)│
│ Total: ~500 MB (no sharing)            │
└─────────────────────────────────────────┘

Optimized: overlayfs
┌─────────────────────────────────────────┐
│ layer1 → /var/lib/ccrun/layers/abc123   │
│ layer2 → /var/lib/ccrun/layers/def456   │
│ layer3 → /var/lib/ccrun/layers/ghi789   │
│                                          │
│ container → overlayfs mount:            │
│   lowerdir=ghi789:def456:abc123         │
│   upperdir=/var/lib/ccrun/cont/xyz/diff │
│   workdir=/var/lib/ccrun/cont/xyz/work  │
│                                          │
│ Total: ~500 MB (shared if common layers)│
└─────────────────────────────────────────┘
```

---

## Security Considerations

### Namespace Escape Vectors

1. **/proc/sysrq-trigger**: Write to trigger kernel operations
   - **Mitigation**: Remount /proc read-only or hide entries

2. **Device file creation**: mknod to create block devices
   - **Mitigation**: Device cgroup controller or drop CAP_MKNOD

3. **File descriptor inheritance**: Pass open fds to child
   - **Mitigation**: Close all unnecessary fds before exec

4. **Ptrace escape**: Attach to parent process
   - **Mitigation**: Set PR_SET_DUMPABLE to 0

### Capability Dropping

```go
type Capability int

const (
    CAP_NET_ADMIN Capability = 12
    CAP_NET_RAW   Capability = 13
    CAP_SYS_ADMIN Capability = 21
    // ... others
)

func dropCapabilities(except []Capability) error {
    keep := make(map[Capability]bool)
    for _, cap := range except {
        keep[cap] = true
    }

    for i := 0; i <= CAP_LAST_CAP; i++ {
        if !keep[Capability(i)] {
            if err := syscall.Prctl(syscall.PR_CAPBSET_DROP, uintptr(i), 0, 0, 0); err != nil {
                return fmt.Errorf("drop cap %d: %w", i, err)
            }
        }
    }

    return nil
}
```

### seccomp Filter (Future Enhancement)

```go
// BPF bytecode for seccomp filter
const seccompFilter = `
// Allow only specific syscalls
ALLOW: read, write, exit, sigreturn
ALLOW: brk, mmap, munmap, rt_sigreturn
ALLOW: fstat, ioctl, readlink
DENY: everything-else
`

func applySeccomp() error {
    // Load BPF program
    // Call prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog)
    return nil
}
```

---

## References

### Kernel Documentation

- [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html)
- [clone(2)](https://man7.org/linux/man-pages/man2/clone.2.html)
- [chroot(2)](https://man7.org/linux/man-pages/man2/chroot.2.html)
- [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html)

### Specifications

- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec)
- [Docker Image Specification](https://github.com/opencontainers/image-spec)
- [Docker Registry HTTP API V2](https://docs.docker.com/registry/spec/api/)

### Source Code

- [Linux Kernel: kernel/ns.c](https://github.com/torvalds/linux/blob/master/kernel/ns.c)
- [runC (reference implementation)](https://github.com/opencontainers/runc)
- [containerd](https://github.com/containerd/containerd)
