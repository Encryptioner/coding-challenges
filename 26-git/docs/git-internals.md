# Git Internals: A Deep Dive

This document explains how Git works internally, providing a tutorial-style guide to understanding Git's architecture and data structures.

## Table of Contents

1. [Introduction](#introduction)
2. [The .git Directory](#the-git-directory)
3. [Content-Addressable Storage](#content-addressable-storage)
4. [The Object Database](#the-object-database)
5. [References and Branches](#references-and-branches)
6. [The Index (Staging Area)](#the-index-staging-area)
7. [The Three Trees](#the-three-trees)
8. [How Commands Work Internally](#how-commands-work-internally)

## Introduction

At its core, Git is a **content-addressable filesystem** with a version control system (VCS) user interface written on top of it. Understanding this fundamental concept is key to mastering Git.

### What is Content-Addressable Storage?

Content-addressable storage means that data is stored and retrieved based on its content, not its location. In Git:

1. Every piece of content gets a unique identifier (SHA-1 hash)
2. The content is stored using this hash as the "address"
3. The same content always produces the same hash
4. You can retrieve content by providing its hash

This design makes Git:
- **Efficient**: Identical content is never stored twice
- **Fast**: Hash lookups are extremely quick
- **Reliable**: Content integrity is verified by the hash
- **Distributed**: Any two repositories can easily compare content

### Example: Content Addressing

```bash
# Calculate SHA-1 hash of a string
$ echo "Hello, Git!" | git hash-object --stdin
e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d

# Store it in the database
$ echo "Hello, Git!" | git hash-object --stdin -w
e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d

# Retrieve it using the hash
$ git cat-file -p e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
Hello, Git!
```

The content "Hello, Git!" is always stored at the same address (hash), regardless of filename or location.

## The .git Directory

When you run `git init`, Git creates a `.git` directory that contains everything Git needs. Let's explore its structure:

```
.git/
├── HEAD                # Points to current branch
├── config              # Repository configuration
├── description         # Repository description (for GitWeb)
├── hooks/              # Client/server hook scripts
├── info/               # Global exclude file
│   └── exclude
├── objects/            # Object database (blobs, trees, commits, tags)
│   ├── [00-ff]/        # First 2 chars of SHA-1 hash
│   ├── info/
│   └── pack/           # Packed objects for efficiency
└── refs/               # References (branches, tags, remotes)
    ├── heads/          # Local branches
    ├── tags/           # Tags
    └── remotes/        # Remote branches
```

### Key Files and Directories

#### HEAD

The `HEAD` file tells Git which branch you're currently on:

```bash
$ cat .git/HEAD
ref: refs/heads/main
```

When you checkout a commit directly (detached HEAD), it contains a SHA-1 hash instead:

```bash
$ cat .git/HEAD
e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
```

#### objects/

This is Git's **object database** where all content is stored. Objects are organized by their SHA-1 hash:

```
objects/
├── e2/
│   └── a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
├── 3b/
│   └── 18e512dba79e4c8300dd08aeb37f8e728b8dad
└── ...
```

The first 2 characters of the hash become the directory name, and the remaining 38 characters become the filename. This prevents having too many files in a single directory.

#### refs/

References are human-readable names that point to commit SHA-1 hashes:

```
refs/
├── heads/
│   ├── main       # Points to latest commit on main
│   └── feature    # Points to latest commit on feature
└── tags/
    └── v1.0.0     # Points to tagged commit
```

Example branch file:
```bash
$ cat .git/refs/heads/main
e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
```

#### index

The index file (also called staging area) stores information about files that will go into the next commit. It's a binary file that contains:

- File mode (permissions)
- SHA-1 hash of file contents
- Filename
- Timestamps and other metadata

## Content-Addressable Storage

Let's dive deeper into how Git calculates and uses SHA-1 hashes.

### SHA-1 Hashing Process

Git doesn't just hash the file contents. It creates a specific format:

```
header = "{object_type} {size}\0"
content = header + file_data
sha1_hash = SHA1(content)
```

**Example:**

File content: `Hello, Git!\n` (12 bytes)

```python
import hashlib

content = b"Hello, Git!\n"
header = f"blob {len(content)}\0".encode()
store = header + content

# Result: b"blob 12\0Hello, Git!\n"
sha1 = hashlib.sha1(store).hexdigest()
# Result: "e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d"
```

### Object Storage Format

Git compresses objects using zlib before storing them:

```python
import zlib

compressed = zlib.compress(store)
# Write to .git/objects/e2/a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
```

To read an object:

```python
import zlib

# Read from .git/objects/e2/a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
with open(object_path, 'rb') as f:
    compressed_data = f.read()

# Decompress
data = zlib.decompress(compressed_data)
# Result: b"blob 12\0Hello, Git!\n"

# Split header and content
null_byte = data.index(b'\0')
header = data[:null_byte].decode()
content = data[null_byte + 1:]

# Parse header
obj_type, size = header.split(' ')
```

### Why SHA-1?

Git uses SHA-1 (Secure Hash Algorithm 1) which produces a 160-bit (20-byte) hash. When represented in hexadecimal, this becomes a 40-character string.

**Properties that make SHA-1 suitable for Git:**

1. **Deterministic**: Same content always produces the same hash
2. **Fast**: Quick to compute
3. **Collision-resistant**: Extremely unlikely for two different contents to have the same hash
4. **Distributed**: Any two repositories can independently verify content integrity

**Note:** Git is transitioning to SHA-256 for improved security, but SHA-1 remains the default.

## The Object Database

Git stores four types of objects in its database:

1. **Blob** (Binary Large Object): File contents
2. **Tree**: Directory structure
3. **Commit**: Snapshot with metadata
4. **Tag**: Named reference to a commit

### Blob Objects

Blobs store the contents of files. They contain **only the data**, not the filename or any other metadata.

```bash
# Create a blob
$ echo "Hello, Git!" | git hash-object -w --stdin
e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d

# View blob type
$ git cat-file -t e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
blob

# View blob content
$ git cat-file -p e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
Hello, Git!
```

**Key insight:** Two files with identical content share the same blob, even if they have different names or are in different directories.

### Tree Objects

Trees store directory structures. Each tree entry contains:

- **Mode**: File permissions (100644 for regular files, 100755 for executables, 040000 for directories)
- **Type**: Object type (blob or tree)
- **SHA-1**: Hash of the object
- **Name**: Filename or directory name

**Tree format:**

```
[mode] [type] [sha1]\t[name]\n
```

**Example tree:**

```bash
$ git cat-file -p 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
100644 blob e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d    README.md
100755 blob 5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689    script.sh
040000 tree 8ab686eafeb1f44702738c8b0f24f2567c36da6d    src
```

This tree represents a directory with:
- A regular file: `README.md`
- An executable file: `script.sh`
- A subdirectory: `src/` (which is itself a tree object)

**Binary format:**

Trees are stored in binary format for efficiency:

```
[mode as string] [space] [filename] [null byte] [20-byte SHA-1]
```

Example:
```
100644 README.md\0[20 bytes][mode] script.sh\0[20 bytes]
40000 src\0[20 bytes]
```

### Commit Objects

Commits tie everything together. A commit object contains:

- **tree**: SHA-1 of the root tree (snapshot of files)
- **parent**: SHA-1 of parent commit(s)
- **author**: Name, email, timestamp
- **committer**: Name, email, timestamp
- **message**: Commit message

**Example commit:**

```bash
$ git cat-file -p e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
tree 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
parent 5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689
author John Doe <john@example.com> 1699564800 +0000
committer John Doe <john@example.com> 1699564800 +0000

Initial commit

Add README and basic project structure
```

**Key insights:**

1. Commits point to trees, not blobs directly
2. The tree represents the complete snapshot of the project at that moment
3. Parent commits form a directed acyclic graph (DAG) of history
4. Merge commits have multiple parents

### Tag Objects

Tags provide named references to commits. There are two types:

1. **Lightweight tags**: Just a reference file pointing to a commit
2. **Annotated tags**: Full objects with metadata

**Annotated tag format:**

```bash
$ git cat-file -p v1.0.0
object e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
type commit
tag v1.0.0
tagger John Doe <john@example.com> 1699564800 +0000

Release version 1.0.0

First stable release with all core features
```

## References and Branches

References make Git user-friendly by providing human-readable names for commits.

### Branch References

A branch is simply a file containing a commit SHA-1:

```bash
$ cat .git/refs/heads/main
e2a86f6c5bfa8f8f8b5d3e5a5e8c8d9f4a2b1c3d
```

When you make a new commit on a branch:

1. Git creates the commit object
2. Updates the branch reference to point to the new commit
3. The new commit's parent points to the old commit

**Before commit:**
```
main -> [Commit A]
```

**After commit:**
```
main -> [Commit B] -> [Commit A]
```

### The DAG (Directed Acyclic Graph)

Git's history forms a DAG where:

- Nodes are commits
- Edges point from child commits to parent commits
- Multiple branches can exist simultaneously
- Merge commits have multiple parents

**Example:**

```
    A---B---C  (main)
     \
      D---E  (feature)
```

After merging:

```
    A---B---C---F  (main)
     \         /
      D-------E  (feature)
```

Commit F has two parents: C and E.

## The Index (Staging Area)

The index is Git's **staging area** - a middle ground between your working directory and the repository history.

### Purpose of the Index

1. **Selective staging**: Stage only specific changes
2. **Atomic commits**: Build up a logical commit piece by piece
3. **Performance**: Caching file metadata speeds up status checks

### Index File Format

The index is a binary file (`.git/index`) with entries for each staged file:

```
[ctime]       # File creation time
[mtime]       # File modification time
[dev]         # Device number
[ino]         # Inode number
[mode]        # File mode (permissions)
[uid]         # User ID
[gid]         # Group ID
[size]        # File size
[sha1]        # SHA-1 hash of content
[flags]       # Flags including name length
[name]        # Filename
```

### How 'git add' Works

When you run `git add file.txt`:

1. Git reads the file content
2. Creates a blob object with the content
3. Stores the blob in `.git/objects/`
4. Updates the index with the blob's SHA-1 and file metadata

```bash
$ git add file.txt

# Internally:
# 1. Read file.txt
# 2. sha1 = hash_object(file.txt, write=True)
# 3. Update .git/index with (mode, sha1, "file.txt")
```

## The Three Trees

Git manages three "trees" (snapshots of files):

1. **HEAD**: Last commit snapshot (what's in history)
2. **Index**: Proposed next commit snapshot (staging area)
3. **Working Directory**: Current files (what you see and edit)

### Workflow: The Three Trees in Action

**Initial state:**

```
HEAD:              file.txt (version A)
Index:             file.txt (version A)
Working Directory: file.txt (version A)
```

**After editing file.txt:**

```
HEAD:              file.txt (version A)
Index:             file.txt (version A)
Working Directory: file.txt (version B)  <-- Modified
```

`git status` shows: "Changes not staged for commit"

**After 'git add file.txt':**

```
HEAD:              file.txt (version A)
Index:             file.txt (version B)  <-- Staged
Working Directory: file.txt (version B)
```

`git status` shows: "Changes to be committed"

**After 'git commit':**

```
HEAD:              file.txt (version B)  <-- Committed
Index:             file.txt (version B)
Working Directory: file.txt (version B)
```

`git status` shows: "nothing to commit, working tree clean"

## How Commands Work Internally

Let's trace what happens internally when you run common Git commands.

### git init

```bash
$ git init
```

**Internally:**

1. Create `.git/` directory
2. Create subdirectories: `objects/`, `refs/heads/`, `refs/tags/`
3. Create `HEAD` file: `ref: refs/heads/main`
4. Create `config` file with default settings
5. Create empty `description` file

Result: A brand new Git repository ready to track files.

### git add

```bash
$ git add file.txt
```

**Internally:**

1. Read `file.txt` from working directory
2. Calculate SHA-1 hash of content with blob header
3. Compress content with zlib
4. Write to `.git/objects/[first-2-chars]/[remaining-38-chars]`
5. Update `.git/index` with file metadata and SHA-1

**Code equivalent:**

```python
def git_add(filename):
    # Read file
    with open(filename, 'rb') as f:
        content = f.read()

    # Create blob
    header = f"blob {len(content)}\0".encode()
    store = header + content
    sha1 = hashlib.sha1(store).hexdigest()

    # Store object
    compressed = zlib.compress(store)
    obj_path = f".git/objects/{sha1[:2]}/{sha1[2:]}"
    os.makedirs(os.path.dirname(obj_path), exist_ok=True)
    with open(obj_path, 'wb') as f:
        f.write(compressed)

    # Update index
    update_index(filename, sha1)
```

### git commit

```bash
$ git commit -m "Add feature"
```

**Internally:**

1. Read `.git/index` to get all staged files
2. Build tree object(s) from index entries
3. Get parent commit from `.git/refs/heads/[current-branch]`
4. Create commit object with tree, parent, author, timestamp, message
5. Write commit object to `.git/objects/`
6. Update branch reference to point to new commit

**Code equivalent:**

```python
def git_commit(message):
    # Build tree from index
    tree_sha1 = build_tree_from_index()

    # Get parent
    current_branch = get_current_branch()  # From HEAD
    parent_sha1 = read_branch_ref(current_branch)

    # Build commit content
    commit_content = f"tree {tree_sha1}\n"
    if parent_sha1:
        commit_content += f"parent {parent_sha1}\n"
    commit_content += f"author {get_author()} {timestamp()} {timezone()}\n"
    commit_content += f"committer {get_committer()} {timestamp()} {timezone()}\n"
    commit_content += f"\n{message}\n"

    # Store commit
    commit_sha1 = hash_object(commit_content, type="commit", write=True)

    # Update branch
    update_branch_ref(current_branch, commit_sha1)

    return commit_sha1
```

### git status

```bash
$ git status
```

**Internally:**

1. Get HEAD commit and read its tree to get committed files
2. Read `.git/index` to get staged files
3. Scan working directory for current files
4. Compare all three:
   - **Staged but not committed**: Files in index different from HEAD
   - **Modified but not staged**: Files in working dir different from index
   - **Untracked**: Files in working dir not in index

**Three-way comparison:**

```python
def git_status():
    # Get files from HEAD tree
    head_files = get_head_tree_files()

    # Get files from index
    staged_files = read_index()

    # Get files from working directory
    working_files = scan_working_directory()

    # Compare
    for file, sha1 in staged_files.items():
        if file not in head_files or head_files[file] != sha1:
            print(f"Changes to be committed: {file}")

    for file, sha1 in working_files.items():
        if file in staged_files and staged_files[file] != sha1:
            print(f"Changes not staged: {file}")
        elif file not in staged_files:
            print(f"Untracked: {file}")
```

### git log

```bash
$ git log
```

**Internally:**

1. Get current commit from HEAD (or specified commit)
2. Read and display commit object
3. Follow parent pointer to previous commit
4. Repeat until reaching initial commit (no parent)

**Code equivalent:**

```python
def git_log():
    # Start from HEAD
    commit_sha1 = get_head_commit()

    while commit_sha1:
        # Read commit object
        commit = read_object(commit_sha1)

        # Display commit
        print(f"commit {commit_sha1}")
        print(f"Author: {commit.author}")
        print(f"Date: {commit.date}")
        print(f"\n    {commit.message}\n")

        # Move to parent
        commit_sha1 = commit.parent
```

## Summary

Git's internal design is elegant and efficient:

1. **Content-addressable storage**: Everything is stored by its SHA-1 hash
2. **Four object types**: Blobs (files), trees (directories), commits (snapshots), tags (named references)
3. **Immutable objects**: Once created, objects never change
4. **References**: Human-readable names (branches, tags) point to commits
5. **Three trees**: HEAD (history), index (staging), working directory (current files)
6. **DAG history**: Commits form a directed acyclic graph

Understanding these internals helps you:
- Troubleshoot issues more effectively
- Use advanced Git features confidently
- Appreciate Git's design decisions
- Implement Git tools and extensions

The next documents dive deeper into specific topics:
- **object-model.md**: Deep dive into Git objects
- **implementation-guide.md**: How to implement Git from scratch
- **examples.md**: Practical examples and use cases
