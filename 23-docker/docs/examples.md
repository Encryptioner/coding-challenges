# Examples - Build Your Own Docker

This guide provides practical examples and use cases for using the `ccrun` container runtime, from basic command execution to advanced containerization scenarios.

## Table of Contents

1. [Quick Start Examples](#quick-start-examples)
2. [Step-by-Step Walkthrough](#step-by-step-walkthrough)
3. [Real-World Scenarios](#real-world-scenarios)
4. [Troubleshooting Examples](#troubleshooting-examples)
5. [Integration Examples](#integration-examples)

---

## Quick Start Examples

### Example 1: Basic Command Execution

**Goal**: Run a simple command without containerization (Step 1 functionality).

```bash
# Echo a message
./ccrun run echo "Hello from ccrun!"
# Output: Hello from ccrun!

# List files in current directory
./ccrun run ls -la /tmp

# Run a shell command
./ccrun run bash -c "echo 'Hello' && echo 'World'"

# Exit code propagation
./ccrun run ls /nonexistent
echo $?
# Output: 1

./ccrun run true
echo $?
# Output: 0
```

### Example 2: Hostname Isolation

**Goal**: Run a container with a custom hostname.

```bash
# Start container with custom hostname
./ccrun run --hostname webserver bash

# Inside container, check hostname
hostname
# Output: webserver

# Change hostname inside container (doesn't affect host)
hostname newname
hostname
# Output: newname

# On another terminal, check host hostname
hostname
# Output: <original-hostname>
```

### Example 3: Alpine Linux Filesystem

**Goal**: Run commands in an Alpine Linux environment.

**Setup**:

```bash
# Download Alpine mini root filesystem
wget https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-minirootfs-3.19.1-x86_64.tar.gz

# Extract to directory
mkdir -p alpine-fs
tar -xzf alpine-minirootfs-3.19.1-x86_64.tar.gz -C alpine-fs/

# Verify extraction
ls alpine-fs/
# Output: bin  dev  etc  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
```

**Usage**:

```bash
# Run Alpine shell
./ccrun run --rootfs alpine-fs /bin/busybox sh

# Inside Alpine container
/ # ls /
# Output: bin  dev  etc  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var

# Try to escape (you can't!)
/ # cd /
/ # cd ..
/ # pwd
# Output: /

/ # ls /home
# Output: (empty - doesn't exist in Alpine)

# Run Alpine commands
/ # apk --version
# Output: apk-tools 2.14.0
```

### Example 4: Process Isolation

**Goal**: Verify that container processes are isolated.

```bash
# Start container with PID isolation
./ccrun run --rootfs alpine-fs --isolate-pid /bin/busybox sh

# Inside container, check processes
/ # ps aux
# Output:
# PID   USER     TIME  COMMAND
# 1     root     0:00  ccrun
# 7     root     0:00  sh
# 8     root     0:00  ps aux

# Only 3 processes visible!

# Start background process
/ # /bin/busybox sleep 1000 &

/ # ps aux
# PID   USER     TIME  COMMAND
# 1     root     0:00  ccrun
# 7     root     0:00  sh
# 9     root     0:00  sleep 1000
# 10    root     0:00  ps aux
```

**On host** (simultaneously):

```bash
# Find all processes
ps aux | grep -E "(ccrun|sh|sleep)"

# Output shows hundreds of processes, including ccrun
# The container PID 1 is NOT host PID 1 (which is init/systemd)
# The sleep process shows a different PID on host
```

### Example 5: Rootless Container

**Goal**: Container runs as root inside but as regular user on host.

```bash
# Check current user
whoami
# Output: <your-username>

# Run rootless container
./ccrun run --rootfs alpine-fs --rootless /bin/busybox sh

# Inside container
/ # whoami
# Output: root

/ # id
# Output: uid=0(root) gid=0(root) groups=0(root)
```

**On host** (simultaneously):

```bash
# Check what user the process is running as
ps -ef | grep ccrun

# Output shows username (not root)
# username  12345  ...  ccrun run --rootfs alpine-fs --rootless /bin/busybox sh
```

### Example 6: Resource Limits

**Goal**: Limit container memory and CPU.

```bash
# Limit to 256MB memory
./ccrun run --rootfs alpine-fs --memory 256m /bin/busybox sh

# Inside container, try to allocate memory
/ # /bin/busybox free -m
# Shows ~256MB available

# Try to exceed limit (will be killed)
/ # dd if=/dev/zero of=/tmp/bigfile bs=1M count=300
# Killed (OOM killer)

# Limit CPU shares (lower weight = less CPU time)
./ccrun run --rootfs alpine-fs --cpu-shares 128 /bin/busybox sh

# Run CPU-intensive task
/ # yes > /dev/null &
```

**On host**:

```bash
# Check cgroup limits
cat /sys/fs/cgroup/ccrun-<id>/memory.max
# Output: 268435456 (256MB in bytes)

cat /sys/fs/cgroup/ccrun-<id>/cpu.weight
# Output: 128 (relative weight)
```

---

## Step-by-Step Walkthrough

### Complete Example: From Download to Running

**Scenario**: Download, set up, and run an Nginx container.

#### Step 1: Pull Nginx Image

```bash
# Pull from Docker Hub
./ccrun pull nginx:alpine

# Output:
# Pulling manifest...
# Downloading layers...
# Layer 1/5: sha256:... (1.2 MB)
# Layer 2/5: sha256:... (2.3 MB)
# ...
# Extracting layers...
# Downloading config...
# Image pulled successfully
```

#### Step 2: Verify Pulled Image

```bash
# List pulled images
./ccrun images

# Output:
# REPOSITORY   TAG      SIZE
# nginx        alpine   42.5 MB
# alpine       latest   7.8 MB
```

#### Step 3: Run Nginx

```bash
# Run nginx in foreground
./ccrun run nginx:alpine nginx -g "daemon off;"

# Output:
# nginx is running...

# In another terminal, test
curl http://localhost:80/
# Output: Welcome to nginx!
```

#### Step 4: Run Nginx with Custom Config

```bash
# Create config directory
mkdir -p nginx-config

# Create simple config
cat > nginx-config/nginx.conf <<'EOF'
events {
    worker_connections 1024;
}
http {
    server {
        listen 8080;
        location / {
            return 200 "Hello from ccrun nginx!\n";
        }
    }
}
EOF

# Mount config into container
./ccrun run \
  --mount $(pwd)/nginx-config:/etc/nginx \
  nginx:alpine nginx -g "daemon off;" -c /etc/nginx/nginx.conf

curl http://localhost:8080/
# Output: Hello from ccrun nginx!
```

---

## Real-World Scenarios

### Scenario 1: Development Environment

**Goal**: Create an isolated development environment for a Node.js application.

```bash
# Pull Node.js image
./ccrun pull node:20-alpine

# Run with volume mount
./ccrun run \
  --hostname dev-env \
  --memory 512m \
  --mount $(pwd)/myapp:/workspace \
  node:20-alpine sh

# Inside container
/ # cd /workspace
/workspace # npm install
/workspace # npm run dev
```

### Scenario 2: Database Server

**Goal**: Run a PostgreSQL database for testing.

```bash
# Pull PostgreSQL image
./ccrun pull postgres:16-alpine

# Create data directory
mkdir -p pgdata

# Run PostgreSQL
./ccrun run \
  --hostname pg-server \
  --memory 1g \
  --mount $(pwd)/pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=mypassword \
  postgres:16-alpine

# Connect from another container
./ccrun run --network container:pg-server postgres:16-alpine psql -h pg-server -U postgres
```

### Scenario 3: Web Application Stack

**Goal**: Run a multi-tier application (frontend + backend + database).

```bash
# Start database
./ccrun run --name db postgres:16-alpine &
DB_PID=$!

# Start backend
./ccrun run \
  --name backend \
  --link db:database \
  -e DATABASE_URL=postgres://postgres:password@database:5432/myapp \
  myapp/backend &
BACKEND_PID=$!

# Start frontend
./ccrun run \
  --name frontend \
  --link backend:api \
  -e API_URL=http://api:8080 \
  myapp/frontend &
FRONTEND_PID=$!

# Cleanup on Ctrl+C
trap "kill $DB_PID $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

### Scenario 4: Build Environment

**Goal**: Use container for reproducible builds.

```bash
# Pull build image
./ccrun pull golang:1.21-alpine

# Mount source and build
./ccrun run \
  --mount $(pwd)/myproject:/src \
  golang:1.21-alpine sh -c "cd /src && go build -o /out/myapp ."

# Built binary is in host directory
ls -lh myproject/myapp
```

### Scenario 5: Batch Processing

**Goal**: Process data files in isolated environment.

```bash
# Pull Python image
./ccrun pull python:3.12-slim

# Process file
./ccrun run \
  --mount $(pwd)/data:/data:ro \
  --mount $(pwd)/output:/output \
  python:3.12-slim python /scripts/process.py /data/input.csv /output/output.json

# Results are in host directory
cat output/output.json
```

---

## Troubleshooting Examples

### Problem 1: Container Won't Start

**Symptom**: `Error: OCI runtime create failed`

**Diagnosis**:

```bash
# Enable verbose logging
./ccrun --debug run alpine sh

# Check namespace support
cat /proc/self/ns/{uts,pid,mnt,user,net}

# Verify cgroup v2
mount | grep cgroup
```

**Solution**:

```bash
# Ensure running as root for some operations
sudo ./ccrun run alpine sh

# Or use rootless mode
./ccrun run --rootless alpine sh
```

### Problem 2: Cannot Access Network

**Symptom**: No network connectivity in container

**Diagnosis**:

```bash
# Check if network namespace is isolated
./ccrun run alpine ip addr
# Shows only loopback if network namespace created

# Check bridge exists (on host)
ip link show docker0
# May not exist in custom runtime
```

**Solution**:

```bash
# Don't create network namespace (share host network)
./ccrun run --network host alpine sh

# Or set up networking manually
./ccrun run --network bridge alpine sh
```

### Problem 3: Permission Denied Errors

**Symptom**: `chroot: operation not permitted`

**Diagnosis**:

```bash
# Check capabilities
capsh --print

# Check if running with necessary caps
getcap $(which ccrun)
```

**Solution**:

```bash
# Run with sudo
sudo ./ccrun run alpine sh

# Or set capabilities
sudo setcap cap_sys_admin+ep $(which ccrun)
```

### Problem 4: Out of Memory

**Symptom**: Container gets killed when running large workloads

**Diagnosis**:

```bash
# Check current limit
cat /sys/fs/cgroup/ccrun-<id>/memory.max

# Check usage
cat /sys/fs/cgroup/ccrun-<id>/memory.current
```

**Solution**:

```bash
# Increase memory limit
./ccrun run --memory 2g alpine sh

# Or disable memory limit
./ccrun run --memory -1 alpine sh
```

---

## Integration Examples

### Example 1: CI/CD Pipeline

**Scenario**: Use ccrun in GitHub Actions for testing.

```yaml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build ccrun
        run: go build -o ccrun ./cmd/ccrun
      - name: Pull test image
        run: ./ccrun pull alpine:latest
      - name: Run tests in container
        run: |
          ./ccrun run \
            --mount ${{ github.workspace }}:/app \
            alpine:latest sh -c "cd /app && ./test.sh"
```

### Example 2: Local Development Script

**Scenario**: Wrapper script for common development tasks.

```bash
#!/bin/bash
# dev.sh - Development environment launcher

IMAGE="node:20-alpine"
WORKSPACE="$(pwd)"
CONTAINER_NAME="dev-$(basename $WORKSPACE)"

case "$1" in
  shell)
    ./ccrun run \
      --hostname $CONTAINER_NAME \
      --mount $WORKSPACE:/workspace \
      --memory 1g \
      $IMAGE sh
    ;;
  test)
    ./ccrun run \
      --mount $WORKSPACE:/workspace \
      $IMAGE sh -c "cd /workspace && npm test"
    ;;
  build)
    ./ccrun run \
      --mount $WORKSPACE:/workspace \
      --mount $WORKSPACE/dist:/out \
      $IMAGE sh -c "cd /workspace && npm run build && cp -r dist/* /out/"
    ;;
  *)
    echo "Usage: $0 {shell|test|build}"
    exit 1
esac
```

### Example 3: Monitoring Script

**Scenario**: Monitor resource usage of running containers.

```bash
#!/bin/bash
# monitor-containers.sh

while true; do
  clear
  echo "Container Resource Usage"
  echo "========================="
  echo ""

  for container in /sys/fs/cgroup/ccrun-*; do
    if [ -d "$container" ]; then
      name=$(basename $container)
      memory=$(cat $container/memory.current 2>/dev/null || echo "N/A")
      cpu=$(cat $container/cpu.stat 2>/dev/null | grep usage_usec || echo "N/A")
      pids=$(cat $container/cgroup.procs 2>/dev/null | wc -l)

      echo "Container: $name"
      echo "  Memory: $memory bytes"
      echo "  PIDs: $pids"
      echo ""
    fi
  done

  sleep 2
done
```

### Example 4: Cleanup Script

**Scenario**: Clean up old containers and images.

```bash
#!/bin/bash
# cleanup.sh

echo "Removing stopped containers..."
for container_dir in /var/lib/ccrun/containers/*; do
  if [ -d "$container_dir" ]; then
    # Check if container is running
    if [ ! -d "$container_dir/ns" ]; then
      echo "Removing $(basename $container_dir)"
      rm -rf "$container_dir"
    fi
  fi
done

echo "Removing unused images..."
./ccrun images --format "{{.ID}} {{.CreatedAt}}" | \
  awk 'NR>1 && $2 < "'$(date -d '7 days ago' '+%s')'" {print $1}' | \
  while read image_id; do
    echo "Removing image $image_id"
    ./ccrun rmi $image_id
  done

echo "Cleanup complete!"
```

---

## Performance Benchmarks

### Startup Time Comparison

```bash
# Time container startup
time ./ccrun run alpine sh -c "exit"
# ~10-50ms for basic container

time ./ccrun run --rootfs alpine-fs alpine sh -c "exit"
# ~20-100ms with chroot

time ./ccrun pull --run alpine sh -c "exit"
# ~500ms-2s (includes pull time for cached image)
```

### Memory Overhead

```bash
# Base container
./ccrun run alpine sh
# ~2-4 MB RSS overhead

# With multiple namespaces
./ccrun run --isolate-pid --isolate-network alpine sh
# ~4-8 MB RSS overhead

# With cgroups
./ccrun run --memory 100m alpine sh
# Same RSS, but limited allocation
```

---

## Tips and Tricks

### Tip 1: Preserve Exit Codes

```bash
# Capture exit code properly
./ccun run alpine sh -c "exit 42"
echo $?
# Output: 42

# Use in scripts
if ./ccrun run alpine sh -c "some-command"; then
  echo "Success"
else
  echo "Failed with code $?"
fi
```

### Tip 2: Interactive Sessions

```bash
# Allocate pseudo-TTY for interactive shells
./ccrun run -t alpine sh

# Works with ssh
ssh user@host "ccrun run -t alpine sh"
```

### Tip 3: Background Containers

```bash
# Run in background
./ccrun run -d alpine sleep 1000

# List running containers
./ccrun ps

# Attach to background container
./ccrun attach <container-id>
```

### Tip 4: Clean Shutdown

```bash
# Send SIGTERM to container
./ccrun stop <container-id>

# Force kill
./ccrun kill <container-id>

# Remove container
./ccrun rm <container-id>
```

---

## Common Patterns

### Pattern 1: Ephemeral Containers

```bash
# Run once and exit
./ccrun run --rm alpine echo "One-time task"
```

### Pattern 2: Persistent Data

```bash
# Use named volumes
./ccrun run --volume pgdata:/var/lib/postgresql/data postgres

# Volume persists after container removal
```

### Pattern 3: Service Discovery

```bash
# Link containers
./ccrun run --name db postgres
./ccun run --link db:database app

# Container 'app' can access 'database' hostname
```

### Pattern 4: Environment Configuration

```bash
# Pass environment variables
./ccrun run -e API_URL=http://api.example.com -e DEBUG=true myapp

# Or load from file
./ccrun run --env-file .env myapp
```

---

## Example Output Comparison

### Docker vs ccrun

| Feature | Docker | ccrun | Notes |
|---------|--------|-------|-------|
| Run container | `docker run alpine sh` | `./ccrun run alpine sh` | Similar syntax |
| Pull image | `docker pull alpine` | `./ccrun pull alpine` | Compatible |
| List containers | `docker ps` | `./ccrun ps` | Simplified |
| Stop container | `docker stop <id>` | `./ccrun stop <id>` | Basic only |
| Remove container | `docker rm <id>` | `./ccrun rm <id>` | Works |
| Build image | `docker build .` | Not implemented | Future work |
| Docker Compose | `docker-compose up` | Not implemented | Future work |

---

## Summary

These examples demonstrate that while `ccrun` is a simplified container runtime, it covers the core functionality needed for:

- Development environments
- Testing and CI/CD
- Microservice deployment
- Batch processing
- Learning container internals

For production use, consider Docker or other mature runtimes, but `ccrun` provides excellent educational value and can handle many practical scenarios.
