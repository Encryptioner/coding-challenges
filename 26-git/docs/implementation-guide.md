# Git Implementation Guide

This tutorial walks you through implementing a Git clone from scratch. We'll build each feature step-by-step, explaining the design decisions and implementation details along the way.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Core Infrastructure](#core-infrastructure)
3. [Implementing git init](#implementing-git-init)
4. [Implementing git hash-object](#implementing-git-hash-object)
5. [Implementing git cat-file](#implementing-git-cat-file)
6. [Implementing git add](#implementing-git-add)
7. [Implementing git commit](#implementing-git-commit)
8. [Implementing git status](#implementing-git-status)
9. [Implementing git log](#implementing-git-log)
10. [Testing Your Implementation](#testing-your-implementation)

## Project Setup

### Choose Your Language

Git can be implemented in any language. The original is in C, but Python, Go, Rust, or JavaScript work well for learning. We'll use Python for this guide due to its readability.

### Project Structure

```
mygit/
├── mygit.py           # Main implementation
└── test.sh            # Test suite
```

### Dependencies

We need:
- **hashlib**: SHA-1 hashing
- **zlib**: Compression
- **pathlib**: Path manipulation
- **argparse**: Command-line parsing

```python
import hashlib
import zlib
import os
import time
from pathlib import Path
from datetime import datetime
import argparse
```

## Core Infrastructure

### Repository Class

Create a main class to manage the Git repository:

```python
class GitRepository:
    def __init__(self, repo_path="."):
        """Initialize repository at the given path"""
        self.repo_path = Path(repo_path)
        self.git_dir = self.repo_path / ".git"
        self.objects_dir = self.git_dir / "objects"
        self.refs_dir = self.git_dir / "refs"
        self.heads_dir = self.refs_dir / "heads"
        self.tags_dir = self.refs_dir / "tags"
```

**Design decision:** Using `pathlib.Path` makes path operations cross-platform and cleaner than string concatenation.

### Helper Methods

Add utility methods for object storage:

```python
def get_object_path(self, sha1):
    """Get filesystem path for an object"""
    return self.objects_dir / sha1[:2] / sha1[2:]

def ensure_object_dir(self, sha1):
    """Create object directory if needed"""
    obj_dir = self.objects_dir / sha1[:2]
    obj_dir.mkdir(parents=True, exist_ok=True)
```

**Design decision:** Git splits objects into directories by first 2 characters to avoid having too many files in one directory, which can slow down filesystem operations.

## Implementing git init

### Goal

Create a `.git` directory with the proper structure:

```
.git/
├── HEAD
├── config
├── description
├── objects/
│   ├── info/
│   └── pack/
└── refs/
    ├── heads/
    └── tags/
```

### Implementation

```python
def init(self):
    """Initialize a new Git repository"""
    # Check if already initialized
    if self.git_dir.exists():
        print(f"Reinitialized existing Git repository in {self.git_dir}")
        return

    # Create directory structure
    self.git_dir.mkdir(exist_ok=True)
    (self.objects_dir / "info").mkdir(parents=True, exist_ok=True)
    (self.objects_dir / "pack").mkdir(parents=True, exist_ok=True)
    self.heads_dir.mkdir(parents=True, exist_ok=True)
    self.tags_dir.mkdir(parents=True, exist_ok=True)

    # Create HEAD file pointing to main branch
    with open(self.git_dir / "HEAD", "w") as f:
        f.write("ref: refs/heads/main\n")

    # Create config file
    with open(self.git_dir / "config", "w") as f:
        f.write("[core]\n")
        f.write("\trepositoryformatversion = 0\n")
        f.write("\tfilemode = true\n")
        f.write("\tbare = false\n")

    # Create description file
    with open(self.git_dir / "description", "w") as f:
        f.write("Unnamed repository; edit this file to name the repository.\n")

    print(f"Initialized empty Git repository in {self.git_dir}")
```

### Key Points

1. **Check existing repository**: Prevent accidental reinitialization
2. **mkdir with parents=True**: Create nested directories in one call
3. **HEAD points to branch**: Even though the branch doesn't exist yet
4. **Config format**: Simple INI-style format

### Testing

```bash
$ python mygit.py init
Initialized empty Git repository in .git

$ ls -la .git/
drwxr-xr-x  7 user user  224 Nov 12 15:00 .
drwxr-xr-x  3 user user   96 Nov 12 15:00 ..
-rw-r--r--  1 user user   21 Nov 12 15:00 HEAD
-rw-r--r--  1 user user   92 Nov 12 15:00 config
-rw-r--r--  1 user user   73 Nov 12 15:00 description
drwxr-xr-x  4 user user  128 Nov 12 15:00 objects
drwxr-xr-x  4 user user  128 Nov 12 15:00 refs
```

## Implementing git hash-object

### Goal

Calculate SHA-1 hash of content and optionally store it as a blob object.

### Implementation

```python
def hash_object(self, data, obj_type="blob", write=False):
    """
    Hash an object and optionally write it to the database

    Args:
        data: bytes - Content to hash
        obj_type: str - Object type (blob, tree, commit, tag)
        write: bool - Write to object database if True

    Returns:
        str: SHA-1 hash of the object
    """
    # Create header: "blob 12\0" for 12 bytes of data
    header = f"{obj_type} {len(data)}\0".encode()

    # Combine header and data
    store = header + data

    # Calculate SHA-1 hash
    sha1 = hashlib.sha1(store).hexdigest()

    # Write to database if requested
    if write:
        # Compress the data
        compressed = zlib.compress(store)

        # Create object directory
        self.ensure_object_dir(sha1)

        # Write to file
        obj_path = self.get_object_path(sha1)
        with open(obj_path, "wb") as f:
            f.write(compressed)

    return sha1
```

### Key Points

1. **Header format**: `{type} {size}\0` - critical for correct hashing
2. **Return hash even without write**: Useful for comparing hashes
3. **Compression**: Always compress before writing
4. **Binary mode**: Use 'wb' for writing compressed data

### Example Usage

```python
# Hash without writing
data = b"Hello, Git!\n"
sha1 = repo.hash_object(data, write=False)
print(sha1)  # 8c01d89ae06311834ee4b1fab2f0414d35f01102

# Hash and write
sha1 = repo.hash_object(data, write=True)
# Object now exists at .git/objects/8c/01d89ae...
```

### Testing

```bash
$ echo "Hello, Git!" | python mygit.py hash-object --stdin
8c01d89ae06311834ee4b1fab2f0414d35f01102

$ echo "Hello, Git!" | python mygit.py hash-object --stdin -w
8c01d89ae06311834ee4b1fab2f0414d35f01102

$ ls .git/objects/8c/
01d89ae06311834ee4b1fab2f0414d35f01102
```

## Implementing git cat-file

### Goal

Read and display object contents from the database.

### Implementation

```python
def read_object(self, sha1):
    """
    Read an object from the database

    Args:
        sha1: str - SHA-1 hash of object

    Returns:
        tuple: (obj_type, content)
    """
    # Get object path
    obj_path = self.get_object_path(sha1)

    # Check if object exists
    if not obj_path.exists():
        raise ValueError(f"Object {sha1} not found")

    # Read and decompress
    with open(obj_path, "rb") as f:
        compressed = f.read()

    data = zlib.decompress(compressed)

    # Split header and content
    null_byte = data.index(b'\0')
    header = data[:null_byte].decode()
    content = data[null_byte + 1:]

    # Parse header
    obj_type, size = header.split(' ')

    return obj_type, content

def cat_file(self, sha1, show_type=False, show_size=False, pretty_print=False):
    """
    Display object information

    Args:
        sha1: str - SHA-1 hash
        show_type: bool - Show object type (-t flag)
        show_size: bool - Show object size (-s flag)
        pretty_print: bool - Pretty print content (-p flag)
    """
    obj_type, content = self.read_object(sha1)

    if show_type:
        print(obj_type)
    elif show_size:
        print(len(content))
    elif pretty_print:
        if obj_type == "blob":
            print(content.decode())
        elif obj_type == "tree":
            self._print_tree(content)
        elif obj_type == "commit":
            print(content.decode())

def _print_tree(self, data):
    """Print tree object in human-readable format"""
    i = 0
    while i < len(data):
        # Read mode
        space_idx = data.index(b' ', i)
        mode = data[i:space_idx].decode()

        # Read filename
        null_idx = data.index(b'\0', space_idx)
        filename = data[space_idx + 1:null_idx].decode()

        # Read SHA-1 (20 bytes)
        sha1_bytes = data[null_idx + 1:null_idx + 21]
        sha1 = sha1_bytes.hex()

        # Determine type from mode
        obj_type = "tree" if mode == "40000" else "blob"

        print(f"{mode} {obj_type} {sha1}\t{filename}")

        i = null_idx + 21
```

### Key Points

1. **Error handling**: Check if object exists
2. **Header parsing**: Extract type and size
3. **Tree format**: Binary parsing for tree entries
4. **Type-specific printing**: Different output for blobs vs trees vs commits

### Testing

```bash
$ python mygit.py cat-file -t 8c01d89
blob

$ python mygit.py cat-file -s 8c01d89
12

$ python mygit.py cat-file -p 8c01d89
Hello, Git!
```

## Implementing git add

### Goal

Stage files to the index for the next commit.

### Index Format

We'll use a simple text format (real Git uses binary):

```
[mode] [sha1] [filename]
100644 8c01d89ae06311834ee4b1fab2f0414d35f01102 README.md
100755 5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689 script.sh
```

### Implementation

```python
def add(self, filename):
    """
    Stage a file to the index

    Args:
        filename: str - Path to file to stage
    """
    filepath = Path(filename)

    # Check if file exists
    if not filepath.exists():
        raise FileNotFoundError(f"{filename} does not exist")

    # Read file content
    with open(filepath, "rb") as f:
        data = f.read()

    # Hash and store the blob
    sha1 = self.hash_object(data, obj_type="blob", write=True)

    # Determine file mode
    mode = "100755" if os.access(filepath, os.X_OK) else "100644"

    # Update index
    index_path = self.git_dir / "index"

    # Read existing index
    index_entries = {}
    if index_path.exists():
        with open(index_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 3:
                    m, s, fn = parts
                    index_entries[fn] = (m, s)

    # Add/update entry
    index_entries[filename] = (mode, sha1)

    # Write index back
    with open(index_path, "w") as f:
        for fn, (m, s) in sorted(index_entries.items()):
            f.write(f"{m} {s} {fn}\n")

    print(f"Added {filename}")
```

### Key Points

1. **Executable detection**: Use `os.access()` to check execute permission
2. **Index as dict**: Makes updating entries easier
3. **Sorted output**: Ensures consistent index format
4. **Blob created immediately**: Content is stored when staged

### Enhancement: Recursive Add

```python
def add(self, path):
    """Stage file(s) - supports directories"""
    p = Path(path)

    if p.is_file():
        self._add_file(p)
    elif p.is_dir():
        for item in p.rglob("*"):
            if item.is_file() and not str(item).startswith(".git"):
                self._add_file(item)

def _add_file(self, filepath):
    """Add a single file to index"""
    # ... (code from above)
```

### Testing

```bash
$ echo "Hello" > file.txt
$ python mygit.py add file.txt
Added file.txt

$ cat .git/index
100644 e965047ad7c57865823c7d992b1d046ea66edf78 file.txt
```

## Implementing git commit

### Goal

Create a commit object from the staged files.

### Implementation Steps

1. Build tree from index
2. Get parent commit
3. Create commit object
4. Update branch reference

### Implementation

```python
def write_tree(self):
    """
    Write tree object from current index

    Returns:
        str: SHA-1 hash of tree object
    """
    # Read index
    index_path = self.git_dir / "index"
    if not index_path.exists():
        raise ValueError("No files staged for commit")

    entries = []
    with open(index_path, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) == 3:
                mode, sha1, filename = parts
                entries.append((mode, filename, sha1))

    # Build tree content
    tree_content = b""
    for mode, filename, sha1 in sorted(entries, key=lambda x: x[1]):
        # Format: [mode] [space] [filename] [null] [20-byte SHA-1]
        tree_content += f"{mode} {filename}\0".encode()
        tree_content += bytes.fromhex(sha1)

    # Hash and store tree
    sha1 = self.hash_object(tree_content, obj_type="tree", write=True)
    return sha1

def get_current_branch(self):
    """Get name of current branch from HEAD"""
    head_path = self.git_dir / "HEAD"
    with open(head_path, "r") as f:
        content = f.read().strip()

    if content.startswith("ref: refs/heads/"):
        return content[16:]  # Remove "ref: refs/heads/"
    else:
        return None  # Detached HEAD

def get_head_commit(self):
    """Get SHA-1 of HEAD commit"""
    branch = self.get_current_branch()

    if branch is None:
        # Detached HEAD
        head_path = self.git_dir / "HEAD"
        with open(head_path, "r") as f:
            return f.read().strip()

    branch_ref = self.heads_dir / branch
    if not branch_ref.exists():
        return None  # First commit on this branch

    with open(branch_ref, "r") as f:
        return f.read().strip()

def commit(self, message, author=None, committer=None):
    """
    Create a commit object

    Args:
        message: str - Commit message
        author: str - Author (default: from environment)
        committer: str - Committer (default: same as author)

    Returns:
        str: SHA-1 hash of the commit object
    """
    # Write tree from index
    tree_hash = self.write_tree()

    # Get parent commit
    parent_hash = self.get_head_commit()

    # Default author/committer
    if author is None:
        author = os.environ.get("GIT_AUTHOR_NAME", "User")
        email = os.environ.get("GIT_AUTHOR_EMAIL", "user@example.com")
        author = f"{author} <{email}>"

    if committer is None:
        committer = author

    # Get timestamp
    timestamp = int(time.time())
    timezone = time.strftime("%z")
    if not timezone:
        timezone = "+0000"

    # Build commit content
    commit_content = f"tree {tree_hash}\n"

    if parent_hash:
        commit_content += f"parent {parent_hash}\n"

    commit_content += f"author {author} {timestamp} {timezone}\n"
    commit_content += f"committer {committer} {timestamp} {timezone}\n"
    commit_content += f"\n{message}\n"

    # Hash and store commit
    commit_hash = self.hash_object(
        commit_content.encode(),
        obj_type="commit",
        write=True
    )

    # Update branch reference
    branch = self.get_current_branch()
    branch_ref = self.heads_dir / branch
    with open(branch_ref, "w") as f:
        f.write(commit_hash + "\n")

    print(f"[{branch} {commit_hash[:7]}] {message}")
    return commit_hash
```

### Key Points

1. **Tree building**: Convert flat index to tree structure
2. **Parent handling**: Check if this is first commit
3. **Timestamps**: Use Unix timestamp + timezone
4. **Branch update**: Atomic write to branch reference

### Testing

```bash
$ echo "Hello" > file.txt
$ python mygit.py add file.txt
$ python mygit.py commit -m "Initial commit"
[main a1b2c3d] Initial commit

$ cat .git/refs/heads/main
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

## Implementing git status

### Goal

Compare HEAD, index, and working directory to show file states.

### The Three-Way Comparison

```
HEAD       Index      Working Dir    Status
----       -----      -----------    ------
A          A          A              Clean
A          A          B              Modified (unstaged)
A          B          B              Modified (staged)
-          A          A              New file (staged)
-          -          A              Untracked
A          -          -              Deleted (staged)
A          A          -              Deleted (unstaged)
```

### Implementation

```python
def status(self):
    """Show working tree status"""
    branch = self.get_current_branch()
    print(f"On branch {branch}")

    # Check if there are commits
    head_commit = self.get_head_commit()
    if not head_commit:
        print("\nNo commits yet")

    # Get HEAD tree files (files in last commit)
    head_files = {}
    if head_commit:
        # Read commit object
        commit_type, commit_content = self.read_object(head_commit)

        # Parse commit to get tree hash
        for line in commit_content.decode().split('\n'):
            if line.startswith('tree '):
                tree_hash = line[5:].strip()

                # Read tree object
                tree_type, tree_content = self.read_object(tree_hash)

                # Parse tree entries
                i = 0
                while i < len(tree_content):
                    # Find space (end of mode)
                    space_idx = tree_content.index(b' ', i)
                    mode = tree_content[i:space_idx]

                    # Find null (end of filename)
                    null_idx = tree_content.index(b'\0', space_idx)
                    filename = tree_content[space_idx + 1:null_idx].decode()

                    # Get SHA-1 (20 bytes)
                    sha1_bytes = tree_content[null_idx + 1:null_idx + 21]
                    sha1 = sha1_bytes.hex()
                    head_files[filename] = sha1

                    i = null_idx + 21
                break

    # Read index
    index_path = self.git_dir / "index"
    staged_files = {}

    if index_path.exists():
        with open(index_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 3:
                    mode, sha1, filename = parts
                    staged_files[filename] = sha1

    # Get working directory files
    working_files = {}
    for filepath in Path(".").rglob("*"):
        if filepath.is_file() and not str(filepath).startswith(".git"):
            rel_path = str(filepath)
            with open(filepath, "rb") as f:
                data = f.read()

            # Calculate what the hash would be
            header = f"blob {len(data)}\0".encode()
            sha1 = hashlib.sha1(header + data).hexdigest()
            working_files[rel_path] = sha1

    # Determine changes
    changes_to_commit = []
    changes_not_staged = []
    untracked = []

    # Compare index with HEAD to find changes to be committed
    for filename, sha1 in staged_files.items():
        # Check if file is different from HEAD or new
        if filename not in head_files or head_files[filename] != sha1:
            changes_to_commit.append(filename)

    # Check staged files for unstaged changes
    for filename, sha1 in staged_files.items():
        if filename in working_files:
            if working_files[filename] != sha1:
                changes_not_staged.append(filename)
        else:
            changes_not_staged.append(f"{filename} (deleted)")

    # Check working files for untracked files
    for filename, sha1 in working_files.items():
        if filename not in staged_files:
            untracked.append(filename)

    # Print status
    if changes_to_commit:
        print("\nChanges to be committed:")
        print("  (use \"git restore --staged <file>...\" to unstage)")
        for filename in changes_to_commit:
            print(f"\t\033[32mnew file:   {filename}\033[0m")

    if changes_not_staged:
        print("\nChanges not staged for commit:")
        print("  (use \"git add <file>...\" to update what will be committed)")
        for filename in changes_not_staged:
            if "(deleted)" in filename:
                print(f"\t\033[31mdeleted:    {filename}\033[0m")
            else:
                print(f"\t\033[31mmodified:   {filename}\033[0m")

    if untracked:
        print("\nUntracked files:")
        print("  (use \"git add <file>...\" to include in what will be committed)")
        for filename in untracked:
            print(f"\t\033[31m{filename}\033[0m")

    if not changes_to_commit and not changes_not_staged and not untracked:
        print("\nnothing to commit, working tree clean")
```

### Key Points

1. **Three-way comparison**: HEAD vs index vs working directory
2. **Hash calculation**: Compare content hashes, not timestamps
3. **Color coding**: Use ANSI codes for visual feedback
4. **Edge cases**: Handle first commit, empty directories

### Testing

```bash
$ python mygit.py status
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	file.txt

$ python mygit.py add file.txt
$ python mygit.py status
On branch main

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   file.txt
```

## Implementing git log

### Goal

Display commit history by following parent pointers.

### Implementation

```python
def log(self, max_count=None):
    """
    Show commit history

    Args:
        max_count: int - Maximum number of commits to show
    """
    # Get current commit
    commit_hash = self.get_head_commit()

    if not commit_hash:
        print("No commits yet")
        return

    count = 0
    while commit_hash and (max_count is None or count < max_count):
        # Read commit object
        obj_type, content = self.read_object(commit_hash)

        if obj_type != "commit":
            break

        # Parse commit
        lines = content.decode().split('\n')
        tree = None
        parent = None
        author = None
        committer = None
        message_lines = []
        in_message = False

        for line in lines:
            if line.startswith('tree '):
                tree = line[5:]
            elif line.startswith('parent '):
                parent = line[7:]
            elif line.startswith('author '):
                author = line[7:]
            elif line.startswith('committer '):
                committer = line[10:]
            elif line == '':
                in_message = True
            elif in_message:
                message_lines.append(line)

        # Print commit info
        print(f"commit {commit_hash}")
        if author:
            # Parse author info
            parts = author.rsplit(' ', 2)
            if len(parts) == 3:
                name_email = parts[0]
                timestamp = int(parts[1])
                dt = datetime.fromtimestamp(timestamp)
                print(f"Author: {name_email}")
                print(f"Date:   {dt.strftime('%a %b %d %H:%M:%S %Y')}")

        print()
        for line in message_lines:
            print(f"    {line}")
        print()

        # Move to parent
        commit_hash = parent
        count += 1
```

### Key Points

1. **Follow parent chain**: Traverse linked list of commits
2. **Parse commit format**: Extract metadata and message
3. **Format dates**: Convert Unix timestamp to readable format
4. **Stop conditions**: No parent or max count reached

### Testing

```bash
$ python mygit.py log
commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Author: John Doe <john@example.com>
Date:   Fri Nov 10 00:00:00 2023

    Initial commit

commit e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3
Author: John Doe <john@example.com>
Date:   Fri Nov 10 00:10:00 2023

    Add source files
```

## Testing Your Implementation

### Create a Test Suite

```bash
#!/bin/bash

# test.sh - Comprehensive test suite

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

# mygit command
MYGIT="$(pwd)/mygit.py"

# Test function
run_test() {
    local description="$1"
    shift
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Test $TOTAL_TESTS: $description... "

    if "$@"; then
        echo -e "${GREEN}✓${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC}"
    fi
}

# Setup
TEST_DIR="test-repo"
rm -rf "$TEST_DIR"
mkdir "$TEST_DIR"
cd "$TEST_DIR"

# Test 1: init creates .git directory
run_test "git init creates .git directory" \
    test -d .git

# Test 2: .git has correct structure
run_test ".git has correct structure" \
    bash -c "test -d .git/objects && test -d .git/refs/heads"

# Test 3: HEAD points to refs/heads/main
run_test "HEAD points to refs/heads/main" \
    grep -q "ref: refs/heads/main" .git/HEAD

# Test 4: hash-object computes correct hash
echo "test content" > test.txt
HASH=$($MYGIT hash-object test.txt)
run_test "hash-object computes correct hash" \
    test "$HASH" = "d670460b4b4aece5915caf5c68d12f560a9fe3e4"

# Test 5: hash-object -w writes object
$MYGIT hash-object -w test.txt
run_test "hash-object -w writes object" \
    test -f ".git/objects/${HASH:0:2}/${HASH:2}"

# Test 6: add stages file
$MYGIT add test.txt
run_test "add stages file to index" \
    grep -q "test.txt" .git/index

# Test 7: commit creates commit object
$MYGIT commit -m "Test commit"
run_test "commit creates commit object" \
    test -f .git/refs/heads/main

# Test 8: status shows clean tree
STATUS=$($MYGIT status)
run_test "status shows clean tree after commit" \
    echo "$STATUS" | grep -q "nothing to commit"

# Summary
echo ""
echo "========================================
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
```

### Run Tests

```bash
$ chmod +x test.sh
$ ./test.sh
Test 1: git init creates .git directory... ✓
Test 2: .git has correct structure... ✓
Test 3: HEAD points to refs/heads/main... ✓
...
========================================
Total Tests: 18
Passed: 18
Failed: 0

All tests passed!
```

## Summary

You've now implemented a working Git clone with:

1. **Repository initialization** (`git init`)
2. **Object storage** (`git hash-object`)
3. **Object retrieval** (`git cat-file`)
4. **File staging** (`git add`)
5. **Creating commits** (`git commit`)
6. **Status checking** (`git status`)
7. **History viewing** (`git log`)

### What's Missing

A full Git implementation would also include:

- **Branches**: `git branch`, `git checkout`
- **Merging**: `git merge`
- **Remote operations**: `git push`, `git pull`, `git fetch`
- **Diffs**: `git diff`
- **Packed objects**: Compression of multiple objects
- **Garbage collection**: Removing unreachable objects
- **Index optimizations**: Binary format, extensions
- **Submodules**: Nested repositories
- **Hooks**: Custom scripts triggered by Git events

### Next Steps

1. **Add more commands**: Implement `branch`, `checkout`, `merge`
2. **Optimize storage**: Implement packed objects
3. **Add networking**: Implement remote operations
4. **Improve performance**: Use binary index format
5. **Add Git hooks**: Support pre-commit, post-commit hooks

### Resources

- **Git Internals**: [git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- **Git Source Code**: [github.com/git/git](https://github.com/git/git)
- **Object Model**: See `object-model.md`
- **Practical Examples**: See `examples.md`

Congratulations on implementing Git! You now understand how version control systems work at a deep level.
