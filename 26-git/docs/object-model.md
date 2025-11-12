# Git Object Model: A Complete Guide

This tutorial provides a comprehensive understanding of Git's object model - the foundation of how Git stores and manages your project history.

## Table of Contents

1. [Overview](#overview)
2. [Blob Objects](#blob-objects)
3. [Tree Objects](#tree-objects)
4. [Commit Objects](#commit-objects)
5. [Tag Objects](#tag-objects)
6. [Object Relationships](#object-relationships)
7. [Complete Example Walkthrough](#complete-example-walkthrough)

## Overview

Git's object model consists of four types of objects, all stored in the `.git/objects/` directory:

| Object Type | Purpose | Contains |
|------------|---------|----------|
| **Blob** | Stores file contents | Raw file data |
| **Tree** | Stores directory structure | List of blobs and subtrees |
| **Commit** | Stores snapshot with metadata | Tree + parent + author + message |
| **Tag** | Stores named reference | Commit reference + annotation |

All objects share common characteristics:

1. **Immutable**: Once created, never modified
2. **Content-addressed**: Identified by SHA-1 hash of contents
3. **Compressed**: Stored using zlib compression
4. **Self-describing**: Include type and size in header

## Blob Objects

### What is a Blob?

A **blob** (Binary Large Object) stores the contents of a file. It contains **only the data** - no filename, no metadata, no directory information.

### Blob Format

```
blob [size]\0[content]
```

- `blob`: Object type
- `[size]`: Content size in bytes
- `\0`: Null byte separator
- `[content]`: Actual file contents

### Creating a Blob

**Example 1: Simple text file**

```bash
$ echo "Hello, Git!" > hello.txt
$ git add hello.txt
$ git ls-files --stage
100644 8c01d89ae06311834ee4b1fab2f0414d35f01102 0	hello.txt
```

The SHA-1 hash `8c01d89...` identifies the blob containing "Hello, Git!\n".

**Example 2: Manual blob creation**

```bash
$ echo "Hello, Git!" | git hash-object --stdin -w
8c01d89ae06311834ee4b1fab2f0414d35f01102

$ git cat-file -t 8c01d89ae06311834ee4b1fab2f0414d35f01102
blob

$ git cat-file -s 8c01d89ae06311834ee4b1fab2f0414d35f01102
12

$ git cat-file -p 8c01d89ae06311834ee4b1fab2f0414d35f01102
Hello, Git!
```

### How Blobs are Stored

**Step-by-step process:**

1. **Read file content:**
   ```
   content = "Hello, Git!\n"  # 12 bytes
   ```

2. **Create header:**
   ```
   header = "blob 12\0"
   ```

3. **Combine:**
   ```
   store = "blob 12\0Hello, Git!\n"
   ```

4. **Calculate SHA-1:**
   ```
   sha1 = SHA1(store)
        = "8c01d89ae06311834ee4b1fab2f0414d35f01102"
   ```

5. **Compress:**
   ```
   compressed = zlib.compress(store)
   ```

6. **Write to file:**
   ```
   path = .git/objects/8c/01d89ae06311834ee4b1fab2f0414d35f01102
   ```

### Blob Characteristics

**1. Content-based identity:**

Two files with identical content share the same blob, even with different names:

```bash
$ echo "Hello" > file1.txt
$ echo "Hello" > file2.txt
$ git add file1.txt file2.txt
$ git ls-files --stage
100644 e965047ad7c57865823c7d992b1d046ea66edf78 0	file1.txt
100644 e965047ad7c57865823c7d992b1d046ea66edf78 0	file2.txt
```

Both files reference the **same blob** (`e965047...`).

**2. No filename stored:**

Blobs don't know their filenames. This information is stored in tree objects.

**3. Binary or text:**

Git treats all file contents as binary data. There's no distinction in storage:

```bash
$ git hash-object image.png -w
a3f5c8b2e8d4f9a7c6b5e3d2a1f0c8b7e6d5a4c3

$ git cat-file -t a3f5c8b2e8d4f9a7c6b5e3d2a1f0c8b7e6d5a4c3
blob
```

## Tree Objects

### What is a Tree?

A **tree** object represents a directory. It stores the mapping between filenames and their content (blobs or other trees).

### Tree Format

Trees are stored in binary format for efficiency:

```
[mode] [space] [filename] [null] [20-byte SHA-1]
[mode] [space] [filename] [null] [20-byte SHA-1]
...
```

**Mode values:**

| Mode | Type | Description |
|------|------|-------------|
| `040000` | Directory | Subdirectory (points to tree object) |
| `100644` | Regular file | Normal file (points to blob object) |
| `100755` | Executable | Executable file (points to blob object) |
| `120000` | Symlink | Symbolic link (points to blob containing link target) |

### Creating a Tree

**Example: Simple directory**

```
project/
├── README.md
└── script.sh
```

**Step 1: Create blobs**

```bash
$ git add README.md script.sh
$ git ls-files --stage
100644 e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d 0	README.md
100755 5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689 0	script.sh
```

**Step 2: Create tree**

```bash
$ git write-tree
3b18e512dba79e4c8300dd08aeb37f8e728b8dad
```

**Step 3: View tree**

```bash
$ git cat-file -p 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
100644 blob e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d    README.md
100755 blob 5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689    script.sh
```

### Nested Trees

Trees can contain other trees to represent nested directories.

**Example: Nested structure**

```
project/
├── README.md
├── src/
│   ├── main.py
│   └── utils.py
└── tests/
    └── test_main.py
```

**Tree for project/ (root):**

```
100644 blob [sha1]    README.md
040000 tree [sha1]    src
040000 tree [sha1]    tests
```

**Tree for src/:**

```
100644 blob [sha1]    main.py
100644 blob [sha1]    utils.py
```

**Tree for tests/:**

```
100644 blob [sha1]    test_main.py
```

**Visual representation:**

```
Root Tree [3b18e5]
├── README.md → Blob [e2a86f]
├── src → Tree [8ab686]
│   ├── main.py → Blob [5e1c30]
│   └── utils.py → Blob [a3f5c8]
└── tests → Tree [7d9c45]
    └── test_main.py → Blob [2f8e3a]
```

### How Trees are Stored

**Building the tree content:**

```python
entries = [
    (100644, "README.md", "e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d"),
    (100755, "script.sh", "5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689"),
]

# Build binary content
tree_content = b""
for mode, filename, sha1_hex in entries:
    tree_content += f"{mode} {filename}\0".encode()
    tree_content += bytes.fromhex(sha1_hex)

# Add header
header = f"tree {len(tree_content)}\0".encode()
store = header + tree_content

# Calculate SHA-1
sha1 = hashlib.sha1(store).hexdigest()

# Compress and write
compressed = zlib.compress(store)
write_object(sha1, compressed)
```

### Tree Characteristics

**1. Snapshots, not deltas:**

Trees represent complete directory states. Git doesn't store diffs between versions at this level.

**2. Sorted entries:**

Entries are sorted by name for consistent hashing and efficient lookups.

**3. Efficient storage:**

Unchanged subdirectories reference the same tree object across commits:

```
Commit A:
Root Tree [abc123]
└── src → Tree [def456]

Commit B (only README changed):
Root Tree [ghi789]
└── src → Tree [def456]  # Same tree object!
```

## Commit Objects

### What is a Commit?

A **commit** object represents a snapshot of your project at a specific point in time, along with metadata about who, when, and why.

### Commit Format

```
tree [sha1]
parent [sha1]
parent [sha1]  # Additional parents for merge commits
author [name] <[email]> [timestamp] [timezone]
committer [name] <[email]> [timestamp] [timezone]

[commit message]
```

### Creating a Commit

**Example:**

```bash
$ git commit -m "Initial commit"
[main (root-commit) e2a86f6] Initial commit
 2 files changed, 10 insertions(+)
 create mode 100644 README.md
 create mode 100755 script.sh
```

**View the commit:**

```bash
$ git cat-file -p e2a86f6
tree 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
author John Doe <john@example.com> 1699564800 +0000
committer John Doe <john@example.com> 1699564800 +0000

Initial commit
```

### Commit Components

**1. Tree:**

Points to the root tree representing the complete project snapshot.

```
commit [e2a86f6]
└── tree [3b18e51]
    ├── README.md → blob [e2a86f6]
    └── script.sh → blob [5e1c309]
```

**2. Parent:**

Points to the previous commit (missing for initial commit).

```
Commit History:
C ← B ← A

Commit C:
  tree [...]
  parent B

Commit B:
  tree [...]
  parent A

Commit A:
  tree [...]
  (no parent - root commit)
```

**3. Author vs Committer:**

- **Author**: Person who wrote the changes
- **Committer**: Person who applied the changes

These can differ (e.g., when applying patches from others).

**4. Timestamp:**

Unix timestamp + timezone offset:

```
1699564800 +0000
│           │
│           └─ Timezone: UTC (+0000)
└─ Timestamp: 1699564800 (2023-11-10 00:00:00 UTC)
```

**5. Message:**

Commit message with optional description:

```
Initial commit

Add project structure with README and main script.
```

### Types of Commits

**1. Initial Commit:**

No parent commit:

```
tree [sha1]
author John Doe <john@example.com> 1699564800 +0000
committer John Doe <john@example.com> 1699564800 +0000

Initial commit
```

**2. Regular Commit:**

One parent:

```
tree [sha1]
parent [sha1-of-previous-commit]
author John Doe <john@example.com> 1699564900 +0000
committer John Doe <john@example.com> 1699564900 +0000

Add feature X
```

**3. Merge Commit:**

Multiple parents:

```
tree [sha1]
parent [sha1-of-main-branch]
parent [sha1-of-feature-branch]
author John Doe <john@example.com> 1699565000 +0000
committer John Doe <john@example.com> 1699565000 +0000

Merge branch 'feature' into main
```

### Commit Chain Example

```bash
# Create first commit
$ git commit -m "First"
[main a1b2c3d] First

$ git cat-file -p a1b2c3d
tree [tree1-sha1]
author John <john@example.com> 1699564800 +0000
committer John <john@example.com> 1699564800 +0000

First

# Create second commit
$ git commit -m "Second"
[main e4f5g6h] Second

$ git cat-file -p e4f5g6h
tree [tree2-sha1]
parent a1b2c3d  # Points to previous commit
author John <john@example.com> 1699564900 +0000
committer John <john@example.com> 1699564900 +0000

Second
```

**Commit graph:**

```
e4f5g6h (Second) ← main
    ↓
a1b2c3d (First)
```

## Tag Objects

### What is a Tag?

A **tag** object provides a permanent name for a specific commit. Tags are commonly used to mark releases.

### Types of Tags

**1. Lightweight Tag:**

Just a reference file (not an object):

```bash
$ git tag v1.0.0
$ cat .git/refs/tags/v1.0.0
e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
```

**2. Annotated Tag:**

A full object with metadata:

```bash
$ git tag -a v1.0.0 -m "Release version 1.0.0"
$ git cat-file -p v1.0.0
object e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
type commit
tag v1.0.0
tagger John Doe <john@example.com> 1699564800 +0000

Release version 1.0.0

First stable release with all core features.
```

### Annotated Tag Format

```
object [sha1]
type [commit|tag]
tag [tag-name]
tagger [name] <[email]> [timestamp] [timezone]

[tag message]
```

### When to Use Tags

**Lightweight tags** for:
- Temporary markers
- Local bookmarks
- Quick references

**Annotated tags** for:
- Release versions
- Important milestones
- Public releases (pushed to remotes)

## Object Relationships

### The Object Graph

Git objects form a directed acyclic graph (DAG):

```
Commit [abc123]
├── tree [def456]
│   ├── blob [111111] (README.md)
│   ├── blob [222222] (script.sh)
│   └── tree [333333] (src/)
│       ├── blob [444444] (main.py)
│       └── blob [555555] (utils.py)
└── parent [xyz789]
    └── tree [ghi012]
        └── ...
```

### Object Reuse

Git reuses objects when content is identical:

**Example: Moving a file**

```bash
# Initial state
$ git ls-tree HEAD
100644 blob abc123    file.txt

# Move file
$ git mv file.txt newdir/file.txt
$ git commit -m "Move file"

# Same blob, different tree
$ git ls-tree HEAD
100644 tree def456    newdir

$ git ls-tree HEAD:newdir
100644 blob abc123    file.txt  # Same blob!
```

### Object Dependencies

**Commit depends on:**
- Tree (must exist)
- Parent commit(s) (must exist)

**Tree depends on:**
- Blobs for files (must exist)
- Trees for subdirectories (must exist)

**Blob depends on:**
- Nothing (leaf nodes in graph)

This dependency structure ensures:
1. **Integrity**: Can't have broken references
2. **Garbage collection**: Can identify unreachable objects
3. **Compression**: Can pack related objects together

## Complete Example Walkthrough

Let's trace a complete workflow to see how objects are created and linked.

### Step 1: Initialize Repository

```bash
$ git init my-project
$ cd my-project
```

**Result:** Empty repository with no objects.

```bash
$ ls .git/objects/
info/  pack/
$ find .git/objects -type f
(empty)
```

### Step 2: Create First File

```bash
$ echo "# My Project" > README.md
$ git add README.md
```

**Result:** Blob object created.

```bash
$ git ls-files --stage
100644 8c01d89ae06311834ee4b1fab2f0414d35f01102 0	README.md

$ find .git/objects -type f
.git/objects/8c/01d89ae06311834ee4b1fab2f0414d35f01102
```

**Object graph:**

```
Blob [8c01d89] "# My Project\n"
```

### Step 3: Create First Commit

```bash
$ git commit -m "Initial commit"
[main (root-commit) a1b2c3d] Initial commit
 1 file changed, 1 insertion(+)
 create mode 100644 README.md
```

**Result:** Tree and commit objects created.

```bash
$ find .git/objects -type f
.git/objects/8c/01d89ae06311834ee4b1fab2f0414d35f01102  # Blob
.git/objects/3b/18e512dba79e4c8300dd08aeb37f8e728b8dad  # Tree
.git/objects/a1/b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0  # Commit
```

**Object graph:**

```
Commit [a1b2c3d] "Initial commit"
└── Tree [3b18e51]
    └── Blob [8c01d89] "README.md"
```

**Commit content:**

```bash
$ git cat-file -p a1b2c3d
tree 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
author John Doe <john@example.com> 1699564800 +0000
committer John Doe <john@example.com> 1699564800 +0000

Initial commit
```

**Tree content:**

```bash
$ git cat-file -p 3b18e51
100644 blob 8c01d89ae06311834ee4b1fab2f0414d35f01102    README.md
```

### Step 4: Add More Files

```bash
$ mkdir src
$ echo "print('Hello')" > src/main.py
$ echo "def helper(): pass" > src/utils.py
$ git add src/
```

**Result:** Two new blobs created.

```bash
$ git ls-files --stage
100644 8c01d89ae06311834ee4b1fab2f0414d35f01102 0	README.md
100644 5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689 0	src/main.py
100644 a3f5c8b2e8d4f9a7c6b5e3d2a1f0c8b7e6d5a4c3 0	src/utils.py
```

**Object graph:**

```
Blob [8c01d89] "README.md"
Blob [5e1c309] "main.py"
Blob [a3f5c8b] "utils.py"
```

### Step 5: Create Second Commit

```bash
$ git commit -m "Add source files"
[main e4f5g6h] Add source files
 2 files changed, 2 insertions(+)
 create mode 100644 src/main.py
 create mode 100644 src/utils.py
```

**Result:** New tree for `src/`, new root tree, new commit.

```bash
$ find .git/objects -type f
.git/objects/8c/01d89...  # Blob: README.md
.git/objects/5e/1c309...  # Blob: main.py
.git/objects/a3/f5c8b...  # Blob: utils.py
.git/objects/8a/b686e...  # Tree: src/
.git/objects/7d/9c45a...  # Tree: root (new)
.git/objects/a1/b2c3d...  # Commit: first
.git/objects/e4/f5g6h...  # Commit: second (new)
```

**Complete object graph:**

```
Commit [e4f5g6h] "Add source files"
├── parent: Commit [a1b2c3d]
│   └── tree: Tree [3b18e51]
│       └── Blob [8c01d89] "README.md"
└── tree: Tree [7d9c45a]
    ├── Blob [8c01d89] "README.md" (reused!)
    └── Tree [8ab686e] "src/"
        ├── Blob [5e1c309] "main.py"
        └── Blob [a3f5c8b] "utils.py"
```

**Second commit content:**

```bash
$ git cat-file -p e4f5g6h
tree 7d9c45abc123def456789abc123def456789abc1
parent a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
author John Doe <john@example.com> 1699564900 +0000
committer John Doe <john@example.com> 1699564900 +0000

Add source files
```

**Root tree content:**

```bash
$ git cat-file -p 7d9c45a
100644 blob 8c01d89ae06311834ee4b1fab2f0414d35f01102    README.md
040000 tree 8ab686eafeb1f44702738c8b0f24f2567c36da6d    src
```

**src/ tree content:**

```bash
$ git cat-file -p 8ab686e
100644 blob 5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689    main.py
100644 blob a3f5c8b2e8d4f9a7c6b5e3d2a1f0c8b7e6d5a4c3    utils.py
```

### Object Reuse in Action

Notice that `README.md` blob (`8c01d89`) is referenced by both trees:
- Tree `3b18e51` (first commit)
- Tree `7d9c45a` (second commit)

Git doesn't duplicate the blob - both trees point to the same object!

## Summary

Git's object model is simple yet powerful:

1. **Four object types**:
   - Blobs: File contents
   - Trees: Directory structures
   - Commits: Snapshots with metadata
   - Tags: Named references

2. **Key principles**:
   - Content-addressable (SHA-1 hashing)
   - Immutable (never modified)
   - Compressed (zlib)
   - Graph structure (DAG)

3. **Efficiency**:
   - Identical content stored once
   - Unchanged subdirectories reused
   - Fast hash-based lookups

4. **Relationships**:
   - Commits → Trees → Blobs
   - Commits → Parent commits
   - Tags → Commits

Understanding the object model helps you:
- Comprehend how Git stores data
- Troubleshoot repository issues
- Use advanced Git features
- Implement Git tools

For implementation details, see **implementation-guide.md**.
For practical examples, see **examples.md**.
